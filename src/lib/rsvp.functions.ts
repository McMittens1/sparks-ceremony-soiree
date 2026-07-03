import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guestSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(1).max(80),
  is_child: z.boolean(),
  attending: z.boolean().nullable(),
});

const submitSchema = z.object({
  inviteId: z.string().uuid(),
  guests: z.array(guestSchema).max(20),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
  honeypot: z.string().max(200).optional().nullable(),
});

export interface LookupResult {
  ok: boolean;
  invite?: { id: string; party_name: string; max_guests: number; language: string };
  guests?: { id: string; full_name: string; is_child: boolean; attending: boolean | null }[];
  contact?: { email: string | null; phone: string | null; message: string | null };
  deadlinePassed?: boolean;
  deadline?: string;
}

export interface SubmitResult {
  ok: boolean;
  error?: "CLOSED" | "TOO_MANY" | "NO_GUESTS" | "VALIDATION" | "SERVER";
  max?: number;
  recap?: {
    partyName: string;
    guests: { full_name: string; attending: boolean | null; is_child: boolean }[];
    contactEmail: string;
  };
}

export const lookupInvite = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) =>
    z.object({ query: z.string().trim().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }): Promise<LookupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query.trim();

    // deadline
    const { data: cfg } = await supabaseAdmin.from("app_config").select("rsvp_deadline").eq("id", 1).maybeSingle();
    const deadline = cfg?.rsvp_deadline as string | undefined;
    const deadlinePassed = deadline ? new Date(deadline + "T23:59:59") < new Date() : false;

    // try invite code first (case-insensitive exact)
    let inviteRow: any = null;
    const { data: byCode } = await supabaseAdmin
      .from("invites").select("id, party_name, max_guests, language").ilike("code", q).maybeSingle();
    if (byCode) inviteRow = byCode;

    if (!inviteRow) {
      // find via guest name
      const { data: guestMatch } = await supabaseAdmin
        .from("guests").select("invite_id, invites!inner(id, party_name, max_guests, language)")
        .ilike("full_name", `%${q}%`).limit(1);
      if (guestMatch && guestMatch.length) {
        // @ts-expect-error nested join shape
        inviteRow = guestMatch[0].invites;
      }
    }
    if (!inviteRow) {
      // also try party name substring
      const { data: byParty } = await supabaseAdmin
        .from("invites").select("id, party_name, max_guests, language").ilike("party_name", `%${q}%`).limit(1);
      if (byParty && byParty.length) inviteRow = byParty[0];
    }
    if (!inviteRow) return { ok: false, deadlinePassed, deadline };

    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id, full_name, is_child, attending, is_primary, created_at")
      .eq("invite_id", inviteRow.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    const { data: sub } = await supabaseAdmin
      .from("rsvp_submissions").select("contact_email, contact_phone, message")
      .eq("invite_id", inviteRow.id).maybeSingle();

    return {
      ok: true,
      invite: inviteRow,
      guests: (guests ?? []).map((g: any) => ({
        id: g.id, full_name: g.full_name, is_child: g.is_child, attending: g.attending,
      })),
      contact: sub ? { email: sub.contact_email, phone: sub.contact_phone, message: sub.message } : undefined,
      deadlinePassed,
      deadline,
    };
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitResult> => {
    // Honeypot — pretend success
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return { ok: true, recap: { partyName: "", guests: [], contactEmail: data.contactEmail } };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // deadline
    const { data: cfg } = await supabaseAdmin.from("app_config").select("rsvp_deadline").eq("id", 1).maybeSingle();
    const deadline = cfg?.rsvp_deadline as string | undefined;
    if (deadline && new Date(deadline + "T23:59:59") < new Date()) {
      return { ok: false, error: "CLOSED" };
    }

    // invite
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("invites").select("id, party_name, max_guests, language").eq("id", data.inviteId).maybeSingle();
    if (invErr || !invite) return { ok: false, error: "VALIDATION" };

    if (data.guests.length === 0) return { ok: false, error: "NO_GUESTS" };
    if (data.guests.length > invite.max_guests) return { ok: false, error: "TOO_MANY", max: invite.max_guests };

    // existing guests for this invite
    const { data: existing } = await supabaseAdmin
      .from("guests").select("id, added_by_guest").eq("invite_id", invite.id);
    const existingIds = new Set((existing ?? []).map((g: any) => g.id));
    const payloadIds = new Set(data.guests.filter((g) => g.id).map((g) => g.id!));

    // delete guest-added rows removed by user
    const toDelete = (existing ?? [])
      .filter((g: any) => g.added_by_guest && !payloadIds.has(g.id))
      .map((g: any) => g.id);
    if (toDelete.length) {
      await supabaseAdmin.from("guests").delete().in("id", toDelete);
    }

    // upsert existing, insert new
    for (const g of data.guests) {
      if (g.id && existingIds.has(g.id)) {
        await supabaseAdmin.from("guests").update({
          full_name: g.full_name,
          is_child: g.is_child,
          attending: g.attending,
        }).eq("id", g.id);
      } else {
        await supabaseAdmin.from("guests").insert({
          invite_id: invite.id,
          full_name: g.full_name,
          is_child: g.is_child,
          attending: g.attending,
          added_by_guest: true,
        });
      }
    }

    // upsert submission
    await supabaseAdmin.from("rsvp_submissions").upsert({
      invite_id: invite.id,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone ?? null,
      message: data.message ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "invite_id" });

    // fetch canonical guests for recap
    const { data: finalGuests } = await supabaseAdmin
      .from("guests").select("full_name, attending, is_child, is_primary, created_at")
      .eq("invite_id", invite.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    // send email (non-blocking failure)
    try {
      const { sendRsvpConfirmation } = await import("./email.server");
      await sendRsvpConfirmation({
        to: data.contactEmail,
        language: invite.language as "en" | "es",
        partyName: invite.party_name,
        guests: (finalGuests ?? []).map((g: any) => ({ full_name: g.full_name, attending: g.attending })),
      });
    } catch (err) {
      console.error("email failed", err);
    }

    return {
      ok: true,
      recap: {
        partyName: invite.party_name,
        guests: (finalGuests ?? []).map((g: any) => ({
          full_name: g.full_name, attending: g.attending, is_child: g.is_child,
        })),
        contactEmail: data.contactEmail,
      },
    };
  });
