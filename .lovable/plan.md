# Current plan

Last updated: 2026-08-04

## Just shipped / verified

- Guest-added party members: per-invitation `max_party_size` cap, non-removable invited rows, "Name to come" placeholders, server-stamped `added_by_guest` / `name_pending`, admin badges and one-click promotion into the invite list.
- 10-household `ZZTEST` matrix (`ZZT001`–`ZZT010`) driven end-to-end at 1280px and 440px: both verification factors, fallback vs explicit caps, cap-exact and zero-slot households, pending names, submit with/without email, decline, re-edit of a submitted RSVP, admin badges and promotion. Confirmation and admin-notification emails both sent. All test rows purged; `guests` = 86, `ZZTEST` = 0, `rsvps` = 0.

## This plan

1. **Repoint `ADMIN_NOTIFICATION_EMAILS` to `geoddison@gmail.com`.**
   - Current value: `noreply@notify.morenowedding2026.com`, so RSVP alerts land in the sending mailbox.
   - Set the env var to `geoddison@gmail.com`, then trigger a test RSVP alert to confirm delivery.

2. **Decide and document the unknown-party-size workflow.**
   - The existing `max_party_size` column is nullable for exactly this reason. When it is null, the enforced limit falls back to `named_count + 1` — enough for a plus-one or one unnamed child, but conservative.
   - Recommended workflow: leave `max_party_size` blank for any household whose total headcount you do not yet know. Once you do know it, set the explicit cap (which can be larger than the number of named people — e.g., 2 named parents + 3 kids you haven't named yet = cap of 5).
   - This keeps the system simple: one knob per household, no global guesses, no special "unknown" mode.

3. **Add dashboard visibility for fallback limits.**
   - In the RSVPs tab, show a "Uses default limit" badge or filter for households where `max_party_size` is null.
   - Add a small summary line: "X households still use the default 'named + 1' limit." so you can spot which ones may need a real cap before invitations go out.

4. **Update docs.**
   - Bump `ONBOARDING.md` and `HANDOFF.md` "Last verified" dates.
   - Document the recommended cap workflow and the new dashboard indicator.

## Pre-launch checklist

- [ ] `ADMIN_NOTIFICATION_EMAILS` points at `geoddison@gmail.com`; test RSVP alert received.
- [ ] Dashboard shows which households still use the fallback limit.
- [ ] Every household that should have a hard cap has `max_party_size` set.
- [ ] `ZZTEST` count is 0 and `rsvps` is 0 immediately before invitations mail.
- [ ] `rsvp_open` on; `guest_photo_uploads` set intentionally.
- [ ] Master CSV exported as a backup of the final list.
