# Current plan

Last updated: 2026-08-04

## Just shipped / verified

- Guest-added party members: per-invitation `max_party_size` cap, non-removable invited rows, "Name to come" placeholders, server-stamped `added_by_guest` / `name_pending`, admin badges and one-click promotion into the invite list.
- 10-household `ZZTEST` matrix (`ZZT001`–`ZZT010`) driven end-to-end at 1280px and 440px: both verification factors, fallback vs explicit caps, cap-exact and zero-slot households, pending names, submit with/without email, decline, re-edit of a submitted RSVP, admin badges and promotion. Confirmation and admin-notification emails both sent. All test rows purged; `guests` = 86, `ZZTEST` = 0, `rsvps` = 0.

## Next up (blocking invitations)

1. **Repoint `ADMIN_NOTIFICATION_EMAILS`.** It currently resolves to `noreply@notify.morenowedding2026.com`, so RSVP alerts land in the sending mailbox instead of a real inbox.
2. **Finish the guest list.** Add known individual names inside households; set `max_party_size` only where the real headcount differs from the default (named + 1 open slot).
3. **Wedding-party personalization copy** (see `HANDOFF.md` §5).

## Pre-launch checklist

- [ ] `ADMIN_NOTIFICATION_EMAILS` points at a monitored inbox; test RSVP alert received.
- [ ] Every household that should have a hard cap has `max_party_size` set.
- [ ] `ZZTEST` count is 0 and `rsvps` is 0 immediately before invitations mail.
- [ ] `rsvp_open` on; `guest_photo_uploads` set intentionally.
- [ ] Master CSV exported as a backup of the final list.
