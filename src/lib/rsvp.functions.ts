import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SITE } from "@/lib/site";

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
  phone: string;
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
  phone: string;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  invite_notes: string | null;
  created_at: string;
  updated_at: string;
  rsvp: PublicRsvp | null;
  edit_token: string;
  verify_token: string;
  address_confirmed_at: string | null;
  address_updated_at: string | null;
  phone_verify_locked_until: string | null;
  phone_verify_failed_attempts: number;
  phone_verify_last_success_at: string | null;
}

// ---------- Helpers ----------

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { hasAdminRole } = await import("@/lib/admin.functions");
  if (!(await hasAdminRole(supabaseAdmin, userId))) throw new Error("Forbidden");
  return supabaseAdmin;
}

function randomSlug(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// Strips formatting and a recognized US (1) or Mexico (52 / 521) country
// code down to a bare national number. Used for dedup, storage-agnostic
// last-4-digit verification, and format validation alike — a phone number
// is stored as the admin typed it, and always normalized on read.
function normalizePhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("521")) d = d.slice(3);
  else if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d;
}

function isValidPhone(v: string): boolean {
  return /^\d{10}$/.test(normalizePhone(v));
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
  id: string;
  slug: string;
  primary_name: string;
  party_members: unknown;
  email: string | null;
  phone: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
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

function mapRsvpRow(
  r: {
    status: string;
    attendees: unknown;
    address_confirmed: boolean;
    address: unknown;
    song_request: string | null;
    message: string | null;
    submitted_at: string;
    updated_at: string;
  } | null,
): PublicRsvp | null {
  if (!r) return null;
  return {
    status: r.status as PublicRsvp["status"],
    attendees: Array.isArray(r.attendees) ? (r.attendees as unknown as AttendeeChoice[]) : [],
    address_confirmed: !!r.address_confirmed,
    address: (r.address as unknown as GuestAddress | null) ?? null,
    song_request: r.song_request,
    message: r.message,
    submitted_at: r.submitted_at,
    updated_at: r.updated_at,
  };
}

const GUEST_SELECT_COLUMNS =
  "id, slug, primary_name, party_members, email, phone, address_line1, address_line2, city, state, postal_code, country";
const RSVP_SELECT_COLUMNS =
  "status, attendees, address_confirmed, address, song_request, message, submitted_at, updated_at";

const PHONE_VERIFY_MAX_ATTEMPTS = 5;
const PHONE_VERIFY_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
// How long a "you picked this household from search results" token stays
// valid — just long enough to carry the guest into the next screen and type
// the last-4 digits.
const SELECT_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
// How long a successful phone verification authorizes writes (address
// updates, RSVP submission) for the browser that verified — generous enough
// to cover a slow, multi-field RSVP session in one sitting. Unlike the old
// household-row flag this replaced, this token is only ever handed to the
// browser that actually passed the last-4 check, so this window being long
// doesn't widen who can use it — just how long that one browser stays
// authorized.
const SESSION_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
// How long a Method 2 (personalized text link) token stays valid — this
// needs to work for months, sent well before the wedding.
const VERIFY_LINK_TTL_MS = 270 * 24 * 60 * 60 * 1000; // ~9 months

// Lightweight, best-effort per-IP rate limit for the public search box.
// Proportionate to this app's real traffic (a few dozen households), not a
// distributed limiter — resets whenever the server process restarts, which
// is an acceptable tradeoff here rather than a database table.
const LOOKUP_RATE_LIMIT_MAX = 20;
const LOOKUP_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();

function isLookupRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = lookupAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    lookupAttempts.set(ip, { count: 1, resetAt: now + LOOKUP_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOOKUP_RATE_LIMIT_MAX;
}

function requestIp(): string {
  const headers = getRequest()?.headers;
  return (
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// ---------- Public server functions ----------

// Fuzzy name lookup, returns lightweight matches. Deliberately never returns
// the real invite code (slug) — a search result hands back a short-lived
// "select" token instead, so a name search can't be used to harvest the
// codes that (combined with a phone-verify session) authorize writes. See
// resolveVerifyTarget/verifyHouseholdAccess below for how the token is
// redeemed.
export const lookupGuest = createServerFn({ method: "POST" })
  .validator((d: { query: string; honeypot?: string }) =>
    z
      .object({
        query: z.string().trim().min(1).max(120),
        honeypot: z.string().max(200).optional().nullable(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      matches: { selectToken: string; primary_name: string; party_size: number }[];
    }> => {
      // Bots that fill every field trip this; report an empty result rather
      // than an error so it looks like a normal no-match search.
      if (data.honeypot && data.honeypot.trim().length > 0) return { matches: [] };
      if (isLookupRateLimited(requestIp())) return { matches: [] };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { signRsvpToken } = await import("@/lib/rsvp-token.server");
      const q = data.query.trim();

      const toMatches = (rows: { id: string; primary_name: string; party_members: unknown }[]) =>
        Promise.all(
          rows.map(async (r) => ({
            selectToken: await signRsvpToken(r.id, "select", SELECT_TOKEN_TTL_MS),
            primary_name: r.primary_name,
            party_size: Array.isArray(r.party_members) ? (r.party_members as unknown[]).length : 0,
          })),
        );

      // Try exact slug match first (invites are case-insensitive short codes).
      const upper = q.toUpperCase();
      if (/^[A-Z0-9]{4,10}$/.test(upper)) {
        const { data: bySlug } = await supabaseAdmin
          .from("guests")
          .select("id, primary_name, party_members")
          .eq("slug", upper)
          .limit(1);
        if (bySlug && bySlug.length) {
          return { matches: await toMatches(bySlug) };
        }
      }

      // Fuzzy name search using pg_trgm (case-insensitive, tolerates typos).
      const { data: rows } = await supabaseAdmin
        .from("guests")
        .select("id, primary_name, party_members")
        .ilike("primary_name", `%${q}%`)
        .limit(8);

      return { matches: await toMatches(rows ?? []) };
    },
  );

// ---------- Household phone-last-4 verification ----------
// Both public entry points (typed name/code lookup, and a personalized
// TextMyWedding link) converge here: neither reveals a household's data —
// party list, address, phone, RSVP — until the last 4 digits of the
// household's on-file phone number are confirmed server-side. This is the
// one function both paths share, and the one place lockout is enforced.

// Resolves a household id from whichever locator was provided, without
// revealing anything about the household itself yet.
async function resolveVerifyTarget(input: {
  slug?: string;
  token?: string;
  selectToken?: string;
}): Promise<string | null> {
  if (input.selectToken) {
    const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
    const v = await verifyRsvpToken(input.selectToken, "select");
    return v.ok ? v.guestId : null;
  }
  if (input.token) {
    const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
    const v = await verifyRsvpToken(input.token, "verify");
    return v.ok ? v.guestId : null;
  }
  if (input.slug) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("slug", input.slug.toUpperCase())
      .maybeSingle();
    return data?.id ?? null;
  }
  return null;
}

// A lightweight, pre-verification label for a deep link (either a personalized
// token or a plain ?g=slug link) — lets the verify screen greet the household
// by name before they've proven anything. Reveals a name, nothing else: no
// address, phone, party list, or RSVP status.
export const getVerifyTargetLabel = createServerFn({ method: "POST" })
  .validator((d: { slug?: string; token?: string; selectToken?: string }) =>
    z
      .object({
        slug: z.string().trim().max(20).optional(),
        token: z.string().min(10).max(400).optional(),
        selectToken: z.string().min(10).max(400).optional(),
      })
      .refine(
        (v) => [v.slug, v.token, v.selectToken].filter(Boolean).length === 1,
        "Provide exactly one of a code, a link, or a selection",
      )
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true; primary_name: string } | { ok: false }> => {
    const guestId = await resolveVerifyTarget(data);
    if (!guestId) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: g } = await supabaseAdmin
      .from("guests")
      .select("primary_name")
      .eq("id", guestId)
      .maybeSingle();
    if (!g) return { ok: false };
    return { ok: true, primary_name: g.primary_name };
  });

const verifyAccessSchema = z
  .object({
    slug: z.string().trim().max(20).optional(),
    token: z.string().min(10).max(400).optional(),
    selectToken: z.string().min(10).max(400).optional(),
    last4: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter the last 4 digits"),
  })
  .refine(
    (d) => [d.slug, d.token, d.selectToken].filter(Boolean).length === 1,
    "Provide exactly one of a code, a link, or a selection",
  );

export const verifyHouseholdAccess = createServerFn({ method: "POST" })
  .validator((d: unknown) => verifyAccessSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; guest: PublicGuest; rsvp: PublicRsvp | null; sessionToken: string }
      | { ok: false; reason: "not_found" | "invalid" | "locked" }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const guestId = await resolveVerifyTarget(data);
      if (!guestId) return { ok: false, reason: "not_found" };

      const { data: g } = await supabaseAdmin
        .from("guests")
        .select(`${GUEST_SELECT_COLUMNS}, phone_verify_failed_attempts, phone_verify_locked_until`)
        .eq("id", guestId)
        .maybeSingle();
      if (!g) return { ok: false, reason: "not_found" };

      const now = Date.now();
      if (g.phone_verify_locked_until && new Date(g.phone_verify_locked_until).getTime() > now) {
        return { ok: false, reason: "locked" };
      }

      const expectedLast4 = normalizePhone(g.phone).slice(-4);
      if (expectedLast4.length !== 4 || expectedLast4 !== data.last4) {
        const attempts = (g.phone_verify_failed_attempts ?? 0) + 1;
        const locked = attempts >= PHONE_VERIFY_MAX_ATTEMPTS;
        await supabaseAdmin
          .from("guests")
          .update({
            phone_verify_failed_attempts: attempts,
            phone_verify_locked_until: locked
              ? new Date(now + PHONE_VERIFY_LOCKOUT_MS).toISOString()
              : null,
          })
          .eq("id", g.id);
        return { ok: false, reason: locked ? "locked" : "invalid" };
      }

      await supabaseAdmin
        .from("guests")
        .update({
          phone_verify_failed_attempts: 0,
          phone_verify_locked_until: null,
          phone_verify_last_success_at: new Date(now).toISOString(),
        })
        .eq("id", g.id);

      const guest = mapGuestRow(g);
      const { data: r } = await supabaseAdmin
        .from("rsvps")
        .select(RSVP_SELECT_COLUMNS)
        .eq("guest_id", g.id)
        .maybeSingle();

      // Issued only to the browser that just passed the last-4 check — this
      // is what authorizes updateGuestAddress/submitRsvp below, replacing
      // the old approach of remembering "verified" on the household row
      // (which anyone holding the invite code could ride along on).
      const { signRsvpToken } = await import("@/lib/rsvp-token.server");
      const sessionToken = await signRsvpToken(g.id, "session", SESSION_TOKEN_TTL_MS);

      return { ok: true, guest, rsvp: mapRsvpRow(r), sessionToken };
    },
  );

// Address-only update, independent of RSVP status and the rsvp_open flag —
// so a household can confirm or add their mailing address any time after
// verifying, whether or not RSVP is open yet. Requires the session token
// minted by a successful verifyHouseholdAccess call — a bare slug/id is not
// enough, otherwise this would quietly reopen the door phone verification
// closes.
export const updateGuestAddress = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ sessionToken: z.string().min(10).max(400), address: addressSchema }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
    const v = await verifyRsvpToken(data.sessionToken, "session");
    if (!v.ok) throw new Error("not_verified");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("guests")
      .update({
        address_line1: data.address.line1?.trim() || null,
        address_line2: data.address.line2?.trim() || null,
        city: data.address.city?.trim() || null,
        state: data.address.state?.trim() || null,
        postal_code: data.address.postal_code?.trim() || null,
        country: data.address.country?.trim() || null,
        address_confirmed_at: now,
        address_updated_at: now,
      })
      .eq("id", v.guestId);
    if (error) {
      console.error("updateGuestAddress failed", error);
      throw new Error("save_failed");
    }
    return { ok: true };
  });

