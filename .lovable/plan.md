# Sprint 2 Wedge — Guest self-service edits + calendar/maps polish

Picking the two highest-leverage items still open from the Sprint 2 backlog (roadmap #12 and #13). Both are guest-facing, both remove real friction, and neither needs new infra.

## Why these two now

- Admin dashboard + photo moderation just shipped, so the couple can manage the backend. The remaining pain is on the **guest side**: today a guest who mistypes their RSVP has to email you to fix it, and "add to calendar" / "get directions" are missing on a mobile-first wedding site.
- #14 (perf pass) and #15 (analytics) are worth doing but lower urgency until more guests are on the site.

## Scope

### 1. Signed RSVP edit links (#12)

Let each guest re-open their RSVP from a personal link without a login.

- New server fn `getRsvpByToken({ token })` — verifies an HMAC-signed token (guest_id + expiry), returns the current RSVP so the form can prefill.
- New server fn `updateRsvpByToken({ token, ... })` — same validator as the public submit, but scoped to the token's guest_id. No admin bypass.
- Token format: `base64url(guest_id).base64url(exp).base64url(hmac_sha256(guest_id|exp, RSVP_EDIT_SECRET))`. 90-day expiry, regenerated on each admin CSV export.
- New env secret `RSVP_EDIT_SECRET` (request via add_secret if missing).
- Route: `/rsvp/edit/$token` — reuses the existing RSVP form component in "edit" mode (prefilled, submit button says "Update RSVP").
- Admin CSV `rsvp_url` column starts emitting the signed edit URL instead of a bare guest link so the couple can paste it into a text/email.
- Confirmation email (`rsvp-confirmation.tsx`) gains an "Edit your RSVP" button using the same token.

### 2. Calendar + maps polish (#13)

- New public route `/api/public/wedding.ics` — returns a static VCALENDAR built from `src/lib/wedding-data.ts` (event title, start/end, venue address, description, organizer). Cached with `Cache-Control: public, max-age=3600`.
- "Add to Calendar" button in `DaySection` linking to `/api/public/wedding.ics` (works on iOS/macOS/Outlook) plus a Google Calendar template URL fallback.
- Travel section: swap the plain address for a "Get directions" button that opens `https://www.google.com/maps/dir/?api=1&destination=<encoded address>` on desktop and the native maps app on mobile via `maps://` fallback for iOS.
- Copy-address-to-clipboard affordance next to the venue address.

## Out of scope

- #14 perf pass, #15 analytics — next wedge.
- Auth email branding, EN/ES proofread — small standalone tasks.
- No schema changes, no new tables, no RLS changes.

## Technical details

- Token verify uses Web Crypto `crypto.subtle.importKey` + `sign('HMAC', ...)` — Worker-safe (no Node `crypto` needed in the hot path). Constant-time compare via `timingSafeEqual`-style loop.
- Edit route is public (`/rsvp/edit/$token`), not under `_authenticated`. Server fn is the ONLY authority — never trust the client's decoded guest_id.
- `.ics` route lives under `/api/public/` per the public-endpoints rule; no auth, signature not required (public info).
- All new client copy added to both `en` and `es` in `i18n/dictionaries.ts`.

## Verification

- Typecheck clean.
- Generate a token for a real guest, open `/rsvp/edit/<token>`, edit, confirm the DB row updated and admin dashboard reflects the change.
- Tampered token (flip one char) → 401, form does not render.
- Expired token → friendly "link expired, contact the couple" page.
- `/api/public/wedding.ics` opens in Apple Calendar and imports the correct date/venue.
- "Get directions" opens Google Maps on desktop and the native app on iOS/Android.
- Security scan re-run: no new findings.
