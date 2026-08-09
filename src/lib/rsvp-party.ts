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
  party_members: PartyMember[];
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