const submitSchema = z.object({
  sessionToken: z.string().min(10).max(400),
  attendees: z.array(attendeeSchema).min(1).max(20),
  address_confirmed: z.boolean(),
  address: addressSchema.optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  song_request: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const editSchema = submitSchema.omit({ sessionToken: true });
type EditRsvpInput = z.infer<typeof editSchema>;

// Shared write path used by public submit and token-based edit.
async function writeRsvp(
  guestId: string,
  data: EditRsvpInput,
  invitationSlug: string,
  siteOrigin: string,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { signRsvpToken } = await import("@/lib/rsvp-token.server");

  const { data: g, error: gErr } = await supabaseAdmin
    .from("guests")
    .select("id, primary_name, party_members")
    .eq("id", guestId)
    .maybeSingle();
  if (gErr || !g) throw new Error("household_not_found");

  const maxAllowed = Math.max(
    1,
    (Array.isArray(g.party_members) ? (g.party_members as unknown[]).length : 1) + 1,
  );
  if (data.attendees.length > maxAllowed) throw new Error("too_many_guests");

  const anyYes = data.attendees.some((a) => a.attending);
  const anyNo = data.attendees.some((a) => !a.attending);
  const status: PublicRsvp["status"] =
    anyYes && anyNo ? "partial" : anyYes ? "attending" : "not_attending";

  const guestPatch: {
    email?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    address_confirmed_at?: string;
    address_updated_at?: string;
  } = {};
  if (typeof data.email === "string") guestPatch.email = data.email.trim() || null;
  if (data.address) {
    guestPatch.address_line1 = data.address.line1?.trim() || null;
    guestPatch.address_line2 = data.address.line2?.trim() || null;
    guestPatch.city = data.address.city?.trim() || null;
    guestPatch.state = data.address.state?.trim() || null;
    guestPatch.postal_code = data.address.postal_code?.trim() || null;
    guestPatch.country = data.address.country?.trim() || null;
    // Keep the admin "last confirmed" view accurate regardless of whether
    // an address came in via updateGuestAddress or a full RSVP submission.
    const stamp = new Date().toISOString();
    guestPatch.address_updated_at = stamp;
    if (data.address_confirmed) guestPatch.address_confirmed_at = stamp;
  }
  if (Object.keys(guestPatch).length > 0) {
    await supabaseAdmin.from("guests").update(guestPatch).eq("id", g.id);
  }

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
  if (error) {
    console.error("writeRsvp upsert failed", error);
    throw new Error("save_failed");
  }

  try {
    const { enqueueAppEmail, getAdminNotificationEmails } =
      await import("@/lib/email/enqueue.server");
    const guestEmail = (typeof data.email === "string" ? data.email.trim() : "") || null;
    const idemBase = `rsvp-${g.id}-${now}`;
    const token = await signRsvpToken(g.id, "edit");
    const editUrl = `${siteOrigin}/rsvp/edit/${token}`;

    if (guestEmail) {
      await enqueueAppEmail({
        templateName: "rsvp-confirmation",
        to: guestEmail,
        idempotencyKey: `${idemBase}-guest`,
        data: {
          guestName: g.primary_name,
          status,
          attendees: data.attendees,
          slug: invitationSlug,
          editUrl,
          eventDate: SITE.eventDatePretty.en,
          venue: SITE.venue,
          address: SITE.address,
          rsvpDeadline: SITE.rsvpDeadlinePretty.en,
        },
      });
    }

    const admins = getAdminNotificationEmails();
    if (admins.length > 0) {
      const yesCount = data.attendees.filter((a) => a.attending).length;
      const statusLabel =
        status === "attending" ? "Attending" : status === "partial" ? "Partial" : "Not attending";
      const details = [
        { label: "Status", value: statusLabel },
        { label: "Party size", value: `${data.attendees.length} (${yesCount} attending)` },
        {
          label: "Attendees",
          value: data.attendees.map((a) => `${a.name}${a.attending ? "" : " (no)"}`).join(", "),
        },
      ];
      if (data.song_request?.trim())
        details.push({ label: "Song request", value: data.song_request.trim() });
      if (data.message?.trim()) details.push({ label: "Message", value: data.message.trim() });
      if (guestEmail) details.push({ label: "Email", value: guestEmail });

      await Promise.all(
        admins.map((to) =>
          enqueueAppEmail({
            templateName: "admin-notification",
            to,
            idempotencyKey: `${idemBase}-admin-${to}`,
            data: {
              kind: "rsvp",
              headline: `New RSVP: ${g.primary_name} — ${statusLabel}`,
              summary: `${g.primary_name} just submitted an RSVP.`,
              details,
              adminUrl: `${siteOrigin}/admin`,
            },
          }),
        ),
      );
    }
  } catch (e) {
    console.error("RSVP email notification failed", e);
  }
}

export const submitRsvp = createServerFn({ method: "POST" })
  .validator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { isFeatureEnabled } = await import("@/lib/feature-flags.functions");
    if (!(await isFeatureEnabled("rsvp_open"))) throw new Error("rsvp_closed");
    const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
    const v = await verifyRsvpToken(data.sessionToken, "session");
    if (!v.ok) throw new Error("not_verified");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: g, error: gErr } = await supabaseAdmin
      .from("guests")
      .select("id, slug")
      .eq("id", v.guestId)
      .maybeSingle();
    if (gErr || !g) throw new Error("household_not_found");
    const { sessionToken: _t, ...rest } = data;
    await writeRsvp(g.id, rest, g.slug, SITE.siteUrl);
    return { ok: true };
  });

