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

export interface AdminRsvpRow {
  invite_id: string;
  party_name: string;
  max_guests: number;
  guests: { full_name: string; is_child: boolean; attending: boolean | null }[];
  contact_email: string | null;
  contact_phone: string | null;
  message: string | null;
  submitted_at: string | null;
}

export interface AdminSummary {
  attendingParties: number;
  declinedParties: number;
  pendingParties: number;
  attendingAdults: number;
  attendingChildren: number;
  rows: AdminRsvpRow[];
}

export const getAdminSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSummary> => {
    const sb = await ensureAdmin(context.userId);
    const { data: invites } = await sb.from("invites").select("id, party_name, max_guests").order("party_name");
    const { data: guests } = await sb.from("guests").select("invite_id, full_name, is_child, attending");
    const { data: subs } = await sb.from("rsvp_submissions").select("invite_id, contact_email, contact_phone, message, submitted_at");
    const guestsByInvite = new Map<string, any[]>();
    for (const g of guests ?? []) {
      const arr = guestsByInvite.get(g.invite_id) ?? [];
      arr.push(g); guestsByInvite.set(g.invite_id, arr);
    }
    const subByInvite = new Map<string, any>();
    for (const s of subs ?? []) subByInvite.set(s.invite_id, s);

    let attendingParties = 0, declinedParties = 0, pendingParties = 0;
    let attendingAdults = 0, attendingChildren = 0;
    const rows: AdminRsvpRow[] = [];
    for (const inv of invites ?? []) {
      const gs = guestsByInvite.get(inv.id) ?? [];
      const anyAtt = gs.some((g) => g.attending === true);
      const allDec = gs.length > 0 && gs.every((g) => g.attending === false);
      const anyPending = gs.some((g) => g.attending === null);
      const sub = subByInvite.get(inv.id);
      if (!sub) pendingParties++;
      else if (anyAtt) attendingParties++;
      else if (allDec) declinedParties++;
      else if (anyPending) pendingParties++;
      for (const g of gs) {
        if (g.attending === true) {
          if (g.is_child) attendingChildren++; else attendingAdults++;
        }
      }
      rows.push({
        invite_id: inv.id,
        party_name: inv.party_name,
        max_guests: inv.max_guests,
        guests: gs.map((g) => ({ full_name: g.full_name, is_child: g.is_child, attending: g.attending })),
        contact_email: sub?.contact_email ?? null,
        contact_phone: sub?.contact_phone ?? null,
        message: sub?.message ?? null,
        submitted_at: sub?.submitted_at ?? null,
      });
    }
    return { attendingParties, declinedParties, pendingParties, attendingAdults, attendingChildren, rows };
  });

export interface AdminPhoto {
  id: string; url: string; caption: string | null;
  uploader_name: string; uploader_email: string | null;
  status: "pending" | "approved" | "rejected"; created_at: string;
}

export const getAdminPhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status: "pending" | "approved" | "rejected" }) =>
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
  .inputValidator((d: { id: string; status: "approved" | "rejected" }) =>
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
