
# Sprint 2 Wedge — Admin Dashboard Upgrade + Photo Moderation

Scope: roadmap items **#10** and **#11** only. No changes to public-facing pages, guest RSVP flow, or email plumbing.

## What's already there (baseline)

- `/_authenticated/admin` has two tabs: **RSVPs** and **Photos**.
- RSVPs tab: totals (5 cards), search, status filter, CSV export, add / edit / delete guest, CSV import.
- Photos tab: pending/approved/rejected tabs, approve/reject buttons, signed URLs.
- Server fns: `getAdminPhotos`, `setPhotoStatus`, `listGuestsWithRsvps`, `upsertGuest`, `deleteGuest`, `importGuestsCsv`.

## Gaps to close

### Admin dashboard upgrade (#10)

1. **Overview strip on load** — pending-photos count + last-24h RSVP activity next to the existing totals, so the couple sees "what's new" without clicking Photos.
2. **Sortable columns** — Name, Status, Party size, Submitted-at, City. Click header to toggle asc/desc; default Submitted-at desc.
3. **Extra filters** — party-size range (1, 2, 3+), city, "address unconfirmed", "has song request". Combine with existing status + search.
4. **Inline edit for email / phone / address-confirmed** — no full modal for one-field fixes.
5. **Bulk actions** — checkbox column + "Export selected as CSV" and "Copy RSVP link" for the selected rows.
6. **Per-guest history panel** — inside the editor modal, list `rsvp.updated_at` diffs (created / last edited) using the existing `submitted_at` + `updated_at` columns. No new table.
7. **CSV export improvements** — export what's currently filtered (not always all rows), include a stable `rsvp_url` column.

### Photo moderation UI (#11)

1. **Grid polish** — larger thumbnails, hover to enlarge, lightbox on click, keyboard nav (←/→, A=approve, R=reject, D=delete).
2. **Bulk approve/reject/delete** — checkbox on each tile + sticky action bar (`Approve N`, `Reject N`, `Delete N`).
3. **Caption edit** — inline editable caption on the tile (admin-only), persisted via a new `updatePhotoCaption` server fn.
4. **Delete permanently** — hard-delete (storage object + row) for rejected photos, behind confirm.
5. **Counts on tabs** — `Pending (3) · Approved (12) · Rejected (0)` badges so the couple sees backlog at a glance.
6. **Uploader context** — show upload date/time in the guest's timezone and, when possible, link to their guest record.

## Technical details

### New / changed server functions (`src/lib/admin.functions.ts`)

- `getPhotoCounts()` → `{ pending, approved, rejected }`. Uses `head: true` + `count: 'exact'` per status, single round-trip via `Promise.all`. Wraps in `ensureAdmin`.
- `updatePhotoCaption({ id, caption })` — zod-validated, `caption` trimmed, max 300 chars.
- `bulkSetPhotoStatus({ ids, status })` — array of uuids, single `.in('id', ids).update(...)`.
- `deletePhoto({ id })` — reads `storage_path`, `storage.from('guest-photos').remove([path])`, then row delete. Idempotent (missing storage object is not an error).
- `getRecentActivity()` → `{ rsvps_last_24h, photos_pending }` for the dashboard header. Cheap counts.

All new fns re-use the existing `ensureAdmin(userId)` helper — no schema changes, no new RLS work.

### No database migration needed

Everything above rides on existing columns. `updated_at` already exists on `rsvps` and `guests`. No new tables, no new policies.

### Client changes

- Split `admin.tsx` (currently 537 lines) into:
  - `src/routes/_authenticated/admin.tsx` — route shell + tabs + activity strip.
  - `src/components/admin/RsvpsPanel.tsx`
  - `src/components/admin/GuestEditor.tsx`
  - `src/components/admin/CsvImporter.tsx`
  - `src/components/admin/PhotosPanel.tsx`
  - `src/components/admin/PhotoLightbox.tsx`
  - `src/components/admin/useSelection.ts` (tiny hook for bulk select)
- Add sortable table header component (local, no new dep).
- Sorting/filtering/selection state stays in URL search params so refresh / back-button preserves view. Uses TanStack Router `useSearch` with a zod validator on the route.
- Keyboard shortcuts scoped via a `useEffect` on the Photos panel; disabled when a text input is focused.

### Existing behavior preserved

- Route still gated by `_authenticated` layout + `ensureAdmin` on every server fn.
- CSV format for import unchanged; export gains a `rsvp_url` column at the end (backward-compatible for import — extra columns are ignored).
- Existing translation keys reused; new keys added to both `en` and `es` in `i18n/dictionaries.ts`.
- No changes to public routes, RSVP form, photo upload, email templates, or Sprint 1 code.

## Verification checklist

- `tsgo` typecheck clean.
- `/admin` route still loads; existing tests of the flow (open, filter, edit, export, approve a photo) still pass by hand.
- Bulk approve of 3 pending photos moves all 3 to Approved tab; counts update.
- Delete of a rejected photo removes both the row and the storage object (verified via `supabase--read_query` + `storage.objects`).
- Sort + filter + search combine correctly and persist across refresh via URL.
- Keyboard shortcuts do NOT fire while typing in the caption input.
- Security scan re-run: no new findings.

## Out of scope (deferred)

- #12 signed edit tokens, #13 `.ics` + maps, #14 perf pass, #15 analytics — remain in Sprint 2 backlog for the next wedge.
- Auth-email branding — separate small task the user can request when ready.
- Sprint 1 loose ends (#1 live smoke test, #8 EN/ES proofread).