// ---------- Token-based edit (signed link, no login) ----------
// Distinct from household verification above: this is for a guest editing
// an RSVP they've already submitted, using the signed link from their
// confirmation email. Deliberately not phone-gated or rsvp_open-gated —
// see ONBOARDING.md — and untouched by the verification flow.

export const getRsvpByToken = createServerFn({ method: "POST" })
  .validator((d: { token: string }) => z.object({ token: z.string().min(10).max(400) }).parse(d))
  .handler(
    async ({
      data,
    }): Promise<
      | { ok: true; guest: PublicGuest; rsvp: PublicRsvp | null }
      | { ok: false; reason: "malformed" | "invalid" | "expired" | "not_found" }
    > => {
      const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
      const v = await verifyRsvpToken(data.token, "edit");
      if (!v.ok) return { ok: false, reason: v.reason };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: g } = await supabaseAdmin
        .from("guests")
        .select(GUEST_SELECT_COLUMNS)
        .eq("id", v.guestId)
        .maybeSingle();
      if (!g) return { ok: false, reason: "not_found" };

      const guest = mapGuestRow(g);
      const { data: r } = await supabaseAdmin
        .from("rsvps")
        .select(RSVP_SELECT_COLUMNS)
        .eq("guest_id", g.id)
        .maybeSingle();

      return { ok: true, guest, rsvp: mapRsvpRow(r) };
    },
  );

