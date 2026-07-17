import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { PHOTO_SIGNED_URL_TTL_SECONDS, PHOTO_CAPTION_MAX_LENGTH } from "@/lib/photo-config";

// Shared with the client-side route guard in `_authenticated/route.tsx` so
// there's a single source of truth for "does this user hold the admin role"
// — not a security boundary change, just avoiding a duplicated query.
export async function hasAdminRole(sb: SupabaseClient<Database>, userId: string): Promise<boolean> {
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !error && !!data;
}

// Uses the caller's own RLS-scoped client (attached by requireSupabaseAuth), not
// the service-role client — admin write access is enforced both here and by the
// matching "has_role(auth.uid(), 'admin')" RLS policies on these tables/bucket, so
// there's a database-level backstop if this check is ever missed on a new endpoint.
async function ensureAdmin(sb: SupabaseClient<Database>, userId: string) {
  if (!(await hasAdminRole(sb, userId))) throw new Error("Forbidden");
  return sb;
}

export interface AdminPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploader_name: string;
  uploader_email: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export const getAdminPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { status: "pending" | "approved" | "rejected" }) =>
    z.object({ status: z.enum(["pending", "approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<AdminPhoto[]> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data: rows } = await sb
      .from("guest_photos")
      .select("id, storage_path, caption, uploader_name, uploader_email, status, created_at")
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(500);
    const signedRows = await Promise.all(
      (rows ?? []).map(async (row) => {
        const { data: signed } = await sb.storage
          .from("guest-photos")
          .createSignedUrl(row.storage_path, PHOTO_SIGNED_URL_TTL_SECONDS);
        return signed?.signedUrl
          ? {
              id: row.id,
              url: signed.signedUrl,
              caption: row.caption,
              uploader_name: row.uploader_name,
              uploader_email: row.uploader_email,
              status: row.status as "pending" | "approved" | "rejected",
              created_at: row.created_at,
            }
          : null;
      }),
    );
    return signedRows.filter((r): r is AdminPhoto => r !== null);
  });

export const setPhotoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; status: "approved" | "rejected" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    await sb
      .from("guest_photos")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true };
  });

export const bulkSetPhotoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { ids: string[]; status: "approved" | "rejected" | "pending" }) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        status: z.enum(["approved", "rejected", "pending"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; count: number }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { error } = await sb
      .from("guest_photos")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .in("id", data.ids);
    if (error) {
      console.error("bulkSetPhotoStatus failed", error);
      throw new Error("Couldn't update those photos. Please try again.");
    }
    return { ok: true, count: data.ids.length };
  });

export const updatePhotoCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; caption: string }) =>
    z.object({ id: z.string().uuid(), caption: z.string().max(PHOTO_CAPTION_MAX_LENGTH) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const trimmed = data.caption.trim();
    const { error } = await sb
      .from("guest_photos")
      .update({
        caption: trimmed.length ? trimmed : null,
      })
      .eq("id", data.id);
    if (error) {
      console.error("updatePhotoCaption failed", error);
      throw new Error("Couldn't save that caption. Please try again.");
    }
    return { ok: true };
  });

export const deletePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data: row } = await sb
      .from("guest_photos")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      // Idempotent: ignore missing-object errors from storage
      await sb.storage.from("guest-photos").remove([row.storage_path]);
    }
    const { error } = await sb.from("guest_photos").delete().eq("id", data.id);
    if (error) {
      console.error("deletePhoto failed", error);
      throw new Error("Couldn't delete this photo. Please try again.");
    }
    return { ok: true };
  });

export const bulkDeletePhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; count: number }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data: rows } = await sb.from("guest_photos").select("storage_path").in("id", data.ids);
    const paths = (rows ?? []).map((r) => r.storage_path).filter(Boolean) as string[];
    if (paths.length) await sb.storage.from("guest-photos").remove(paths);
    const { error } = await sb.from("guest_photos").delete().in("id", data.ids);
    if (error) {
      console.error("bulkDeletePhotos failed", error);
      throw new Error("Couldn't delete those photos. Please try again.");
    }
    return { ok: true, count: data.ids.length };
  });

export const getPhotoCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ pending: number; approved: number; rejected: number }> => {
      const sb = await ensureAdmin(context.supabase, context.userId);
      const q = (s: "pending" | "approved" | "rejected") =>
        sb.from("guest_photos").select("id", { count: "exact", head: true }).eq("status", s);
      const [p, a, r] = await Promise.all([q("pending"), q("approved"), q("rejected")]);
      return { pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0 };
    },
  );

export const getRecentActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      rsvps_last_24h: number;
      rsvps_last_7d: number;
      photos_pending: number;
      photos_last_7d: number;
    }> => {
      const sb = await ensureAdmin(context.supabase, context.userId);
      const now = Date.now();
      const iso24 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const iso7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [r24, r7, pPending, p7] = await Promise.all([
        sb.from("rsvps").select("id", { count: "exact", head: true }).gte("submitted_at", iso24),
        sb.from("rsvps").select("id", { count: "exact", head: true }).gte("submitted_at", iso7d),
        sb
          .from("guest_photos")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        sb
          .from("guest_photos")
          .select("id", { count: "exact", head: true })
          .gte("created_at", iso7d),
      ]);
      return {
        rsvps_last_24h: r24.count ?? 0,
        rsvps_last_7d: r7.count ?? 0,
        photos_pending: pPending.count ?? 0,
        photos_last_7d: p7.count ?? 0,
      };
    },
  );

export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; isAdmin: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (mine) return { granted: false, isAdmin: true };
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, isAdmin: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) return { granted: false, isAdmin: false };
    return { granted: true, isAdmin: true };
  });
