# RSVP: optional email + ZIP verification prompt fix

## 1. Email is already optional — make that obvious

Verified this session: the RSVP submit path treats email as optional (the schema accepts an empty value, and the form has no required attribute or client-side email check). Nothing is enforcing it. The problem is purely copy: the field is labelled "Email — for your RSVP confirmation" with no indication it can be left blank, and that label is a hardcoded English string that the Spanish version of the page never translates.

Changes:
- Relabel the field as optional, e.g. "Email (optional)" with a short helper line under it: leave it blank if you'd rather not get a confirmation or updates.
- Move both strings into the English and Spanish dictionaries so the Spanish page gets them too.
- No server change: a blank email already skips the guest confirmation email while the couple's admin notification still sends.

## 2. ZIP-only household showed the phone question

Confirmed against the database: the ZZTEST ZIP Only household has no phone and a ZIP of 68102, so the server correctly picks the ZIP challenge. Reproduced both entry paths in the running preview — the direct link (`/rsvp?g=ZIP0`) and the name-search path both render the ZIP question correctly right now.

What the screenshot shows is the in-flight state. The verify screen renders immediately with a default of "phone last 4" and only switches to ZIP once the server answers which question this household gets. On a slow connection — or on the published build if it predates this logic — a guest sees the phone question first and can start typing into a 4-character box before it flips. That matches the screenshot exactly: correct household name, wrong question, four digits accepted out of a five-digit ZIP.

Changes:
- Track the verify factor as "not yet known" until the server responds, and show a brief loading state instead of guessing the phone question.
- Reset the factor on every new household selection so a previously verified household can't leave a stale question behind.
- Clear any typed answer when the factor resolves, so a partially typed value can't carry over into the other question's box.
- If the factor lookup fails outright, show a clear retry rather than silently falling back to the phone question.

## Verification

- Walk both entry paths (direct link and name search) for a phone-only, a ZIP-only, and a both-factors household with Playwright at 440 and 1280, including a throttled load to confirm no phone question flashes for the ZIP household.
- Submit one RSVP with the email field blank and confirm it saves, no guest confirmation is queued, and the admin notification still is.
- Run `bun run build:dev`.
- Update `ONBOARDING.md` and `HANDOFF.md` (verify-flow section and RSVP field notes) and bump the "Last verified" dates.
