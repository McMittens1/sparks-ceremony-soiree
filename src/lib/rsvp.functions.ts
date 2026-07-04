import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Types shared with the UI ----------

export interface PartyMember {
  name: string;
  is_child: boolean;
}

export interface AttendeeChoice {
  name: string;
  is_child: boolean;
  attending: boolean;
}

export interface GuestAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface PublicGuest {
  id: string;
  slug: string;
  primary_name: string;
  party_members: PartyMember[];
  email: string | null;
  phone: string | null;
  address: GuestAddress;
}

export interface PublicRsvp {
  status: "attending" | "not_attending" | "partial";
  attendees: AttendeeChoice[];
  address_confirmed: boolean;
  address: GuestAddress | null;
  song_request: string | null;
  message: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface AdminGuestRow {
  id: string;
  slug: string;
  primary_name: string;
  party_members: PartyMember[];
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  invite_notes: string | null;
  created_at: string;
  rsvp: PublicRsvp | null;
}

// ---------- Helpers ----------

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
  return supabaseAdmin;
}

function randomSlug(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const partyMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  is_child: z.boolean(),
});

const attendeeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  is_child: z.boolean(),
  attending: z.boolean(),
});

const addressSchema = z.object({
  line1: z.string().trim().max(200).optional().or(z.literal("")),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
});

function mapGuestRow(row: {
  id: string; slug: string; primary_name: string; party_members: unknown;
  email: string | null; phone: string | null;
  address_line1: string | null; address_line2: string | null;
  city: string | null; state: string | null; postal_code: string | null; country: string | null;
}): PublicGuest {
  const party = Array.isArray(row.party_members)
    ? (row.party_members as PartyMember[]).filter((p) => p && typeof p.name === "string")
    : [];
  return {
    id: row.id,
    slug: row.slug,
    primary_name: row.primary_name,
    party_members: party,
    email: row.email,
    phone: row.phone,
    address: {
      line1: row.address_line1 ?? undefined,
      line2: row.address_line2 ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      postal_code: row.postal_code ?? undefined,
      country: row.country ?? undefined,
    },
  };
}

// ---------- Public server functions ----------