const editByTokenSchema = editSchema.extend({ token: z.string().min(10).max(400) });

export const updateRsvpByToken = createServerFn({ method: "POST" })
  .validator((d: unknown) => editByTokenSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
    const v = await verifyRsvpToken(data.token, "edit");
    if (!v.ok) throw new Error(v.reason === "expired" ? "link_expired" : "link_invalid");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: g } = await supabaseAdmin
      .from("guests")
      .select("slug")
      .eq("id", v.guestId)
      .maybeSingle();
    if (!g) throw new Error("household_not_found");

    const { token: _t, ...rest } = data;
    await writeRsvp(v.guestId, rest, g.slug, SITE.siteUrl);
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
    const { data: rsvps } = await sb.from("rsvps").select("*");
    const rsvpByGuest = new Map<string, PublicRsvp>();
    for (const r of rsvps ?? []) {
      const mapped = mapRsvpRow(r);
      if (mapped) rsvpByGuest.set(r.guest_id, mapped);
    }
    const { signRsvpToken } = await import("@/lib/rsvp-token.server");
    const rows = guests ?? [];
    const [editTokens, verifyTokens] = await Promise.all([
      Promise.all(rows.map((g) => signRsvpToken(g.id, "edit"))),
      Promise.all(rows.map((g) => signRsvpToken(g.id, "verify", VERIFY_LINK_TTL_MS))),
    ]);
    return rows.map((g, i): AdminGuestRow => ({
      id: g.id,
      slug: g.slug,
      primary_name: g.primary_name,
      party_members: Array.isArray(g.party_members)
        ? (g.party_members as unknown as PartyMember[])
        : [],
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
      updated_at: g.updated_at,
      rsvp: rsvpByGuest.get(g.id) ?? null,
      edit_token: editTokens[i],
      verify_token: verifyTokens[i],
      address_confirmed_at: g.address_confirmed_at,
      address_updated_at: g.address_updated_at,
      phone_verify_locked_until: g.phone_verify_locked_until,
      phone_verify_failed_attempts: g.phone_verify_failed_attempts,
      phone_verify_last_success_at: g.phone_verify_last_success_at,
    }));
  });

