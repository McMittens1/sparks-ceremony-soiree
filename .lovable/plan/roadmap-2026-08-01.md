# Roadmap

Last updated: 2026-07-30.

## Recently shipped

### Test-data guardrails + environment audit (2026-07-30) — DONE

Verified — not assumed — that the Lovable preview and the live domain share exactly one database, that publishing deploys code only and never touches rows, and that no seed script or automated data loading exists anywhere in the repo. Current-state details live in `ONBOARDING.md` §2 ("Environments and test data"); the reasoning, including why a second environment was rejected, is in `HANDOFF.md`.

- `src/lib/test-data.ts` owns `TEST_HOUSEHOLD_PREFIX = "ZZTEST"` and `isTestHousehold()` — the single source of truth. Don't inline the prefix elsewhere.
- Admin RSVPs tab: a **Real + test / Real households only / Test households only** filter, plus a red banner counted across the whole dataset (not the filtered view) with a one-click **Purge test data (n)** action behind a confirmation dialog.
- Verified end to end: created a `ZZTEST` household, confirmed the banner and count, purged it, re-queried the DB — `guests` 0 rows, `rsvps` 0 rows.
- Known-and-intentional leftovers after a purge: `email_send_log`, `analytics_events`, `suppressed_emails`, `email_unsubscribe_tokens`. Only `suppressed_emails` has teeth — a suppressed test address blocks later mail to it.

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

1. **Import the real household list.** `guests` is currently empty (0 rows, re-verified 2026-07-30). This is the last hard blocker before RSVP is meaningfully live. Every CSV row needs a phone or a postal code; run the import, then use the **Can't verify** filter to confirm zero rows come back, and the test filter to confirm no `ZZTEST` rows survived.
2. **Verify the email pipeline end to end after the import** from the admin Emails tab — check the send log, don't assume. (See `ONBOARDING.md` §5 for the history of this one silently failing for two days.)
3. **Wedding-party personalization copy** — still placeholder text for several members.
4. **Post-launch:** guest photo uploads (`guest_photo_uploads` flag is off by the couple's choice), and a day-of "what's happening now" view if wanted.

## Pre-launch cleanup checklist

Run as queries, not from memory, before invitations go out:

- `guests` contains only real households (no `ZZTEST` prefix, test filter shows 0).
- `rsvps` is empty.
- `guest_photos` and the `guest-photos` storage bucket are empty.
- No real guest address sits in `suppressed_emails`.
