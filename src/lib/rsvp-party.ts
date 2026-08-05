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
