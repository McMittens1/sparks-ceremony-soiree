import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { hasAdminRole } from "@/lib/admin.functions";
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
  // Both flags are stamped server-side in writeRsvp — whatever the browser
  // sends for them is ignored. `added_by_guest` is true for anyone who
  // isn't on the household's invited party_members list; `name_pending`
  // marks an added guest whose real name the household doesn't know yet.
  added_by_guest?: boolean;
  name_pending?: boolean;
}


export interface GuestAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// What the guest-facing RSVP flow is allowed to see about its own
// household after verifying. Deliberately narrow: no slug (the invite code
// authorizes nothing on its own, but there's no reason to hand it out), no
// phone, and no mailing address — we already hold the addresses and guests
// no longer confirm or edit them, so shipping one to the browser would put
// a full street address in devtools for no benefit. Email stays because the
// guest types it themselves to receive a confirmation.
export interface PublicGuest {
  id: string;
  primary_name: string;
  party_members: PartyMember[];
  email: string | null;
  // Total people this household may bring, named or not. Not sensitive —
  // the form needs it to show an honest "you may add N more" counter and to
  // hide the add button at the cap.
  party_limit: number;
}


// Which single question a household is challenged with. Chosen server-side
// from what's on file — the guest never picks, and never sees the other
// option. Phone last-4 is the stronger secret, so it wins when we have one;
// ZIP is the fallback for households we only have a mailing address for.
// "none" can only happen if the DB check constraint were dropped.
export type VerifyFactor = "phone_last4" | "zip" | "none";

export interface PublicRsvp {
  status: "attending" | "not_attending" | "partial";
  attendees: AttendeeChoice[];
  // Retained for historical rows submitted while the guest-facing address
  // confirm step still existed; the current flow never writes them.
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
  // Explicit cap as set in the admin editor (null = not set yet), plus the
  // limit actually enforced, so the dashboard can show both the real number
  // and which invitations still rely on the fallback.
  max_party_size: number | null;
  party_limit: number;

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
  updated_at: string;
  rsvp: PublicRsvp | null;
  edit_token: string;
  verify_token: string;
  // Which challenge this household will be asked at verification time, so
  // gaps are visible in the dashboard before invitations go out.
  verify_factor: VerifyFactor;
  address_confirmed_at: string | null;
  address_updated_at: string | null;
  // Named phone_* for historical reasons; these count *verification*
  // attempts regardless of which factor was asked.
  phone_verify_locked_until: string | null;
  phone_verify_failed_attempts: number;
  phone_verify_last_success_at: string | null;
}


// ---------- Helpers ----------

// Uses the caller's own RLS-scoped client (attached by requireSupabaseAuth), not
// the service-role client — enforced both here and by the matching
// "has_role(auth.uid(), 'admin')" ALL-command RLS policies on guests/rsvps.
async function ensureAdmin(sb: SupabaseClient<Database>, userId: string) {
  if (!(await hasAdminRole(sb, userId))) throw new Error("Forbidden");
  return sb;
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

// Instructions ("Enter name if bringing a plus one") were once typed into the
// member list to tell households they could add someone. They behave as real
// invited people everywhere — inflating the party limit and the headcount, and
// unremovable in the guest form — so they're rejected at every write path. The
// party limit plus the form's own copy carries that message instead.
export function isInstructionalName(name: string): boolean {
  return /^enter\b|plus[-\s]?one|all party names|tbd|unknown/i.test(name.trim());
}

const partyMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine(
      (n) => !isInstructionalName(n),
      "Use real names only. To let this household add someone, raise the party limit instead.",
    ),
  is_child: z.boolean(),
});

const attendeeSchema = z
  .object({
    // May be blank only when the household explicitly marked the row
    // "name to come" — writeRsvp fills in a placeholder in that case.
    name: z.string().trim().max(120),
    is_child: z.boolean(),
    attending: z.boolean(),
    // Accepted so an edit round-trip can send back what it was given, but
    // never trusted: writeRsvp recomputes added_by_guest and keeps
    // name_pending only for rows that really have no name.
    added_by_guest: z.boolean().optional(),
    name_pending: z.boolean().optional(),
  })
  .refine((a) => a.name.length > 0 || a.name_pending === true, {
    message: "Enter a name, or mark this guest's name as still to come.",
    path: ["name"],
  });


const addressSchema = z.object({
  line1: z.string().trim().max(200).optional().or(z.literal("")),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),
});