// Fuzzy name lookup, returns lightweight matches.
export const lookupGuest = createServerFn({ method: "POST" })
  .validator((d: { query: string }) =>
    z.object({ query: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ matches: { slug: string; primary_name: string; party_size: number }[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query.trim();

    // Try exact slug match first (invites are case-insensitive short codes).
    const upper = q.toUpperCase();
    if (/^[A-Z0-9]{4,10}$/.test(upper)) {
      const { data: bySlug } = await supabaseAdmin
        .from("guests").select("slug, primary_name, party_members")
        .eq("slug", upper).limit(1);
      if (bySlug && bySlug.length) {
        return {
          matches: bySlug.map((r) => ({
            slug: r.slug,
            primary_name: r.primary_name,
            party_size: Array.isArray(r.party_members) ? (r.party_members as unknown[]).length : 0,
          })),
        };
      }
    }

    // Fuzzy name search using pg_trgm (case-insensitive, tolerates typos).
    const { data: rows } = await supabaseAdmin
      .from("guests")
      .select("slug, primary_name, party_members")
      .ilike("primary_name", `%${q}%`)
      .limit(8);

    return {
      matches: (rows ?? []).map((r) => ({
        slug: r.slug,
        primary_name: r.primary_name,
        party_size: Array.isArray(r.party_members) ? (r.party_members as unknown[]).length : 0,
      })),
    };
  });

// Full guest + existing RSVP if any. Public — only exposes what the RSVP UI needs.
export const getGuestBySlug = createServerFn({ method: "POST" })
  .validator((d: { slug: string }) =>
    z.object({ slug: z.string().trim().min(1).max(20) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ guest: PublicGuest; rsvp: PublicRsvp | null } | { guest: null; rsvp: null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: g } = await supabaseAdmin
      .from("guests")
      .select("id, slug, primary_name, party_members, email, phone, address_line1, address_line2, city, state, postal_code, country")
      .eq("slug", data.slug.toUpperCase())
      .maybeSingle();
    if (!g) return { guest: null, rsvp: null };

    const guest = mapGuestRow(g);

    const { data: r } = await supabaseAdmin
      .from("rsvps")
      .select("status, attendees, address_confirmed, address, song_request, message, submitted_at, updated_at")
      .eq("guest_id", g.id)
      .maybeSingle();

    const rsvp: PublicRsvp | null = r
      ? {
          status: r.status as PublicRsvp["status"],
          attendees: (Array.isArray(r.attendees) ? (r.attendees as unknown as AttendeeChoice[]) : []),
          address_confirmed: !!r.address_confirmed,
          address: (r.address as unknown as GuestAddress | null) ?? null,
          song_request: r.song_request,
          message: r.message,
          submitted_at: r.submitted_at,
          updated_at: r.updated_at,
        }
      : null;

    return { guest, rsvp };
  });

const submitSchema = z.object({
  slug: z.string().trim().min(1).max(20),
  attendees: z.array(attendeeSchema).min(1).max(20),
  address_confirmed: z.boolean(),
  address: addressSchema.optional(),
  song_request: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const submitRsvp = createServerFn({ method: "POST" })
  .validator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: g, error: gErr } = await supabaseAdmin
      .from("guests").select("id, party_members").eq("slug", data.slug.toUpperCase()).maybeSingle();
    if (gErr || !g) throw new Error("Guest not found");

    // Cap attendees at invited party size + 1 for a plus-one buffer.
    const maxAllowed = Math.max(
      1,
      (Array.isArray(g.party_members) ? (g.party_members as unknown[]).length : 1) + 1,
    );
    if (data.attendees.length > maxAllowed) throw new Error("Too many guests for this invite");

    const anyYes = data.attendees.some((a) => a.attending);
    const anyNo = data.attendees.some((a) => !a.attending);
    const status: PublicRsvp["status"] = anyYes && anyNo ? "partial" : anyYes ? "attending" : "not_attending";

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("rsvps").upsert(
      {
        guest_id: g.id,
        status,
        attendees: data.attendees,
        address_confirmed: data.address_confirmed,
        address: data.address ?? null,
        song_request: data.song_request?.trim() || null,
        message: data.message?.trim() || null,
        submitted_at: now,
        updated_at: now,
      },
      { onConflict: "guest_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin server functions ----------

export const listGuestsWithRsvps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminGuestRow[]> => {
    const sb = await ensureAdmin(context.userId);
    const { data: guests } = await sb
      .from("guests")
      .select("*")
      .order("primary_name", { ascending: true });
    const { data: rsvps } = await sb
      .from("rsvps")
      .select("*");
    const rsvpByGuest = new Map<string, PublicRsvp>();
    for (const r of rsvps ?? []) {
      rsvpByGuest.set(r.guest_id, {
        status: r.status as PublicRsvp["status"],
        attendees: (Array.isArray(r.attendees) ? (r.attendees as unknown as AttendeeChoice[]) : []),
        address_confirmed: !!r.address_confirmed,
        address: (r.address as unknown as GuestAddress | null) ?? null,
        song_request: r.song_request,
        message: r.message,
        submitted_at: r.submitted_at,
        updated_at: r.updated_at,
      });
    }
    return (guests ?? []).map((g): AdminGuestRow => ({
      id: g.id,
      slug: g.slug,
      primary_name: g.primary_name,
      party_members: Array.isArray(g.party_members) ? (g.party_members as unknown as PartyMember[]) : [],
      phone: g.phone,
      email: g.email,
      address_line1: g.address_line1,
      address_line2: g.address_line2,
      city: g.city,
      state: g.state,
      postal_code: g.postal_code,
      country: g.country,
      invite_notes: g.invite_notes,
      created_at: g.created_at,
      rsvp: rsvpByGuest.get(g.id) ?? null,
    }));
  });

const guestUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(20).optional().or(z.literal("")),
  primary_name: z.string().trim().min(1).max(200),
  party_members: z.array(partyMemberSchema).max(20),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  address_line1: z.string().trim().max(200).optional().or(z.literal("")),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  invite_notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const upsertGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => guestUpsertSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    const sb = await ensureAdmin(context.userId);

    const payload = {
      primary_name: data.primary_name,
      party_members: data.party_members,
      phone: data.phone || null,
      email: data.email || null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      invite_notes: data.invite_notes || null,
    };

    if (data.id) {
      const update: Record<string, unknown> = { ...payload };
      if (data.slug) update.slug = data.slug.toUpperCase();
      const { data: updated, error } = await sb
        .from("guests").update(update).eq("id", data.id).select("id, slug").maybeSingle();
      if (error || !updated) throw new Error(error?.message ?? "Update failed");
      return { id: updated.id, slug: updated.slug };
    }

    // Insert with unique slug (retry on collision).
    for (let i = 0; i < 5; i++) {
      const slug = (data.slug || randomSlug()).toUpperCase();
      const { data: ins, error } = await sb
        .from("guests").insert({ ...payload, slug }).select("id, slug").maybeSingle();
      if (!error && ins) return { id: ins.id, slug: ins.slug };
      if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not generate a unique invite code, please try again.");
  });

export const deleteGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = await ensureAdmin(context.userId);
    const { error } = await sb.from("guests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Import CSV as text: columns primary_name, party_members (semicolon-separated names, append " (child)" for kids), phone, email, address_line1, address_line2, city, state, postal_code, country, invite_notes
// A missing column is fine. The first row is treated as a header when it contains "primary_name".
export const importGuestsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { csv: string }) => z.object({ csv: z.string().min(1).max(200_000) }).parse(d))
  .handler(async ({ data, context }): Promise<{ inserted: number; skipped: number }> => {
    const sb = await ensureAdmin(context.userId);
    const rows = parseCsv(data.csv);
    if (!rows.length) return { inserted: 0, skipped: 0 };

    let header: string[];
    let body: string[][];
    if (rows[0].some((c) => c.toLowerCase().includes("primary_name"))) {
      header = rows[0].map((c) => c.trim().toLowerCase());
      body = rows.slice(1);
    } else {
      header = ["primary_name", "party_members", "phone", "email", "address_line1", "address_line2", "city", "state", "postal_code", "country", "invite_notes"];
      body = rows;
    }

    let inserted = 0;
    let skipped = 0;
    for (const cols of body) {
      const rec: Record<string, string> = {};
      header.forEach((h, i) => { rec[h] = (cols[i] ?? "").trim(); });
      if (!rec.primary_name) { skipped++; continue; }

      const partyRaw = rec.party_members ?? "";
      const party_members: PartyMember[] = partyRaw
        ? partyRaw.split(";").map((s) => s.trim()).filter(Boolean).map((n) => {
            const isChild = /\(child\)/i.test(n);
            return { name: n.replace(/\s*\(child\)\s*/i, "").trim(), is_child: isChild };
          })
        : [{ name: rec.primary_name, is_child: false }];

      // Retry a few times for slug collisions.
      let success = false;
      for (let i = 0; i < 5 && !success; i++) {
        const slug = randomSlug();
        const { error } = await sb.from("guests").insert({
          slug,
          primary_name: rec.primary_name,
          party_members,
          phone: rec.phone || null,
          email: rec.email || null,
          address_line1: rec.address_line1 || null,
          address_line2: rec.address_line2 || null,
          city: rec.city || null,
          state: rec.state || null,
          postal_code: rec.postal_code || null,
          country: rec.country || null,
          invite_notes: rec.invite_notes || null,
        });
        if (!error) { inserted++; success = true; }
        else if (!error.message.toLowerCase().includes("duplicate")) { skipped++; break; }
      }
      if (!success && inserted === 0) skipped++;
    }
    return { inserted, skipped };
  });

// Minimal CSV parser: handles quoted fields, commas, newlines, and doubled quotes.
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && input[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some((c) => c.length)) rows.push(cur);
        cur = [];
      } else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); if (cur.some((c) => c.length)) rows.push(cur); }
  return rows;
}
