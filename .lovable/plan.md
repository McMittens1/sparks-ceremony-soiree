# Reviewing the uploaded master list before importing

I compared the uploaded file against the live database this session. Short answer: **the import will not delete or alter any RSVP**, but the file has five content problems I'd fix in the spreadsheet before you run it.

## What the file contains

- 155 rows: 78 rows that match existing households by slug (updates) and 77 rows with a blank slug (new households).
- 6 RSVPs exist today (Barrett & Abby Brown, Becky West Kunard, Susie Messinger, Chris & Rachel Hillman, Bryce & Kade Marker & Family, Jesse Hillman & Sue Hillman).

## Is it safe for existing RSVPs?

The importer only writes to the guest list. It never touches the `rsvps` table — no submitted response can be deleted or changed by an import. Matching is by slug first, so all 78 slugged rows update the correct household; no accidental duplicates of RSVP'd households.

The caps in the file are also compatible with what those six households already submitted (e.g. the Marker household submitted 3 and the file sets their cap to 3, which is allowed). Nothing in the file would lock a household out of editing their response.

## Five things to fix in the spreadsheet first

**1. Garbled names (autocorrect damage).** Several member names look like a spellcheck or find-and-replace went wrong. These would overwrite good data:

| Household | Current name in database | Name in the file |
|---|---|---|
| Jacob Laurel | Jacob Laurel | LP Obevni Provider Laurel |
| Joesph Buresh | Joseph Buresh | The Cannon Buresh |
| Jon Houser | Jon Houser | The Unmoved Mover Houser |
| Kadan & Sara Huber | Kadan Huber | Department Lead Turnkey Manager in Training Kadan Huber |
| Mateo Meza | Mateo Meza | Mateo Tito Meza |
| Bryce & Kade Marker | Kade Marker | Kade Highlighter |

The Marker one matters most: that household already responded as "Kade Marker." Renaming the invited person after the fact makes their saved response no longer line up with the invite list, so their edit link would show a mismatched extra person. Fix the name before importing.

**2. Two new households can't be invited as written.** *Roberto & Angelia Ruiz & Family* and *Alfonso & Guadalupe Flores & Family* have neither a phone number nor a ZIP. Every household needs one of the two to verify who they are, so those two rows will be rejected and skipped. Add a ZIP or phone.

**3. Three family caps get cut from 6 to 3.** Brandon & Jill Jesch, Bryce & Kade Marker, and Horacio & Karen Pecina were deliberately set to 6 earlier because their children weren't named. The file lowers all three to 3. If that's your real count now, fine — just confirming it's intentional, because it reduces how many people they can bring.

**4. Two adults become children.** Hudson Dahlgrin and Rambo Brown are marked `(child)` in the file. Correct for Hudson, presumably; Rambo Brown is worth a second look.

**5. No email addresses anywhere.** All 155 rows have a blank email. Blank cells on an update leave the existing value alone, so nothing is erased — but the 77 new households will have no email, meaning no RSVP confirmation and no update emails for them unless guests type one in themselves.

## Recommended sequence

1. Export a fresh master CSV as a rollback point (the last backup predates the six RSVPs).
2. Fix items 1 and 2 in the spreadsheet; confirm 3 and 4.
3. Run the importer in **dry run** first and read the per-row warnings.
4. Commit, then verify: 155 households, the six RSVPs untouched, and no household left without a phone or ZIP.
5. Spot-check one imported new household through the real RSVP flow.

## Improvements worth making to the import process

Ordered by how much they'd have helped today:

- **Change preview in the dry run.** Right now dry run says "update" but not *what* changes. Showing "Kade Marker → Kade Highlighter" per field would have caught the garbled names instantly.
- **Warn loudly when a row edits a household that already responded.** Any update touching a household with a submitted RSVP should be flagged in the dry run, and renaming an already-RSVP'd invited member should be an explicit confirm, not a silent write.
- **Flag suspicious name changes.** A member name that grows by more than a couple of words, or changes beyond a small edit distance, is almost always autocorrect — warn instead of accepting.
- **Warn on caps being lowered**, so a 6 → 3 change surfaces rather than passing silently.
- **Automatic backup snapshot before commit**, so an import can be undone without relying on you having exported first.
- **Undo the last import** — with a snapshot in place, a single button that restores the pre-import guest list.

## Nice-to-have enhancements

- Import summary emailed to you, so late-night imports leave a record.
- "Households missing a verify factor" and "households with no email" counters on the dashboard, so gaps are visible without exporting.
- Paste-from-spreadsheet import (tab-separated) in addition to file upload.

## Technical notes

- Import logic lives in `planImportRows` / `importGuestsCsv` in `src/lib/rsvp.functions.ts`. Match order is slug → phone → email; blank cells are skipped on updates and defaulted on inserts; `max_party_size` below the named count is ignored with a warning; the `party_limit`, `rsvp_*`, and `*_url` columns are read-only and ignored on import.
- The change-preview, RSVP-touch warning, and name-drift checks all belong in `planImportRows` so dry run and commit stay a single source of truth.
- Snapshot/undo would need a new table for pre-import guest snapshots, with GRANTs and admin-only RLS, plus an admin server function guarded by `requireSupabaseAuth` + `ensureAdmin()`.
- `ONBOARDING.md` and `HANDOFF.md` get updated in the same turn as any importer change.

## Question

Do you want me to (a) just verify and walk you through the import with the fixes above, or (b) also build the importer improvements — change preview, RSVP-touch warnings, and backup/undo — before you import?
