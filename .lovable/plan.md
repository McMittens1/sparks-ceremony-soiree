# Roadmap

Last updated: 2026-08-04.

## Recently shipped

### Guest-added party members with a per-invitation cap (2026-08-04) — DONE

Households can now add people the invitation didn't name, up to a cap, including "name to come" placeholders for plus-ones and children. Current-state details in `ONBOARDING.md` §2; reasoning in `HANDOFF.md` §0.

- Migration: `guests.max_party_size` (nullable) + `validate_guest_max_party_size` trigger blocking a cap below the named roster.
- `effectivePartyLimit()` in `src/lib/rsvp.functions.ts` is the single cap rule: explicit `max_party_size`, else named members + 1. Surfaced to guests as `PublicGuest.party_limit`; enforced again in `writeRsvp` (`too_many_guests`).
- Invited rows can't be removed by the household — only marked not attending (`missing_invited_guests` server-side; no Remove button client-side).
- `added_by_guest` / `name_pending` are stamped server-side from the invited roster; pending rows store as `Guest of <household>`.
- `src/lib/rsvp-party.ts` holds the shared list rules used by `/rsvp` and `/rsvp/edit/$token`.
- Admin: max-party-size field, guest-added / name-pending badges, per-name and bulk `promoteAddedGuests`, `max_party_size` + `party_limit` in the master CSV.
- Verified with a temporary `ZZTEST` household via Playwright, then purged.

## Next up

1. **Finish the guest list.** 86 real households are in, 0 test rows, 0 that can't verify (re-verified 2026-08-04). Outstanding: individual names inside households where they're known, and `max_party_size` on households whose real headcount differs from "named + 1".
2. **Verify the email pipeline end to end before invitations go out** from the admin Emails tab — read the send log, don't assume. (`ONBOARDING.md` §5 for why.)
3. **Wedding-party personalization copy** — still placeholder for everyone but the Best Man.
4. **Post-launch:** guest photo uploads (`guest_photo_uploads` off by the couple's choice), Spanish proofread, and a day-of "what's happening now" view if wanted.

## Pre-launch cleanup checklist

Run as queries, not from memory, before invitations go out:

- `guests` contains only real households (test filter shows 0).
- `rsvps` is empty.
- `guest_photos` and the `guest-photos` storage bucket are empty.
- No real guest address sits in `suppressed_emails` (currently 2 rows — confirm they're test addresses).