// Admin override for a household that's tripped the 5-attempt phone-verify
// lockout — resets the counter and clears the lockout immediately.
export const unlockGuestPhoneVerify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = await ensureAdmin(context.userId);
    const { error } = await sb
      .from("guests")
      .update({
        phone_verify_failed_attempts: 0,
        phone_verify_locked_until: null,
      })
      .eq("id", data.id);
    if (error) {
      console.error("unlockGuestPhoneVerify failed", error);
      throw new Error("Couldn't unlock this household. Please try again.");
    }
    return { ok: true };
  });

const guestUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(20).optional().or(z.literal("")),
  primary_name: z.string().trim().min(1).max(200),
  party_members: z.array(partyMemberSchema).max(20),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(40)
    .refine(isValidPhone, "Enter a valid 10-digit US or Mexico phone number"),
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
      party_members: data.party_members as unknown as import("@/integrations/supabase/types").Json,
      phone: normalizePhone(data.phone),
      email: data.email ? normalizeEmail(data.email) : null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      invite_notes: data.invite_notes || null,
    };

    if (data.id) {
      const update = data.slug ? { ...payload, slug: data.slug.toUpperCase() } : payload;
      const { data: updated, error } = await sb
        .from("guests")
        .update(update)
        .eq("id", data.id)
        .select("id, slug")
        .maybeSingle();
      if (error || !updated) {
        console.error("upsertGuest update failed", error);
        throw new Error("Couldn't save this invitation. Please try again.");
      }
      return { id: updated.id, slug: updated.slug };
    }

    // Insert with unique slug (retry on collision).
    for (let i = 0; i < 5; i++) {
      const slug = (data.slug || randomSlug()).toUpperCase();
      const { data: ins, error } = await sb
        .from("guests")
        .insert({ ...payload, slug })
        .select("id, slug")
        .maybeSingle();
      if (!error && ins) return { id: ins.id, slug: ins.slug };
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        console.error("upsertGuest insert failed", error);
        throw new Error("Couldn't create this invitation. Please try again.");
      }
    }
    throw new Error("Could not generate a unique invite code, please try again.");
  });

