// Shared party-list rules for the two guest-facing RSVP forms (the main
// /rsvp flow and the emailed /rsvp/edit/$token flow). Both render the same
// list under the same limits, so the rules live here rather than being
// duplicated (and drifting) in each route.
import type { AttendeeChoice, PartyMember } from "@/lib/rsvp.functions";

/**
 * Seed the editable party list. Invited people always come first and are
 * marked as invited (not removable); anything the household added on a
 * previous submission keeps its added/pending flags. A pending row shows an
 * empty name field — the stored "Guest of …" placeholder is a server-side
 * label, not something the guest should have to delete before typing.
 */
export function initialAttendees(
  invited: PartyMember[],
  saved: AttendeeChoice[] | null | undefined,
  defaultAttending: boolean,
): AttendeeChoice[] {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const savedList = saved ?? [];
  const byName = new Map(savedList.filter((a) => !a.added_by_guest).map((a) => [norm(a.name), a]));

  const rows: AttendeeChoice[] = invited.map((m) => {
    const prev = byName.get(norm(m.name));
    return {
      name: m.name,
      // Older/imported rows may omit is_child entirely; the server schema
      // requires a boolean, so never let undefined reach the submit payload.
      is_child: prev?.is_child ?? m.is_child ?? false,
      attending: prev?.attending ?? defaultAttending,
      added_by_guest: false,
      name_pending: false,
    };
  });

  for (const a of savedList) {
    if (!a.added_by_guest) continue;
    rows.push({
      name: a.name_pending ? "" : a.name,
      is_child: a.is_child ?? false,
      attending: a.attending,
      added_by_guest: true,
      name_pending: !!a.name_pending,
    });
  }
  return rows;
}

/** Only guest-added rows can be removed; invited people are marked "not attending" instead. */
export function isRemovable(a: AttendeeChoice): boolean {
  return !!a.added_by_guest;
}

/** How many more people this household may still add. */
export function remainingSlots(attendees: AttendeeChoice[], partyLimit: number): number {
  return Math.max(0, partyLimit - attendees.length);
}

/** Fills {count}/{max}/{remaining} in the party counter copy. */
export function partyCounterText(
  template: string,
  attendees: AttendeeChoice[],
  partyLimit: number,
): string {
  return template
    .replace("{count}", String(attendees.length))
    .replace("{max}", String(partyLimit))
    .replace("{remaining}", String(remainingSlots(attendees, partyLimit)));
}

/** A blank guest-added row, optionally with the name deliberately left for later. */
export function newAttendee(namePending: boolean): AttendeeChoice {
  return {
    name: "",
    is_child: false,
    attending: true,
    added_by_guest: true,
    name_pending: namePending,
  };
}

/**
 * Drops rows the guest never filled in, but keeps deliberate "name to come"
 * placeholders — the server turns those into "Guest of <household>".
 */
export function cleanAttendees(attendees: AttendeeChoice[]): AttendeeChoice[] {
  return attendees.filter((a) => a.name.trim().length > 0 || a.name_pending);
}

// ---------- Admin headcount ----------

/**
 * Minimal shape the headcount needs. Kept structural (not a direct import of
 * AdminGuestRow) so this stays a pure helper with no server-function coupling.
 */
export interface HeadcountInput {
  party_limit: number;
  rsvp: { attendees: AttendeeChoice[] } | null;
}

export interface Headcount {
  /** Sum of every household's effective party limit. */
  maxPossible: number;
  /** People explicitly marked attending on a submitted RSVP. */
  attending: number;
  /** People explicitly marked not attending on a submitted RSVP. */
  declined: number;
  /** Capacity of households that haven't responded at all. */
  awaiting: number;
  /** Unused slots in households that already responded — still fillable. */
  openSlots: number;
  /** attending + awaiting + openSlots. */
  stillPossible: number;
  adults: number;
  children: number;
  namesPending: number;
}

/**
 * Every household lands in exactly one bucket, so nobody is counted twice:
 * un-responded households contribute their whole cap to `awaiting`, and
 * responded households contribute their attendee rows to attending/declined
 * plus any leftover slots to `openSlots`. The identity
 * maxPossible === attending + declined + awaiting + openSlots always holds.
 */
export function computeHeadcount(rows: HeadcountInput[]): Headcount {
  let maxPossible = 0,
    attending = 0,
    declined = 0,
    awaiting = 0,
    openSlots = 0,
    adults = 0,
    children = 0,
    namesPending = 0;

  for (const r of rows) {
    const cap = Math.max(r.party_limit, 0);
    maxPossible += cap;

    if (!r.rsvp) {
      awaiting += cap;
      continue;
    }

    const list = r.rsvp.attendees ?? [];
    if (list.length === 0) {
      // Declined without listing anyone: the whole invitation is closed out,
      // which keeps the maxPossible identity intact.
      declined += cap;
      continue;
    }

    for (const a of list) {
      if (a.attending) {
        attending++;
        if (a.is_child) children++;
        else adults++;
        if (a.name_pending) namesPending++;
      } else {
        declined++;
      }
    }
    openSlots += Math.max(0, cap - list.length);
  }

  return {
    maxPossible,
    attending,
    declined,
    awaiting,
    openSlots,
    stillPossible: attending + awaiting + openSlots,
    adults,
    children,
    namesPending,
  };
}

