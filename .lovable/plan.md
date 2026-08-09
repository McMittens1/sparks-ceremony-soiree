# Importer improvements before the next master import

## Correction to my earlier read

You were right — I checked the guests table directly. "Kade Highlighter" is already the stored name in the database, so that row is unchanged by your file; I misattributed it. The other name edits (Jacob Laurel, Joseph Buresh, Jon Houser, Kadan Huber, Mateo Meza) are real changes in the file, and you've confirmed they're intentional. Party-size changes are intentional too, and you'll add a ZIP or phone for the two households missing both.

Email stays optional by design — only used when a household wants a confirmation. Nothing below treats a blank email as a problem.

## Still true about the import itself

- 155 rows: 78 slug-matched updates, 77 new households.
- The importer never touches the `rsvps` table, so none of the 6 submitted responses can be changed or deleted.
- Every cap in the file is at or above what those households already submitted, so no one gets locked out of editing.

## What I'll build

### 1. Change preview in the dry run

Each update row shows exactly which fields change, old → new, per field (members, cap, name, phone, ZIP, address, notes). Rows with no changes are labeled "no change" so a 155-row file collapses to the handful that actually do something.

### 2. RSVP-touch warnings

Any row updating a household that has already submitted an RSVP gets a clear flag in the dry run, with extra detail when the change affects them:

- an invited member's name changes (their saved response still holds the old name)
- the party cap moves
- members are added or removed

These are warnings, never blocks — you stay in control.

### 3. Cap-change visibility

Lowering a cap surfaces as its own warning line rather than passing silently, including when it drops to exactly the number a household already submitted.

### 4. Automatic snapshot + one-click undo

Before any commit, the importer saves a full snapshot of the guest list. The dashboard gets a "Restore last import backup" control that puts the guest list back exactly as it was, with a confirmation step. Snapshots are admin-only, and restoring never touches RSVPs.

### 5. Import history

A short list of recent imports on the dashboard: when, how many inserted/updated/failed, and the snapshot available for each.

## Nice-to-haves in the same pass

- **Import summary email** to your inbox after each committed import, so there's a record of a late-night change.
- **Dashboard readiness counters**: households missing both a phone and a ZIP (can't verify — actionable), plus a plain count of how many have an email on file (informational only, not a gap).
- **Paste from spreadsheet**: paste tab-separated rows straight from Google Sheets or Excel instead of exporting a file first.

## After it's built

1. Fresh master export as a rollback point.
2. Dry run your file and read the change preview.
3. Commit, then verify: 155 households, the 6 RSVPs untouched, no household without a phone or ZIP.
4. Spot-check one newly imported household through the real RSVP flow.

## Technical notes

- Change preview, RSVP-touch flags, and cap-change warnings all live in `planImportRows` in `src/lib/rsvp.functions.ts`, so dry run and commit share one source of truth. `planImportRows` will need the current guest row (members, cap, name, contact fields) and a set of guest ids with RSVPs, not just the match refs it fetches today.
- `ImportRowResult` gains a `changes: { field, from, to }[]` array and a `touchesRsvp` flag; the dashboard import table renders them under each row.
- Snapshot/undo needs one new table holding a JSON snapshot of the guest list per import, with GRANTs and admin-only RLS, plus `restoreGuestSnapshot` / `listGuestSnapshots` server functions guarded by `requireSupabaseAuth` + `ensureAdmin()`. Restore writes only to `guests`.
- Summary email reuses the existing transactional enqueue path and `ADMIN_NOTIFICATION_EMAILS`.
- Paste input converts tab-separated text to CSV before hitting the existing parser — no importer change.
- Verification: `bun run build:dev`, a dry run against your actual file to confirm the preview matches the diff I already computed, a snapshot/restore round-trip on a test household, and Playwright screenshots of the import panel at 440 and 1280.
- `ONBOARDING.md` and `HANDOFF.md` updated in the same turn.
