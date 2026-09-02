# All Possible Attendees — export summary (2026-09-02)

A new admin-only report that answers, in one glance, "who do we actually have by name, and what's the ceiling?" — presented in the site's own stationery style so it reads like part of the wedding site, and prints cleanly to PDF.

## Where it lives

A new authenticated page at `/portal-ga-2026/attendees`, linked from a button on the dashboard's RSVPs tab. Same admin gate as the dashboard (`requireSupabaseAuth` + `ensureAdmin()`), reusing the existing `listGuestsWithRsvps` data — no new server function, no new query, no schema change.

Two actions at the top of the report: **Print / Save as PDF** (browser print with a dedicated print stylesheet) and **Download CSV** (the same attendee list as a flat file for spreadsheets).

## What it shows

### 1. Summary band (top, largest type)

Four hero numbers, in the site's card/typography system:

- **Total Named Attendees** — every distinct person known by name.
- **Maximum Attendance — Named People Only** — the same count, framed as the ceiling if every named person came.
- **Maximum Possible Attendance** — named people plus every unused/unnamed slot, with the breakdown printed under it: `Named attendees: X` + `Remaining possible unnamed/additional guests: X` = `Maximum possible attendance: X`.
- **Currently Confirmed Attending** — people marked attending on a submitted RSVP.

### 2. All Named Attendees

One list, grouped by household, showing each named person, whether they came from the invitation or were added during an RSVP, adult/child, and their current status (attending / not attending / no response yet). A running **Total Named Attendees** sits at the top of the section.

### 3. All RSVPs

One row per submitted RSVP: household name, status, the named guests included, the attendee count, and any unnamed "name to come" placeholders counted separately. Section totals for **Confirmed attending**, **Declined**, and **Pending / no response** (households and people).

## Counting rules

- A person is "named" if they appear on the invitation's `party_members` with a real name, **or** they appear in the RSVP's `attendees` with a real name — including people the household added themselves.
- A "name to come" placeholder (`name_pending`) is **not** a named attendee; it is counted as remaining unnamed capacity.
- Deduplication is per household on a normalized name (trimmed, lowercased, whitespace-collapsed), so an invitation name that also appears in the RSVP counts once. RSVP data wins for status and adult/child.
- Remaining unnamed capacity per household = `max(0, party_limit − named people in that household)`, so a household that never replied still contributes its unused allowance to the maximum-possible number and nothing to the named number.
- `Maximum possible attendance = Total named attendees + remaining unnamed capacity`, and the report shows both addends so the arithmetic is checkable at a glance.
- Test households (`ZZT…`) are excluded by default, with a toggle to include them; the report states which mode it's in so a number can never be read out of context.

## Design

Built from existing tokens and patterns only: the card system, semantic colors from `src/styles.css`, the display/serif heading pairing already used on the site, existing badge and table styles, and the diamond divider between sections. Summary numbers are set large with small-caps labels; detail tables are quiet and scannable. A print stylesheet drops the app chrome and buttons, forces light-on-paper colors, keeps section headings with their tables, and stamps the report with the wedding name and the generation date so a printed copy is self-identifying. Verified at 440px, 1280px, and in print preview.

## Technical notes

- New pure helper `computeNamedAttendees(rows)` in `src/lib/rsvp-party.ts`, next to `computeHeadcount`, returning the deduplicated per-household named roster plus the four summary numbers. `computeHeadcount` is left untouched — the existing dashboard panel keeps its capacity-based bucketing; this report answers a different question and the two are labeled so they don't look like contradictions.
- New route file `src/routes/_authenticated/portal-ga-2026/attendees.tsx`; copy added to `src/i18n/dictionaries.ts` (EN + ES), no inline strings.
- CSV download reuses the dashboard's existing `escCsv` / download helpers, moved into a small shared module so both pages use one implementation.
- Verification: `bun run build:dev`, authenticated Playwright pass at 440 and 1280 plus a print-emulation screenshot, and the report's totals cross-checked against a direct database query.
- `ONBOARDING.md` and `HANDOFF.md` document the new report and the named-vs-capacity distinction, with "Last verified" bumped in the same turn.

## Open items (unchanged)

1. Wedding Party content — real names in, card stats/abilities still placeholders; flags off.
2. Guest photo uploads — built and tested, zero photos, flag off.
3. UI/UX + speed recommendations reported 2026-09-02 — nothing implemented without approval.
