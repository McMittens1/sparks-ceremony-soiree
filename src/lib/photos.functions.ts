import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadSchema = z.object({
  uploaderName: z.string().trim().min(1).max(80),
  uploaderEmail: z.string().trim().email().max(200).optional().nullable(),
  caption: z.string().trim().max(400).optional().nullable(),
  honeypot: z.string().max(200).optional().nullable(),
  files: z.array(z.object({
    filename: z.string().min(1).max(200),
    contentType: z.string().regex(/^image\/(jpeg|png|webp|jpg)$/i),
    dataUrl: z.string().startsWith("data:image/").max(15_000_000), // ~10 MB base64
  })).min(1).max(5),
});

export const uploadGuestPhotos = createServerFn({ method: "POST" })
  .validator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (data.honeypot && data.honeypot.trim().length > 0) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const f of data.files) {
      const base64 = f.dataUrl.split(",")[1] ?? "";
      const bytes = Buffer.from(base64, "base64");
      if (bytes.byteLength > 10 * 1024 * 1024) continue;
      const ext = (f.contentType.split("/")[1] ?? "jpg").toLowerCase();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("guest-photos")
        .upload(path, bytes, { contentType: f.contentType, upsert: false });
      if (upErr) { console.error("upload err", upErr); continue; }
      await supabaseAdmin.from("guest_photos").insert({
        storage_path: path,
        uploader_name: data.uploaderName,
        uploader_email: data.uploaderEmail ?? null,
        caption: data.caption ?? null,
        status: "pending",
      });
    }
    return { ok: true };
  });

export interface GalleryPhoto { id: string; url: string; caption: string | null; uploader_name: string }

export const listApprovedPhotos = createServerFn({ method: "GET" })
  .handler(async (): Promise<GalleryPhoto[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("guest_photos")
      .select("id, storage_path, caption, uploader_name")
      .eq("status", "approved")
      .order("reviewed_at", { ascending: false })
      .limit(200);
    const result: GalleryPhoto[] = [];
    for (const row of data ?? []) {
      const { data: signed } = await supabaseAdmin.storage
        .from("guest-photos").createSignedUrl(row.storage_path, 60 * 60 * 6);
      if (signed?.signedUrl) {
        result.push({ id: row.id, url: signed.signedUrl, caption: row.caption, uploader_name: row.uploader_name });
      }
    }
    return result;
  });
