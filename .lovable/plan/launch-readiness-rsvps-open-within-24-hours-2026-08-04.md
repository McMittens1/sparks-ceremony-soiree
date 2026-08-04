# Launch readiness — RSVPs open within 24 hours

Verified against the live database and current code on 2026-08-04.

## Part 1 — Hiding the Wedding Party section

**Recommendation: a feature flag.** No branch, no code removal.

The project already has a DB-driven flag system (`feature_flags` table, admin Features
tab, `useFeatureFlag` on the client, `isFeatureEnabled` on the server). Today it holds
three rows, all currently off: `rsvp_open`, `guest_photo_uploads`, `show_ushers`. Adding
one more row is the smallest, most reversible change, and it lets you publish everything
else normally while the section stays dark. A branch would block publishing other work; a
code removal would mean rebuilding later.

Why the section needs hiding: every `PARTY` entry is name + role only. No notes, no
photos, no card attributes, no cover headlines — so the cards render placeholder copy
("Add a note about …") to live guests.

### Work

1. Migration: insert `show_wedding_party` into `feature_flags`, default `enabled = false`,
   with label/description so it appears in the admin Features tab like the others.
2. Gate the section in `src/routes/index.tsx` / `PartySection.tsx` on the flag. The flag
   hook defaults to hidden while loading, so there is no flash of unfinished content.
3. Remove the "Wedding Party" entry from the header nav (`Header.tsx`) and the side spine
   (`SPINE_SECTIONS`) while the flag is off, and derive the section roman numerals from
   the visible list so the sequence stays I–VII with no gap at IV.
4. Gate the MCP `get_wedding_party` tool on the same flag so party data isn't readable
   through the assistant surface while the section is hidden.
5. Leave `wedding-data.ts`, `WeddingParty.tsx`, `GroomsmanCard.tsx`, and `MagazineCover.tsx`
   completely untouched. Turning the flag on later restores the section as-is.

## Part 2 — Launch review

### 1. Must fix before RSVPs open

- **`rsvp_open` is currently `false`.** Guests can look up and verify, but submission is
  blocked and the page shows a "RSVPs open soon" banner. Flip it on in the Features tab at
  launch, then submit one real RSVP end-to-end. Risk if missed: every guest hits a wall.
- **All 86 households have `max_party_size` = NULL.** Every household therefore falls back
  to "named guests + 1". Any family with two or more unnamed kids cannot add them, and any
  single-person household silently gets a plus-one they may not have. Set explicit caps for
  the households you know, and accept the fallback only where a plus-one is genuinely
  intended. This is data entry in the admin dashboard, not code. Risk: guests either can't
  RSVP their whole family or bring people you didn't invite.
- **Publish before flipping the flag.** `ADMIN_NOTIFICATION_EMAILS` was changed to
  `geoddison@gmail.com` but only takes effect on the next deploy. After publishing, submit
  one test RSVP and confirm the admin alert lands in the Gmail inbox — the send log shows
  the previous value routed alerts to the sending mailbox.
- **Final smoke test on real data**, at 440px and 1280px: lookup by name, both verification
  factors (26 households verify by phone, 64 by ZIP — cover one of each), add a guest,
  submit with and without an email, then re-open the edit link from the confirmation email.

### 2. Safe to fix shortly after launch

- Sitemap lists only `/` and `/rsvp`; fine for now, revisit if pages are added.
- `guest_photo_uploads` is off, which is correct pre-wedding; the Photos section already
  handles the closed state.
- `show_ushers` stays off; ushers data is preserved.
- Analytics has only 11 events (from testing). Confirm real events land after launch.
- No scheduled backup of the guest list. Export the master CSV from the dashboard the
  morning RSVPs open, and again weekly.

### 3. Optional improvements

- Wedding party content (notes, photos, card copy) — the actual work behind the flag.
- Per-household party caps beyond the ones you set now.
- Story-section photo slots still use placeholder engagement images.

### Verified clean — no action needed

- **Test data:** 0 `ZZTEST`/`ZZT` households, 0 RSVPs, 0 photos. Nothing to purge.
- **Verification coverage:** every one of the 86 households has a phone or a ZIP, so no
  household can be locked out at the verify step.
- **Slugs:** 86 distinct slugs for 86 households, no collisions.
- **Privacy:** `PublicGuest` excludes slug, phone, and address; admin surface is behind
  `/portal-ga-2026` with `requireSupabaseAuth` + `has_role` and matching RLS.
- **Error handling:** root route has both `notFoundComponent` and `errorComponent`, and
  toasts are mounted.
- **robots.txt** disallows `/rsvp/edit/`, so signed edit links stay out of search.

## Technical notes

- New flag row goes in via a `supabase--migration`; `feature_flags` already has GRANTs and
  RLS, so no new policy work.
- Section numerals currently live as hardcoded strings in `SPINE_SECTIONS` and in each
  section's `eyebrow` prop. The flag-aware version computes them from the visible list;
  this touches only presentation.
- No refactoring of RSVP logic, server functions, schema, or the email pipeline.
- `ONBOARDING.md` and `HANDOFF.md` get updated in the same turn with the new flag and the
  launch-day checklist.