export const deleteGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = await ensureAdmin(context.userId);
    const { error } = await sb.from("guests").delete().eq("id", data.id);
    if (error) {
      console.error("deleteGuest failed", error);
      throw new Error("Couldn't delete this invitation. Please try again.");
    }
    return { ok: true };
  });

// rsvps.guest_id has ON DELETE CASCADE, so each household's RSVP row (if
// any) is removed automatically — no separate cleanup needed here.
export const bulkDeleteGuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; count: number }> => {
    const sb = await ensureAdmin(context.userId);
    const { error } = await sb.from("guests").delete().in("id", data.ids);
    if (error) {
      console.error("bulkDeleteGuests failed", error);
      throw new Error("Couldn't delete those invitations. Please try again.");
    }
    return { ok: true, count: data.ids.length };
  });

// Master CSV import — columns household_name (or legacy primary_name),
// slug (optional, the update-match key), phone, members (or legacy
// party_members — semicolon-separated names, "(child)" suffix), email,
// address_line1, address_line2, city, state, postal_code, country,
// invite_notes. A missing header row is fine (falls back to a fixed
// column order); a missing/invalid phone on a new household is not,
// since it's both required and the fallback match key.
//
// Runs as a pure plan-then-apply pair so a dry-run preview and the actual
// commit can never disagree: planImportRows() decides insert/update/error
// for every row without writing anything, and importGuestsCsv() either
// returns that plan as-is (dryRun) or applies it row by row.
function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

function isLikelyUsZip(v: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(v.trim());
}

interface ExistingGuestRef {
  id: string;
  slug: string;
  phone: string;
  email: string | null;
}

export interface ImportRowResult {
  row: number;
  action: "insert" | "update" | "error";
  household_name?: string;
  matchedBy?: "slug" | "phone" | "email";
  warnings: string[];
  error?: string;
}

interface GuestWritePayload {
  primary_name?: string;
  phone?: string;
  party_members?: import("@/integrations/supabase/types").Json;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  invite_notes?: string | null;
}

interface PlannedRow extends ImportRowResult {
  guestId?: string;
  slug?: string;
  payload?: GuestWritePayload;
}

function parseMembers(raw: string, fallbackName: string): PartyMember[] {
  const trimmed = raw.trim();
  if (!trimmed) return [{ name: fallbackName, is_child: false }];
  return trimmed
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((n) => {
      const isChild = /\(child\)/i.test(n);
      return { name: n.replace(/\s*\(child\)\s*/i, "").trim(), is_child: isChild };
    });
}

