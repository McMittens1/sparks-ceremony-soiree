import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export interface AdminPhoto {
  id: string; url: string; caption: string | null;
  uploader_name: string; uploader_email: string | null;
  status: "pending" | "approved" | "rejected"; created_at: string;
}

export const getAdminPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { status: "pending" | "approved" | "rejected" }) =>
    z.object({ status: z.enum(["pending", "approved", "rejected"]) }).parse(d))
  .handler(async ({ data, context }): Promise<AdminPhoto[]> => {
    const sb = await ensureAdmin(context.userId);
    const { data: rows } = await sb
      .from("guest_photos")
      .select("id, storage_path, caption, uploader_name, uploader_email, status, created_at")
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    const result: AdminPhoto[] = [];
    for (const row of rows ?? []) {
      const { data: signed } = await sb.storage.from("guest-photos").createSignedUrl(row.storage_path, 60 * 60);
      if (signed?.signedUrl) {
        result.push({
          id: row.id, url: signed.signedUrl, caption: row.caption,
          uploader_name: row.uploader_name, uploader_email: row.uploader_email,
          status: row.status as "pending" | "approved" | "rejected", created_at: row.created_at,
        });
      }
    }
    return result;
  });

export const setPhotoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; status: "approved" | "rejected" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const sb = await ensureAdmin(context.userId);
    await sb.from("guest_photos").update({
      status: data.status,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok: true };
  });

export const claimAdminIfFirst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; isAdmin: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: mine } = await supabaseAdmin
      .from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (mine) return { granted: false, isAdmin: true };
    const { count } = await supabaseAdmin
      .from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) return { granted: false, isAdmin: false };
    const { error } = await supabaseAdmin
      .from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) return { granted: false, isAdmin: false };
    return { granted: true, isAdmin: true };
  });