// The single source of truth for how many people a household may bring.
// An explicit max_party_size wins; otherwise we fall back to the historical
// behavior — everyone named on the invitation, plus one open slot — so
// households imported before this column existed keep working unchanged.
export function effectivePartyLimit(
  namedCount: number,
  maxPartySize: number | null | undefined,
): number {
  if (typeof maxPartySize === "number" && maxPartySize > 0) {
    return Math.max(maxPartySize, namedCount, 1);
  }
  return Math.max(1, namedCount + 1);
}

function mapGuestRow(row: {
  id: string;
  primary_name: string;
  party_members: unknown;
  email: string | null;
  max_party_size?: number | null;
}): PublicGuest {
  const party = Array.isArray(row.party_members)
    ? (row.party_members as PartyMember[]).filter((p) => p && typeof p.name === "string")
    : [];
  return {
    id: row.id,
    primary_name: row.primary_name,
    party_members: party,
    email: row.email,
    party_limit: effectivePartyLimit(party.length, row.max_party_size ?? null),
  };
}


// US ZIPs are compared on their first 5 digits only, so "92078-1234",
// " 92078 " and "92078" all match the same household.
function normalizeZip(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "").slice(0, 5);
}

// The one place the challenge is chosen. Phone wins when we have one
// (stronger secret); ZIP is the fallback for address-only households.
export function verifyFactorFor(row: {
  phone: string | null;
  postal_code: string | null;
}): VerifyFactor {
  if (normalizePhone(row.phone ?? "").length >= 4) return "phone_last4";
  if (normalizeZip(row.postal_code).length === 5) return "zip";
  return "none";
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

// Only what the guest-facing flow renders. Verification reads phone /
// postal_code separately so those never ride along into a PublicGuest.
const GUEST_SELECT_COLUMNS = "id, primary_name, party_members, email, max_party_size";
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

// Same best-effort, in-memory shape as the lookup limiter above, but keyed
// by guest id rather than IP — the session token already restricts *who*
// can call submitRsvp to one phone-verified household, but nothing stopped
// that household from submitting repeatedly with a different, arbitrary
// email typed in each time, which would spam real confirmation mail to
// whatever address they chose. Keying by guest id (not IP) targets that
// specific threat without penalizing households sharing a network.
const SUBMIT_RATE_LIMIT_MAX = 10;
const SUBMIT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const submitAttempts = new Map<string, { count: number; resetAt: number }>();

function isSubmitRateLimited(guestId: string): boolean {
  const now = Date.now();
  const entry = submitAttempts.get(guestId);
  if (!entry || now > entry.resetAt) {
    submitAttempts.set(guestId, { count: 1, resetAt: now + SUBMIT_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > SUBMIT_RATE_LIMIT_MAX;
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
// by name and ask the right question before they've proven anything. Reveals
// a name and which factor is being asked, nothing else: no address, phone,
// ZIP, party list, or RSVP status.
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
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; primary_name: string; factor: VerifyFactor } | { ok: false }> => {
      const guestId = await resolveVerifyTarget(data);
      if (!guestId) return { ok: false };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: g } = await supabaseAdmin
        .from("guests")
        .select("primary_name, phone, postal_code")
        .eq("id", guestId)
        .maybeSingle();
      if (!g) return { ok: false };
      return { ok: true, primary_name: g.primary_name, factor: verifyFactorFor(g) };
    },
  );

const verifyAccessSchema = z
  .object({
    slug: z.string().trim().max(20).optional(),
    token: z.string().min(10).max(400).optional(),
    selectToken: z.string().min(10).max(400).optional(),
    // One free-form answer to whichever question the server asked; its
    // shape is validated against that factor inside the handler, so the
    // client can't pick which check it wants to be graded against.
    answer: z.string().trim().min(1).max(20),
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
        .select(
          `${GUEST_SELECT_COLUMNS}, phone, postal_code, phone_verify_failed_attempts, phone_verify_locked_until`,
        )
        .eq("id", guestId)
        .maybeSingle();
      if (!g) return { ok: false, reason: "not_found" };

      const now = Date.now();
      if (g.phone_verify_locked_until && new Date(g.phone_verify_locked_until).getTime() > now) {
        return { ok: false, reason: "locked" };
      }

      const factor = verifyFactorFor(g);
      const given = data.answer.replace(/\D/g, "");
      const matches =
        factor === "phone_last4"
          ? given.length === 4 && normalizePhone(g.phone ?? "").slice(-4) === given
          : factor === "zip"
            ? given.length === 5 && normalizeZip(g.postal_code) === given
            : false;

      if (!matches) {
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

      // Issued only to the browser that just answered correctly — this is
      // what authorizes submitRsvp below, replacing the old approach of
      // remembering "verified" on the household row (which anyone holding
      // the invite code could ride along on).
      const { signRsvpToken } = await import("@/lib/rsvp-token.server");
      const sessionToken = await signRsvpToken(g.id, "session", SESSION_TOKEN_TTL_MS);

      return { ok: true, guest, rsvp: mapRsvpRow(r), sessionToken };
    },
  );

// Addresses are admin-owned: we already hold them, guests never see or edit
// them, so an RSVP submission carries no address fields at all.
const submitSchema = z.object({
  sessionToken: z.string().min(10).max(400),
  attendees: z.array(attendeeSchema).min(1).max(20),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  song_request: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const editSchema = submitSchema.omit({ sessionToken: true });
type EditRsvpInput = z.infer<typeof editSchema>;

// Shared write path used by public submit and token-based edit. Returns what
// was actually written so callers can show a real confirmation summary
// instead of guessing/recomputing the same status logic client-side.
async function writeRsvp(
  guestId: string,
  data: EditRsvpInput,
  invitationSlug: string,
  siteOrigin: string,
): Promise<{ status: PublicRsvp["status"]; submitted_at: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { signRsvpToken } = await import("@/lib/rsvp-token.server");

  const { data: g, error: gErr } = await supabaseAdmin
    .from("guests")
    .select("id, primary_name, party_members, max_party_size")
    .eq("id", guestId)
    .maybeSingle();
  if (gErr || !g) throw new Error("household_not_found");

  const invited: PartyMember[] = Array.isArray(g.party_members)
    ? (g.party_members as unknown as PartyMember[])
    : [];
  const maxAllowed = effectivePartyLimit(invited.length, g.max_party_size);
  if (data.attendees.length > maxAllowed) throw new Error("too_many_guests");
  // A household may say an invited person isn't coming, but may not delete
  // their row — that would let them quietly swap someone we invited for
  // someone we didn't. The form enforces the same rule; this is the check
  // that actually holds.
  if (data.attendees.length < invited.length) throw new Error("missing_invited_guests");

  // Anyone whose name isn't on the invitation is an added guest. Stamped
  // here, never taken from the browser.
  const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const invitedNames = new Set(invited.map((m) => normName(m.name)));
  const attendees: AttendeeChoice[] = data.attendees.map((a) => {
    const pending = !a.name.trim();
    const name = pending ? `Guest of ${g.primary_name}` : a.name.trim();
    return {
      name,
      is_child: a.is_child,
      attending: a.attending,
      added_by_guest: pending || !invitedNames.has(normName(name)),
      name_pending: pending,
    };
  });
  data = { ...data, attendees };


  const anyYes = data.attendees.some((a) => a.attending);
  const anyNo = data.attendees.some((a) => !a.attending);
  const status: PublicRsvp["status"] =
    anyYes && anyNo ? "partial" : anyYes ? "attending" : "not_attending";

  // Email is the only guest-writable household field left; addresses are
  // maintained in the admin dashboard.
  const email = typeof data.email === "string" ? data.email.trim() || null : undefined;
  if (email !== undefined) {
    await supabaseAdmin.from("guests").update({ email }).eq("id", g.id);
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("rsvps").upsert(
    {
      guest_id: g.id,
      status,
      attendees: data.attendees,
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
          value: attendees
            .map(
              (a) =>
                `${a.name}${a.attending ? "" : " (no)"}${a.added_by_guest ? " [added]" : ""}`,
            )
            .join(", "),
        },
      ];
      const addedCount = attendees.filter((a) => a.added_by_guest).length;
      const pendingCount = attendees.filter((a) => a.name_pending).length;
      if (addedCount > 0) {
        details.push({
          label: "Added by household",
          value: `${addedCount}${pendingCount > 0 ? ` (${pendingCount} name still to come)` : ""}`,
        });
      }

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
              adminUrl: `${siteOrigin}${SITE.adminUrl}`,
            },
          }),
        ),
      );
    }
  } catch (e) {
    console.error("RSVP email notification failed", e);
  }

  return { status, submitted_at: now };
}