// No writes — resolves match/insert-vs-update for every row and builds the
// exact payload that would be written, so dry-run and commit share one
// source of truth. `existing` should already reflect the live guests table.
function planImportRows(
  header: string[],
  body: string[][],
  existing: ExistingGuestRef[],
): PlannedRow[] {
  const bySlug = new Map(existing.map((g) => [g.slug.toUpperCase(), g]));
  const byPhone = new Map<string, ExistingGuestRef[]>();
  const byEmail = new Map<string, ExistingGuestRef[]>();
  function addTo(map: Map<string, ExistingGuestRef[]>, key: string, g: ExistingGuestRef) {
    const list = map.get(key);
    if (list) list.push(g);
    else map.set(key, [g]);
  }
  for (const g of existing) {
    const p = normalizePhone(g.phone);
    if (p) addTo(byPhone, p, g);
    if (g.email) addTo(byEmail, normalizeEmail(g.email), g);
  }

  const claimedGuestIds = new Set<string>();
  const claimedSlugs = new Set<string>();
  const claimedNewPhones = new Set<string>();
  const claimedNewEmails = new Set<string>();

  const results: PlannedRow[] = [];

  body.forEach((cols, idx) => {
    const rowNumber = idx + 1;
    const rec: Record<string, string> = {};
    header.forEach((h, i) => {
      rec[h] = (cols[i] ?? "").trim();
    });

    const household_name = rec.household_name || rec.primary_name;
    if (!household_name) {
      results.push({
        row: rowNumber,
        action: "error",
        warnings: [],
        error: "Missing household_name.",
      });
      return;
    }

    const warnings: string[] = [];
    const slugRaw = (rec.slug ?? "").trim().toUpperCase();
    const emailNorm = rec.email ? normalizeEmail(rec.email) : "";
    const phoneNorm = rec.phone ? normalizePhone(rec.phone) : "";

    let matched: ExistingGuestRef | undefined;
    let matchedBy: "slug" | "phone" | "email" | undefined;
    let insertSlug: string | undefined;

    if (slugRaw) {
      if (claimedSlugs.has(slugRaw)) {
        results.push({
          row: rowNumber,
          action: "error",
          household_name,
          warnings,
          error: "Slug already used earlier in this import.",
        });
        return;
      }
      const bySlugHit = bySlug.get(slugRaw);
      if (bySlugHit) {
        if (claimedGuestIds.has(bySlugHit.id)) {
          results.push({
            row: rowNumber,
            action: "error",
            household_name,
            warnings,
            error: "This household was already matched by an earlier row in this import.",
          });
          return;
        }
        matched = bySlugHit;
        matchedBy = "slug";
      } else {
        insertSlug = slugRaw;
      }
    } else {
      for (const [map, by] of [
        [byPhone.get(phoneNorm), "phone"],
        [byEmail.get(emailNorm), "email"],
      ] as const) {
        if (matched || !map) continue;
        const candidates = map.filter((g) => !claimedGuestIds.has(g.id));
        if (candidates.length > 1) {
          results.push({
            row: rowNumber,
            action: "error",
            household_name,
            warnings,
            error: `Multiple existing guests share this ${by} — add a slug column to disambiguate.`,
          });
          return;
        }
        if (candidates.length === 1) {
          matched = candidates[0];
          matchedBy = by;
        }
      }
      if (!matched) {
        if (phoneNorm && claimedNewPhones.has(phoneNorm)) {
          results.push({
            row: rowNumber,
            action: "error",
            household_name,
            warnings,
            error: "This phone number was already used earlier in this import.",
          });
          return;
        }
        if (emailNorm && claimedNewEmails.has(emailNorm)) {
          results.push({
            row: rowNumber,
            action: "error",
            household_name,
            warnings,
            error: "This email was already used earlier in this import.",
          });
          return;
        }
      }
    }

    const isUpdate = !!matched;

    // Phone: blank is fine on an update (leave unchanged); a non-blank value
    // must always be valid; a new household always needs one (it's NOT NULL
    // and the primary fallback match key).
    if (rec.phone?.trim()) {
      if (!isValidPhone(rec.phone)) {
        results.push({
          row: rowNumber,
          action: "error",
          household_name,
          warnings,
          error: "Invalid phone number.",
        });
        return;
      }
    } else if (!isUpdate) {
      results.push({
        row: rowNumber,
        action: "error",
        household_name,
        warnings,
        error: "Missing phone number (required for a new household).",
      });
      return;
    }

    if (rec.email?.trim() && !z.string().email().safeParse(rec.email.trim()).success) {
      results.push({
        row: rowNumber,
        action: "error",
        household_name,
        warnings,
        error: "Invalid email address.",
      });
      return;
    }

    const zipCountry = rec.country?.trim() || (isUpdate ? "" : "USA");
    if (
      rec.postal_code?.trim() &&
      /^us(a)?$/i.test(zipCountry) &&
      !isLikelyUsZip(rec.postal_code)
    ) {
      warnings.push("ZIP doesn't look like a 5 or 5+4 digit US code.");
    }

    // Build the write payload — blank optional cells are simply omitted on
    // an update (leave existing value), but given a concrete value on
    // insert (defaults applied where relevant).
    const payload: GuestWritePayload = { primary_name: household_name };
    if (rec.phone?.trim()) payload.phone = normalizePhone(rec.phone);

    const membersRaw = rec.members ?? rec.party_members ?? "";
    if (membersRaw.trim()) {
      payload.party_members = parseMembers(
        membersRaw,
        household_name,
      ) as unknown as import("@/integrations/supabase/types").Json;
    } else if (!isUpdate) {
      payload.party_members = [
        { name: household_name, is_child: false },
      ] as unknown as import("@/integrations/supabase/types").Json;
    }

    if (rec.email?.trim()) payload.email = normalizeEmail(rec.email);
    else if (!isUpdate) payload.email = null;

    for (const f of ["address_line1", "address_line2", "city", "state", "postal_code"] as const) {
      if (rec[f]?.trim()) payload[f] = rec[f].trim();
      else if (!isUpdate) payload[f] = null;
    }
    if (rec.country?.trim()) payload.country = rec.country.trim();
    else if (!isUpdate) payload.country = "USA";

    if (rec.invite_notes?.trim()) payload.invite_notes = rec.invite_notes.trim();
    else if (!isUpdate) payload.invite_notes = null;

    if (matched) claimedGuestIds.add(matched.id);
    if (slugRaw) claimedSlugs.add(slugRaw);
    if (!isUpdate) {
      if (phoneNorm) claimedNewPhones.add(phoneNorm);
      if (emailNorm) claimedNewEmails.add(emailNorm);
    }

    results.push({
      row: rowNumber,
      action: isUpdate ? "update" : "insert",
      household_name,
      matchedBy,
      warnings,
      guestId: matched?.id,
      slug: insertSlug,
      payload,
    });
  });

  return results;
}

