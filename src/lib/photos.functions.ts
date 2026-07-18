import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SITE } from "@/lib/site";
import {
  PHOTO_SIGNED_URL_TTL_SECONDS,
  PHOTO_CAPTION_MAX_LENGTH,
  PHOTO_MAX_FILES,
  PHOTO_MAX_FILE_BYTES,
  PHOTO_MAX_DATA_URL_LENGTH,
} from "@/lib/photo-config";

const uploadSchema = z.object({
  uploaderName: z.string().trim().min(1).max(80),
  uploaderEmail: z.string().trim().email().max(200).optional().nullable(),
  caption: z.string().trim().max(PHOTO_CAPTION_MAX_LENGTH).optional().nullable(),
  honeypot: z.string().max(200).optional().nullable(),
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(200),
        contentType: z.string().regex(/^image\/(jpeg|png|webp|jpg)$/i),
        dataUrl: z.string().startsWith("data:image/").max(PHOTO_MAX_DATA_URL_LENGTH),
      }),
    )
    .min(1)
    .max(PHOTO_MAX_FILES),
});

export const uploadGuestPhotos = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; uploaded: number }> => {
    if (data.honeypot && data.honeypot.trim().length > 0) return { ok: true, uploaded: 0 };
    const { isFeatureEnabled } = await import("@/lib/feature-flags.functions");
    if (!(await isFeatureEnabled("guest_photo_uploads")))
      throw new Error("Photo uploads aren't open right now.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let uploaded = 0;
    for (const f of data.files) {
      const base64 = f.dataUrl.split(",")[1] ?? "";
      const bytes = Buffer.from(base64, "base64");
      if (bytes.byteLength > PHOTO_MAX_FILE_BYTES) continue;
      const ext = (f.contentType.split("/")[1] ?? "jpg").toLowerCase();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("guest-photos")
        .upload(path, bytes, { contentType: f.contentType, upsert: false });
      if (upErr) {
        console.error("upload err", upErr);
        continue;
      }
      await supabaseAdmin.from("guest_photos").insert({
        storage_path: path,
        uploader_name: data.uploaderName,
        uploader_email: data.uploaderEmail ?? null,
        caption: data.caption ?? null,
        status: "pending",
      });
      uploaded++;
    }

    // Every file failed (bad payload, storage error, etc.) — don't report
    // success when nothing actually landed.
    if (uploaded === 0) {
      throw new Error("We couldn't upload your photos. Please try again.");
    }

    // Fire-and-forget notifications. Never let email failures break the upload.
    if (uploaded > 0) {
      try {
        const { enqueueAppEmail, getAdminNotificationEmails } =
          await import("@/lib/email/enqueue.server");
        const idemBase = `photo-${new Date().toISOString()}-${data.uploaderName}`;

        if (data.uploaderEmail) {
          await enqueueAppEmail({
            templateName: "photo-received",
            to: data.uploaderEmail,
            idempotencyKey: `${idemBase}-uploader`,
            data: { uploaderName: data.uploaderName, count: uploaded },
          });
        }

        const admins = getAdminNotificationEmails();
        if (admins.length > 0) {
          const details = [
            { label: "Uploader", value: data.uploaderName },
            { label: "Photos", value: String(uploaded) },
          ];
          if (data.uploaderEmail) details.push({ label: "Email", value: data.uploaderEmail });
          if (data.caption) details.push({ label: "Caption", value: data.caption });

          await Promise.all(
            admins.map((to) =>
              enqueueAppEmail({
                templateName: "admin-notification",
                to,
                idempotencyKey: `${idemBase}-admin-${to}`,
                data: {
                  kind: "photo",
                  headline: `${uploaded} new photo${uploaded > 1 ? "s" : ""} from ${data.uploaderName}`,
                  summary: `Pending moderation in the admin dashboard.`,
                  details,
                  adminUrl: `${SITE.siteUrl}${SITE.adminUrl}`,
                },
              }),
            ),
          );
        }
      } catch (e) {
        console.error("Photo email notification failed", e);
      }
    }

    return { ok: true, uploaded };
  });

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploader_name: string;
}

export const listApprovedPhotos = createServerFn({ method: "GET" }).handler(
  async (): Promise<GalleryPhoto[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("guest_photos")
      .select("id, storage_path, caption, uploader_name")
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(200);
    const signedRows = await Promise.all(
      (data ?? []).map(async (row) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("guest-photos")
          .createSignedUrl(row.storage_path, PHOTO_SIGNED_URL_TTL_SECONDS);
        return signed?.signedUrl
          ? {
              id: row.id,
              url: signed.signedUrl,
              caption: row.caption,
              uploader_name: row.uploader_name,
            }
          : null;
      }),
    );
    return signedRows.filter((r): r is GalleryPhoto => r !== null);
  },
);