export const submitRsvp = createServerFn({ method: "POST" })
  .validator((d: unknown) => submitSchema.parse(d))
  .handler(
    async ({ data }): Promise<{ ok: true; status: PublicRsvp["status"]; submitted_at: string }> => {
      const { isFeatureEnabled } = await import("@/lib/feature-flags.functions");
      if (!(await isFeatureEnabled("rsvp_open"))) throw new Error("rsvp_closed");
      const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
      const v = await verifyRsvpToken(data.sessionToken, "session");
      if (!v.ok) throw new Error("not_verified");
      if (isSubmitRateLimited(v.guestId)) throw new Error("rate_limited");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: g, error: gErr } = await supabaseAdmin
        .from("guests")
        .select("id, slug")
        .eq("id", v.guestId)
        .maybeSingle();
      if (gErr || !g) throw new Error("household_not_found");
      const { sessionToken: _t, ...rest } = data;
      const result = await writeRsvp(g.id, rest, g.slug, SITE.siteUrl);
      return { ok: true, ...result };
    },
  );

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
  .handler(
    async ({ data }): Promise<{ ok: true; status: PublicRsvp["status"]; submitted_at: string }> => {
      const { verifyRsvpToken } = await import("@/lib/rsvp-token.server");
      const v = await verifyRsvpToken(data.token, "edit");
      if (!v.ok) throw new Error(v.reason === "expired" ? "link_expired" : "link_invalid");
      if (isSubmitRateLimited(v.guestId)) throw new Error("rate_limited");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: g } = await supabaseAdmin
        .from("guests")
        .select("slug")
        .eq("id", v.guestId)
        .maybeSingle();
      if (!g) throw new Error("household_not_found");

      const { token: _t, ...rest } = data;
      const result = await writeRsvp(v.guestId, rest, g.slug, SITE.siteUrl);
      return { ok: true, ...result };
    },
  );

