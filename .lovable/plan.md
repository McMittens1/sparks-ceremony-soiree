# Guest Notes & Song Requests page

A new admin-only page that shows, in one clean place, every note guests left and every song they requested — no filtering through the big guest table.

## What you'll see

New page at `/portal-ga-2026/notes`, linked from the dashboard next to the attendee report link.

Three sections:

1. **Summary strip** — how many households left a note, how many requested a song, out of total responses.
2. **Messages** — one card per household with a note: household name, RSVP status badge, date submitted, and the note itself in readable serif type.
3. **Song requests** — a simple list: song request text, who asked for it, date. Includes a "copy all songs" button so the list can be pasted straight to the DJ.

Both sections are sorted newest-first, with a search box that filters by household name or text, and a toggle to hide test households (hidden by default, same as the attendee report).

Empty states read plainly ("No notes yet") rather than showing blank panels.

## Exports

- **Copy song list** — plain text, one per line.
- **Download CSV** — household, status, song request, note, submitted date.
- **Print / Save PDF** — same print styling used by the attendee report.

## Design

Reuses the existing stationery look: current cards, hairline borders, semantic tokens, serif headings, `DiamondDivider` between sections. English and Spanish labels via the existing dictionary.

## Technical notes

- New route `src/routes/_authenticated/portal-ga-2026/notes.tsx`, sitting under the existing authenticated layout, so the same admin gate applies.
- Data comes from the existing admin server function `listGuestsWithRsvps` (already `requireSupabaseAuth` + `ensureAdmin`); `song_request` and `message` are already returned. No schema change, no new server function, no migration.
- CSV via the shared `escCsv`/`downloadCsv` helpers in `src/lib/csv.ts`.
- Print CSS mirrors the pattern in `attendees.tsx`.
- Copy strings added to `src/i18n/dictionaries.ts` (EN + ES).
- Dashboard gets one link added; no other dashboard behavior changes (existing "Has song request" filter stays).
- Docs: update `ONBOARDING.md` and `HANDOFF.md` with the new route and bump "Last verified".

## Verification

- `bun run build:dev`.
- Authenticated Playwright pass at 1280 and 440 plus print emulation; confirm counts match a direct database query of non-empty `song_request` / `message` rows.
