# Roadmap — Moreno Wedding 2026

**Last verified against the live codebase + database: 2026-07-24.** Update on every material change.

## Current state (short)

- Site is feature-complete for launch.
- `rsvp_open = true`, `guest_photo_uploads = false`, `show_ushers = false`.
- **`guests` table is empty (0 rows).** Prior 52-household import is not present in the current environment — RSVP lookup will fail for real guests until re-imported. Highest-priority unblock.
- `rsvps = 0`, `guest_photos = 0`. `email_send_log` has 39 historical rows.
- 1 admin claimed.
- Wedding-party personalization: only the Best Man has a real `cardRarity`. All 6 bridesmaids, Maid of Honor, and 8 groomsmen render placeholder fallback text.
- `DAY_SCHEDULE` has 6 rows (Ceremony 3:00, Cocktail 3:30, Reception 4:30, Dinner 5:00, Dancing 7:00, Concludes Midnight).
- Build: `bun run build:dev` clean.

## Priority order

1. **Re-import household CSV** via the admin dashboard. Blocks RSVP from being real. Needs the couple's data.
2. **Wedding-party personalization copy** — `coverHeadline`/`coverSubline` for 7 people, `cardAttributes`/`cardAbility` for 8. Needs the couple's writing.
3. **Story section photo decision** — couple is deciding between (a) removing photos, (b) generic engagement photos, (c) background-removed cutouts. Open, not blocked on code.
4. **End-to-end email deliverability test** once real guests exist. The three-stage email fix (2026-07-17) is in code but was explicitly flagged "don't assume it's fixed"; watch `email_send_log` after a real send.
5. **Live cross-device visual QA at 440px / 1280px** — never actually performed with a real browser. Sandbox now supports Playwright — no reason left to defer.
6. **Spanish dictionary proofread** — mirrors English, needs a native-speaker pass.
7. **Sprint 4 remainder** — bundle-size audit, image `srcset`/webp conversion, minimal analytics for RSVP submit, photo upload, calendar click, registry click.
8. **Optional flag flips** — `guest_photo_uploads`, `show_ushers` — couple's call, no code work.

## Out of scope unless explicitly requested

- Multi-admin accounts.
- Public sign-up.
- Renaming the admin URLs.
- Splitting the single-page composition into separate page routes.
- New features (guest book, seating chart, livestream) — this project is deliberately scoped to launch.

## Post-wedding (blocked until 2026-10-10)

- Batch-approve day-of photos in the admin dashboard.
- Optional thank-you / recap section on the homepage.
- Optionally freeze RSVP edits while preserving read-only access.