// ---------- Admin server functions ----------

export const listGuestsWithRsvps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminGuestRow[]> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
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
      verify_factor: verifyFactorFor(g),
      max_party_size: g.max_party_size,
      party_limit: effectivePartyLimit(
        Array.isArray(g.party_members) ? (g.party_members as unknown[]).length : 0,
        g.max_party_size,
      ),

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
    const sb = await ensureAdmin(context.supabase, context.userId);
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

// Re-sends the confirmation email for a household's current RSVP as-is —
// does not resubmit or modify the RSVP itself. Reuses the same template
// data shape writeRsvp builds for the original send, sourced from the
// stored rsvp row instead of a fresh submission, with its own idempotency
// key (each resend is a distinct send attempt, not a retry of the original).
export const resendRsvpConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data: g } = await sb
      .from("guests")
      .select("id, slug, primary_name, email")
      .eq("id", data.id)
      .maybeSingle();
    if (!g) throw new Error("household_not_found");
    if (!g.email) throw new Error("no_email_on_file");

    const { data: r } = await sb
      .from("rsvps")
      .select(RSVP_SELECT_COLUMNS)
      .eq("guest_id", g.id)
      .maybeSingle();
    if (!r) throw new Error("no_rsvp_yet");

    const { enqueueAppEmail } = await import("@/lib/email/enqueue.server");
    const { signRsvpToken } = await import("@/lib/rsvp-token.server");
    const token = await signRsvpToken(g.id, "edit");
    const editUrl = `${SITE.siteUrl}/rsvp/edit/${token}`;

    const result = await enqueueAppEmail({
      templateName: "rsvp-confirmation",
      to: g.email,
      idempotencyKey: `resend-${g.id}-${Date.now()}`,
      data: {
        guestName: g.primary_name,
        status: r.status,
        attendees: r.attendees,
        slug: g.slug,
        editUrl,
        eventDate: SITE.eventDatePretty.en,
        venue: SITE.venue,
        address: SITE.address,
        rsvpDeadline: SITE.rsvpDeadlinePretty.en,
      },
    });
    if (!result.ok) {
      console.error("resendRsvpConfirmation failed", result.error);
      throw new Error("Couldn't resend the confirmation. Please try again.");
    }
    return { ok: true };
  });

const guestUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z.string().trim().max(20).optional().or(z.literal("")),
    primary_name: z.string().trim().min(1).max(200),
    party_members: z.array(partyMemberSchema).max(20),
    // Optional: we don't have a phone number for every household. A blank
    // phone means this household verifies by ZIP instead.
    phone: z
      .string()
      .trim()
      .max(40)
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || isValidPhone(v),
        "Enter a valid 10-digit US or Mexico phone number",
      ),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    address_line1: z.string().trim().max(200).optional().or(z.literal("")),
    address_line2: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    state: z.string().trim().max(60).optional().or(z.literal("")),
    postal_code: z.string().trim().max(20).optional().or(z.literal("")),
    country: z.string().trim().max(60).optional().or(z.literal("")),
    invite_notes: z.string().trim().max(1000).optional().or(z.literal("")),
    // Total people this invitation covers, named or not. Null/blank leaves
    // the household on the fallback (everyone named, plus one).
    max_party_size: z.number().int().min(1).max(30).nullable().optional(),
  })
  // Mirrors the guests_has_verify_factor DB constraint: a household with
  // neither a phone nor a ZIP could never pass verification.
  .refine(
    (d) => !!d.phone?.trim() || !!d.postal_code?.trim(),
    {
      message: "Add either a phone number or a ZIP code so this household can verify.",
      path: ["phone"],
    },
  )
  // Mirrors the validate_guest_max_party_size DB trigger.
  .refine(
    (d) => d.max_party_size == null || d.max_party_size >= d.party_members.length,
    {
      message: "The party limit can't be smaller than the number of people listed.",
      path: ["max_party_size"],
    },
  );


export const upsertGuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => guestUpsertSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);

    const payload = {
      primary_name: data.primary_name,
      party_members: data.party_members as unknown as import("@/integrations/supabase/types").Json,
      phone: data.phone?.trim() ? normalizePhone(data.phone) : null,
      email: data.email ? normalizeEmail(data.email) : null,
      address_line1: data.address_line1 || null,
      address_line2: data.address_line2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postal_code || null,
      country: data.country || null,
      invite_notes: data.invite_notes || null,
      max_party_size: data.max_party_size ?? null,

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

// Pulls the people a household added during RSVP into the invitation's own
// party_members list, so the master guest list converges on reality. Raises
// max_party_size when it was set below the new named count, so the trigger
// (and the guest-facing counter) stay consistent.
export const promoteAddedGuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; added: number }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data: g } = await sb
      .from("guests")
      .select("id, party_members, max_party_size")
      .eq("id", data.id)
      .maybeSingle();
    if (!g) throw new Error("household_not_found");
    const { data: r } = await sb
      .from("rsvps")
      .select("attendees")
      .eq("guest_id", data.id)
      .maybeSingle();
    if (!r) throw new Error("no_rsvp_yet");

    const invited: PartyMember[] = Array.isArray(g.party_members)
      ? (g.party_members as unknown as PartyMember[])
      : [];
    const attendees: AttendeeChoice[] = Array.isArray(r.attendees)
      ? (r.attendees as unknown as AttendeeChoice[])
      : [];
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const known = new Set(invited.map((m) => norm(m.name)));
    const promoted: PartyMember[] = [];
    for (const a of attendees) {
      if (!a.added_by_guest || a.name_pending) continue;
      if (known.has(norm(a.name))) continue;
      known.add(norm(a.name));
      promoted.push({ name: a.name, is_child: !!a.is_child });
    }
    if (promoted.length === 0) return { ok: true, added: 0 };

    const members = [...invited, ...promoted];
    const { error } = await sb
      .from("guests")
      .update({
        party_members: members as unknown as import("@/integrations/supabase/types").Json,
        max_party_size:
          typeof g.max_party_size === "number"
            ? Math.max(g.max_party_size, members.length)
            : null,
      })
      .eq("id", data.id);
    if (error) {
      console.error("promoteAddedGuests failed", error);
      throw new Error("Couldn't update this invitation. Please try again.");
    }
    return { ok: true, added: promoted.length };
  });

export const deleteGuest = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
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
    const sb = await ensureAdmin(context.supabase, context.userId);
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
  phone: string | null;
  email: string | null;
  primary_name?: string;
  party_members?: unknown;
  max_party_size?: number | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  invite_notes?: string | null;
  // True when this household has already submitted an RSVP. Never blocks an
  // import — it only makes "this row edits someone who already responded"
  // impossible to miss in the dry-run preview.
  hasRsvp?: boolean;
}

export interface ImportFieldChange {
  field: string;
  from: string;
  to: string;
}

