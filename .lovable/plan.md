# Current plan — launch day

Last updated: 2026-08-04. Companion to the approved launch-readiness review
(`.lovable/plan/launch-readiness-rsvps-open-within-24-hours-2026-08-04.md`).

## Done this session

- `show_wedding_party` feature flag added (default off). Hides the Wedding Party
  section, its header/mobile nav link, its spine numeral, and the MCP
  `get_wedding_party` tool. `src/hooks/use-section-order.ts` is now the single
  source of truth for section order and roman numerals; the homepage reads
  I–VII with no gap. Verified at 1280px: no `#party` node, no nav link,
  contiguous numerals, no new console errors.
- Docs updated (`ONBOARDING.md` §2 and Wedding Party, `HANDOFF.md` flag list).

## Launch-day checklist (in order)

1. **Publish.** This deploys the flag gating and activates the
   `ADMIN_NOTIFICATION_EMAILS` = `geoddison@gmail.com` change.
2. **Set `max_party_size`** in the admin dashboard for every household whose
   headcount differs from the default. All 86 are currently NULL, so each one
   falls back to "everyone named, plus one open slot".
3. **Flip `rsvp_open` on** in the Features tab.
4. **Smoke test on real data** at 440px and 1280px: name lookup, one
   phone-verified household and one ZIP-verified household (26 verify by phone,
   64 by ZIP), add a guest, submit with an email and without one, then follow
   the edit link from the confirmation email.
5. **Confirm the admin alert** lands in `geoddison@gmail.com` (check
   `email_send_log` if it doesn't).
6. **Export the master CSV** as a backup before invitations go out.

## After launch

- Fill in wedding party notes, photos, and card/cover copy, then flip
  `show_wedding_party` on.
- Confirm real analytics events are landing.
- Weekly CSV export of the guest list.
- Replace the placeholder story-section photos.
