# Roadmap

Last updated: 2026-07-30.

## Recently shipped

### Per-household RSVP verification + guest-facing address removal (2026-07-30) — DONE

Shipped exactly as planned. See `ONBOARDING.md` §2 for current-state behavior and `HANDOFF.md` for the reasoning.

- Migration: `guests.phone` dropped `NOT NULL`; check constraint `guests_has_verify_factor` requires phone **or** postal_code.
- `verifyFactorFor()` in `src/lib/rsvp.functions.ts` returns `"phone_last4" | "zip" | "none"`; `getVerifyTargetLabel` reports it and `verifyHouseholdAccess` branches on it. ZIP compares the first 5 digits only. Lockout and session-token minting untouched.
- `PublicGuest` no longer carries `slug`, `phone`, or `address`.
- `updateGuestAddress` and the guest-facing address confirm/edit block are gone. Addresses are admin-only.
- Verify copy lives in `src/i18n/dictionaries.ts` (`verifyHintZip`, `verifyPlaceholderZip`).
- Admin dashboard: "Verifies with" column + CSV field, and a **Can't verify (no phone/ZIP)** filter to catch unreachable households before invitations go out. The old "Address unconfirmed" filter was removed — guests can no longer confirm an address, so it could never match.
- Verified: `bun run build:dev`, plus Playwright at 440 and 1280 through both a phone-factor and a ZIP-factor household (ZIP stored as `68522-1234` accepted `68522`; no street address rendered on the page in either case).

## Next up

1. **Import the real household list.** `guests` currently holds 1 test row. This is the last hard blocker before RSVP is meaningfully live. Every CSV row now needs a phone or a postal code; run the import, then use the "Can't verify" filter to confirm zero rows come back.
2. **Verify the email pipeline end to end after the import** from the admin Emails tab — check the send log, don't assume. (See `ONBOARDING.md` §5 for the history of this one silently failing for two days.)
3. **Wedding-party personalization copy** — still placeholder text for several members.
4. **Post-launch:** guest photo uploads (`guest_photo_uploads` flag is off by the couple's choice), and a day-of "what's happening now" view if wanted.