export interface ImportRowResult {
  row: number;
  action: "insert" | "update" | "error";
  household_name?: string;
  matchedBy?: "slug" | "phone" | "email";
  warnings: string[];
  error?: string;
  slug?: string;
  // Field-level diff for update rows: empty means the row would write the
  // same values it already has.
  changes?: ImportFieldChange[];
  touchesRsvp?: boolean;
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
  max_party_size?: number | null;

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

function formatMembersForDiff(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return (v as PartyMember[])
    .map((m) => `${m?.name ?? ""}${m?.is_child ? " (child)" : ""}`)
    .join("; ");
}

// Field-level diff between what's stored and what this row would write.
// Only keys present in the payload are compared, so a blank cell (omitted
// on an update) can never show up as a change.
function diffPayload(existing: ExistingGuestRef, payload: GuestWritePayload): ImportFieldChange[] {
  const changes: ImportFieldChange[] = [];
  const push = (field: string, from: unknown, to: unknown) => {
    const a = from == null ? "" : String(from);
    const b = to == null ? "" : String(to);
    if (a !== b) changes.push({ field, from: a, to: b });
  };

  if (payload.primary_name !== undefined) push("name", existing.primary_name, payload.primary_name);
  if (payload.party_members !== undefined) {
    push(
      "members",
      formatMembersForDiff(existing.party_members),
      formatMembersForDiff(payload.party_members),
    );
  }
  if (payload.max_party_size !== undefined) {
    push("party limit", existing.max_party_size, payload.max_party_size);
  }
  if (payload.phone !== undefined) push("phone", existing.phone, payload.phone);
  if (payload.email !== undefined) push("email", existing.email, payload.email);
  for (const f of [
    "address_line1",
    "address_line2",
    "city",
    "state",
    "postal_code",
    "country",
    "invite_notes",
  ] as const) {
    if (payload[f] !== undefined) push(f, existing[f], payload[f]);
  }
  return changes;
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
    const p = normalizePhone(g.phone ?? "");
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

    // Phone: optional now that some households are ZIP-verified, but a
    // non-blank value must always be valid.
    if (rec.phone?.trim() && !isValidPhone(rec.phone)) {
      results.push({
        row: rowNumber,
        action: "error",
        household_name,
        warnings,
        error: "Invalid phone number.",
      });
      return;
    }

    // Mirrors guests_has_verify_factor: a new household with neither a
    // phone nor a ZIP could never pass verification, so reject it here
    // rather than letting the insert fail on the constraint.
    if (!isUpdate && !rec.phone?.trim() && !rec.postal_code?.trim()) {
      results.push({
        row: rowNumber,
        action: "error",
        household_name,
        warnings,
        error: "A new household needs either a phone number or a ZIP code (used to verify).",
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
      const parsed = parseMembers(membersRaw, household_name);
      const real = parsed.filter((m) => !isInstructionalName(m.name));
      const dropped = parsed.length - real.length;
      if (dropped > 0) {
        warnings.push(
          `Skipped ${dropped} instructional entr${dropped === 1 ? "y" : "ies"} in members (e.g. "Enter name if bringing a plus one"). Use max_party_size to allow extra guests.`,
        );
      }
      if (real.length > 0) {
        payload.party_members = real as unknown as import("@/integrations/supabase/types").Json;
      } else if (!isUpdate) {
        payload.party_members = [
          { name: household_name, is_child: false },
        ] as unknown as import("@/integrations/supabase/types").Json;
      }
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

    // Optional party cap. Ignored (with a warning) when it's not a sane
    // number or is smaller than the people listed on the same row — the DB
    // trigger would reject it anyway.
    const capRaw = rec.max_party_size?.trim();
    if (capRaw) {
      const cap = Number.parseInt(capRaw, 10);
      const namedCount = Array.isArray(payload.party_members)
        ? (payload.party_members as unknown[]).length
        : 0;
      if (!Number.isFinite(cap) || cap < 1 || cap > 30) {
        warnings.push(`Ignored max_party_size "${capRaw}" — expected a number from 1 to 30.`);
      } else if (namedCount && cap < namedCount) {
        warnings.push(
          `Ignored max_party_size ${cap} — it's below the ${namedCount} people listed for this household.`,
        );
      } else {
        payload.max_party_size = cap;
      }
    } else if (!isUpdate) {
      payload.max_party_size = null;
    }


    if (matched) claimedGuestIds.add(matched.id);
    if (slugRaw) claimedSlugs.add(slugRaw);
    if (!isUpdate) {
      if (phoneNorm) claimedNewPhones.add(phoneNorm);
      if (emailNorm) claimedNewEmails.add(emailNorm);
    }

    // Diff + RSVP-safety warnings. Warnings only — an admin editing a
    // household that already responded is legitimate; it just has to be
    // visible before the commit.
    const changes = matched ? diffPayload(matched, payload) : undefined;
    if (matched && changes) {
      const capChange = changes.find((c) => c.field === "party limit");
      if (capChange && capChange.to && capChange.from) {
        const from = Number(capChange.from);
        const to = Number(capChange.to);
        if (Number.isFinite(from) && Number.isFinite(to) && to < from) {
          warnings.push(`Party limit drops from ${from} to ${to} for this household.`);
        }
      }
      if (matched.hasRsvp && changes.length) {
        warnings.push(
          "This household has already submitted an RSVP — their response is untouched, but this row changes their invitation.",
        );
        if (changes.some((c) => c.field === "members")) {
          warnings.push(
            "Their invited names change after they responded — check their RSVP still lines up.",
          );
        }
      }
    }

    results.push({
      row: rowNumber,
      action: isUpdate ? "update" : "insert",
      household_name,
      matchedBy,
      warnings,
      changes,
      touchesRsvp: matched?.hasRsvp ?? false,
      guestId: matched?.id,
      slug: insertSlug ?? matched?.slug,

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
      totals: { inserted: number; updated: number; errors: number; unchanged: number };
      rows: ImportRowResult[];
      snapshotId?: string;
    }> => {
      const sb = await ensureAdmin(context.supabase, context.userId);
      const dryRun = data.dryRun ?? false;
      const rows = parseCsv(data.csv);
      if (!rows.length)
        return { dryRun, totals: { inserted: 0, updated: 0, errors: 0, unchanged: 0 }, rows: [] };

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
          "max_party_size",
        ];
        body = rows;
      }

      // Full rows (not just match keys) so the plan can diff field by field,
      // plus which households already responded so those rows are flagged.
      const { data: existingRows } = await sb
        .from("guests")
        .select(
          "id, slug, primary_name, phone, email, party_members, max_party_size, address_line1, address_line2, city, state, postal_code, country, invite_notes",
        );
      const { data: rsvpRows } = await sb.from("rsvps").select("guest_id");
      const rsvpIds = new Set((rsvpRows ?? []).map((r) => r.guest_id));
      const existing: ExistingGuestRef[] = (existingRows ?? []).map((g) => ({
        ...g,
        hasRsvp: rsvpIds.has(g.id),
      }));

      const planned = planImportRows(header, body, existing);

      let snapshotId: string | undefined;
      if (!dryRun) {
        // Snapshot first: a full copy of the guest list as it stands right
        // now, so a bad import is one click away from being undone. A
        // failed snapshot aborts the import rather than running unprotected.
        const { data: snap, error: snapErr } = await sb
          .from("guest_import_snapshots")
          .insert({
            created_by: context.userId,
            guest_count: existingRows?.length ?? 0,
            snapshot: (existingRows ?? []) as unknown as import("@/integrations/supabase/types").Json,
          })
          .select("id")
          .single();
        if (snapErr || !snap) {
          console.error("import snapshot failed", snapErr);
          throw new Error("Couldn't save a backup before importing — nothing was changed.");
        }
        snapshotId = snap.id;

        for (const p of planned) {
          if (p.action === "insert" && p.payload) {
            // primary_name is always set on an insert-planned row (see
            // planImportRows) even though GuestWritePayload marks it
            // optional to also cover update rows — asserted here, not
            // re-validated, since that invariant already holds by construction.
            const payload = p.payload as GuestWritePayload & { primary_name: string };
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

      const totals = { inserted: 0, updated: 0, errors: 0, unchanged: 0 };
      for (const p of planned) {
        if (p.action === "insert") totals.inserted++;
        else if (p.action === "update") {
          totals.updated++;
          if (p.changes && p.changes.length === 0) totals.unchanged++;
        } else totals.errors++;
      }

      if (!dryRun && snapshotId) {
        await sb
          .from("guest_import_snapshots")
          .update({
            inserted_count: totals.inserted,
            updated_count: totals.updated,
            error_count: totals.errors,
          })
          .eq("id", snapshotId);

        // Paper trail for a late-night change: never blocks the import.
        try {
          const { enqueueAppEmail, getAdminNotificationEmails } =
            await import("@/lib/email/enqueue.server");
          const admins = getAdminNotificationEmails();
          const changed = planned.filter(
            (p) => p.action === "insert" || (p.changes && p.changes.length > 0),
          );
          const details = [
            { label: "New households", value: String(totals.inserted) },
            {
              label: "Updated",
              value: `${totals.updated - totals.unchanged} changed, ${totals.unchanged} unchanged`,
            },
            { label: "Errors", value: String(totals.errors) },
            {
              label: "Touched an existing RSVP",
              value: String(planned.filter((p) => p.touchesRsvp && p.changes?.length).length),
            },
            {
              label: "Households changed",
              value:
                changed
                  .slice(0, 25)
                  .map((p) => p.household_name)
                  .join(", ") + (changed.length > 25 ? `, +${changed.length - 25} more` : ""),
            },
          ];
          await Promise.all(
            admins.map((to) =>
              enqueueAppEmail({
                templateName: "admin-notification",
                to,
                idempotencyKey: `import-${snapshotId}-${to}`,
                data: {
                  kind: "import",
                  headline: `Guest list import: ${totals.inserted} new, ${totals.updated} updated`,
                  summary:
                    "A guest list import just ran. A full backup was saved first and can be restored from the dashboard.",
                  details,
                  adminUrl: `${SITE.siteUrl}${SITE.adminUrl}`,
                },
              }),
            ),
          );
        } catch (e) {
          console.error("import summary email failed", e);
        }
      }

      return {
        dryRun,
        totals,
        snapshotId,
        rows: planned.map(
          ({ row, action, household_name, matchedBy, warnings, error, changes, touchesRsvp, slug }) => ({
            row,
            action,
            household_name,
            matchedBy,
            warnings,
            error,
            changes,
            touchesRsvp,
            slug,
          }),
        ),
      };
    },
  );

export interface ImportSnapshotRow {
  id: string;
  created_at: string;
  inserted_count: number;
  updated_count: number;
  error_count: number;
  guest_count: number;
  restored_at: string | null;
}

export const listImportSnapshots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ImportSnapshotRow[]> => {
    const sb = await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await sb
      .from("guest_import_snapshots")
      .select("id, created_at, inserted_count, updated_count, error_count, guest_count, restored_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) {
      console.error("listImportSnapshots failed", error);
      throw new Error("Couldn't load import history.");
    }
    return data ?? [];
  });

// Puts the guests table back exactly as the snapshot recorded it: rows added
// after the snapshot are deleted, changed rows are restored, and deleted rows
// are re-inserted with their original ids. RSVPs are never written here — but
// a household deleted by this restore takes its RSVP with it via the existing
// ON DELETE CASCADE, so the UI warns before calling this.
export const restoreImportSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: boolean; restored: number; removed: number }> => {
      const sb = await ensureAdmin(context.supabase, context.userId);
      const { data: snap, error } = await sb
        .from("guest_import_snapshots")
        .select("id, snapshot")
        .eq("id", data.id)
        .single();
      if (error || !snap) throw new Error("Couldn't find that backup.");

      const rows = (Array.isArray(snap.snapshot) ? snap.snapshot : []) as Record<
        string,
        unknown
      >[];
      if (!rows.length) throw new Error("That backup is empty — refusing to wipe the guest list.");

      const keepIds = rows.map((r) => String(r.id));
      const { data: current } = await sb.from("guests").select("id");
      const toRemove = (current ?? []).map((g) => g.id).filter((id) => !keepIds.includes(id));

      const { error: upErr } = await sb
        .from("guests")
        .upsert(rows as never, { onConflict: "id" });
      if (upErr) {
        console.error("restoreImportSnapshot upsert failed", upErr);
        throw new Error("Couldn't restore that backup. Nothing else was changed.");
      }
      if (toRemove.length) {
        const { error: delErr } = await sb.from("guests").delete().in("id", toRemove);
        if (delErr) {
          console.error("restoreImportSnapshot delete failed", delErr);
          throw new Error(
            "Restored the previous households, but couldn't remove the ones added by the import.",
          );
        }
      }

      await sb
        .from("guest_import_snapshots")
        .update({ restored_at: new Date().toISOString() })
        .eq("id", data.id);

      return { ok: true, restored: rows.length, removed: toRemove.length };
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