export const importGuestsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ csv: z.string().min(1).max(200_000), dryRun: z.boolean().optional() }).parse(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      dryRun: boolean;
      totals: { inserted: number; updated: number; errors: number };
      rows: ImportRowResult[];
    }> => {
      const sb = await ensureAdmin(context.userId);
      const dryRun = data.dryRun ?? false;
      const rows = parseCsv(data.csv);
      if (!rows.length) return { dryRun, totals: { inserted: 0, updated: 0, errors: 0 }, rows: [] };

      let header: string[];
      let body: string[][];
      if (rows[0].some((c) => /household_name|primary_name/.test(c.toLowerCase()))) {
        header = rows[0].map((c) => c.trim().toLowerCase());
        body = rows.slice(1);
      } else {
        header = [
          "household_name",
          "phone",
          "members",
          "email",
          "address_line1",
          "address_line2",
          "city",
          "state",
          "postal_code",
          "country",
          "invite_notes",
        ];
        body = rows;
      }

      const { data: existing } = await sb.from("guests").select("id, slug, phone, email");
      const planned = planImportRows(header, body, existing ?? []);

      if (!dryRun) {
        for (const p of planned) {
          if (p.action === "insert" && p.payload) {
            // primary_name/phone are always set on an insert-planned row (see
            // planImportRows) even though GuestWritePayload marks them
            // optional to also cover update rows — asserted here, not
            // re-validated, since that invariant already holds by construction.
            const payload = p.payload as GuestWritePayload & {
              primary_name: string;
              phone: string;
            };
            for (let i = 0; i < 5; i++) {
              const slug = p.slug || randomSlug();
              const { error } = await sb.from("guests").insert({ ...payload, slug });
              if (!error) {
                p.slug = slug;
                break;
              }
              if (p.slug || !error.message.toLowerCase().includes("duplicate")) {
                p.action = "error";
                p.error = error.message;
                break;
              }
            }
          } else if (p.action === "update" && p.guestId && p.payload) {
            const { error } = await sb.from("guests").update(p.payload).eq("id", p.guestId);
            if (error) {
              p.action = "error";
              p.error = error.message;
            }
          }
        }
      }

      const totals = { inserted: 0, updated: 0, errors: 0 };
      for (const p of planned) {
        if (p.action === "insert") totals.inserted++;
        else if (p.action === "update") totals.updated++;
        else totals.errors++;
      }

      return {
        dryRun,
        totals,
        rows: planned.map(({ row, action, household_name, matchedBy, warnings, error }) => ({
          row,
          action,
          household_name,
          matchedBy,
          warnings,
          error,
        })),
      };
    },
  );

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
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && input[i + 1] === "\n") i++;
        cur.push(field);
        field = "";
        if (cur.some((c) => c.length)) rows.push(cur);
        cur = [];
      } else field += ch;
    }
  }
  if (field.length || cur.length) {
    cur.push(field);
    if (cur.some((c) => c.length)) rows.push(cur);
  }
  return rows;
}