// ---------- Named-attendee report ----------

/**
 * The "All Possible Attendees" report answers a different question than
 * `computeHeadcount`: not "how much capacity exists" but "who do we actually
 * know by name". A person counts as named if they appear on the invitation
 * with a real name, or were added by name during an RSVP. A "name to come"
 * placeholder is never a named attendee — it stays in the unnamed capacity
 * bucket until a real name arrives.
 */
export type NamedStatus = "attending" | "declined" | "no_response";

export interface NamedPerson {
  name: string;
  is_child: boolean;
  /** Where the name came from: the original invitation, or an RSVP. */
  source: "invitation" | "rsvp";
  status: NamedStatus;
}

export interface NamedHousehold {
  id: string;
  primary_name: string;
  party_limit: number;
  rsvp_status: string | null;
  people: NamedPerson[];
  /** Permitted but still unnamed slots — plus-ones, "name to come", spare capacity. */
  unnamed_remaining: number;
  /** Attendee rows on the RSVP whose name is still a placeholder. */
  names_pending: number;
}

export interface NamedAttendeeReport {
  households: NamedHousehold[];
  /** Distinct people currently known by name. */
  totalNamed: number;
  /** Same number, framed as the ceiling if every named person attends. */
  maxNamedOnly: number;
  /** Permitted but unnamed capacity across every household. */
  remainingUnnamed: number;
  /** totalNamed + remainingUnnamed. */
  maxPossible: number;
  confirmedAttending: number;
  declinedPeople: number;
  pendingPeople: number;
  householdsAttending: number;
  householdsDeclined: number;
  householdsPending: number;
  adults: number;
  children: number;
}

export interface NamedAttendeeInput {
  id: string;
  primary_name: string;
  party_limit: number;
  party_members: PartyMember[];
  rsvp: { status: string; attendees: AttendeeChoice[] } | null;
}

const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const hasRealName = (s: string | null | undefined) => !!s && s.trim().length > 0;

export function computeNamedAttendees(rows: NamedAttendeeInput[]): NamedAttendeeReport {
  const households: NamedHousehold[] = [];
  let totalNamed = 0,
    remainingUnnamed = 0,
    confirmedAttending = 0,
    declinedPeople = 0,
    pendingPeople = 0,
    householdsAttending = 0,
    householdsDeclined = 0,
    householdsPending = 0,
    adults = 0,
    children = 0;

  for (const r of rows) {
    const rsvp = r.rsvp;
    // Deduplicate per household on the normalized name so an invited person
    // who also appears on the RSVP is counted once. RSVP data wins.
    const byKey = new Map<string, NamedPerson>();

    for (const m of r.party_members ?? []) {
      if (!hasRealName(m?.name)) continue;
      byKey.set(normName(m.name), {
        name: m.name.trim(),
        is_child: !!m.is_child,
        source: "invitation",
        status: rsvp ? "declined" : "no_response",
      });
    }

    let namesPending = 0;
    for (const a of rsvp?.attendees ?? []) {
      if (a.name_pending || !hasRealName(a.name)) {
        namesPending++;
        continue;
      }
      const key = normName(a.name);
      const prior = byKey.get(key);
      byKey.set(key, {
        name: a.name.trim(),
        is_child: a.is_child ?? prior?.is_child ?? false,
        source: prior ? "invitation" : "rsvp",
        status: a.attending ? "attending" : "declined",
      });
    }

    const people = [...byKey.values()];
    const cap = Math.max(r.party_limit, 0);
    const unnamed = Math.max(0, cap - people.length);

    for (const p of people) {
      totalNamed++;
      if (p.status === "attending") {
        confirmedAttending++;
        if (p.is_child) children++;
        else adults++;
      } else if (p.status === "declined") declinedPeople++;
      else pendingPeople++;
    }
    remainingUnnamed += unnamed;

    if (!rsvp) householdsPending++;
    else if (people.some((p) => p.status === "attending")) householdsAttending++;
    else householdsDeclined++;

    households.push({
      id: r.id,
      primary_name: r.primary_name,
      party_limit: cap,
      rsvp_status: rsvp?.status ?? null,
      people,
      unnamed_remaining: unnamed,
      names_pending: namesPending,
    });
  }

  return {
    households,
    totalNamed,
    maxNamedOnly: totalNamed,
    remainingUnnamed,
    maxPossible: totalNamed + remainingUnnamed,
    confirmedAttending,
    declinedPeople,
    pendingPeople,
    householdsAttending,
    householdsDeclined,
    householdsPending,
    adults,
    children,
  };
}
