# Move the RSVP deadline to September 20, 2026

## What changes for guests

- Every place the site says "Please respond by September 15, 2026" becomes September 20, 2026 (English) / 20 de septiembre de 2026 (Spanish).
- The "late RSVP" notice on the RSVP page and the countdown-to-deadline copy switch over to the new date automatically.
- RSVP confirmation emails and admin notifications quote the new date.

Nothing about how RSVPs work changes — late responses are still accepted, just with the notice appearing five days later.

## Technical detail

Single source of truth is `src/lib/site.ts`:

- `rsvpDeadline: "2026-09-15T23:59:59-05:00"` -> `"2026-09-20T23:59:59-05:00"`
- `rsvpDeadlinePretty` -> `{ en: "September 20, 2026", es: "20 de septiembre de 2026" }`

Everything else already reads from those two fields (`src/routes/rsvp.tsx`, `FaqSection.tsx`, `src/lib/rsvp.functions.ts`).

One hardcoded leftover to fix: `src/lib/email-templates/rsvp-confirmation.tsx` has `"September 15, 2026"` as a default prop and in its preview fixture. Update both to September 20, 2026 (live sends already pass the real value, so this only affects the template preview).

Also check `src/lib/wedding-data.ts` FAQ copy for a spelled-out deadline and update if present.

## Docs

Per the docs-are-code rule, bump "Last verified" in `ONBOARDING.md` and `HANDOFF.md` and note the deadline change if either states the date.

## Verification

- `bun run build:dev`
- Playwright screenshot of `/rsvp` and the home FAQ closing CTA at 440 and 1280 confirming the new date renders.
