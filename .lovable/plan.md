# Site health check — September 1, 2026

Everything I checked is live-verified today. Short version: **nothing is broken.** The site builds clean, RSVPs are flowing, email delivery is healthy. The real issues are timing and content, not bugs.

## What I verified today

- 157 households, **29 RSVPs in** (28 attending, 1 declined). Most recent: this morning.
- Steady trickle since Aug 7 — 1 to 3 per day, no gaps, no stall.
- Every household can be verified (0 with neither phone nor ZIP). 0 households currently locked out, 0 with failed verification attempts on record.
- Email pipeline is healthy: every send in the last two weeks went `pending` → `sent`. The 25 `failed`/`dlq` rows are all from mid-July, before the queue fix, and nothing has failed since. The 2 suppressed addresses are old `example.com` test accounts.
- `bun run build:dev` passes.
- Flags: `rsvp_open` on, `show_portraits` on; `show_wedding_party`, `show_ushers`, `guest_photo_uploads` off.

## Issue 1 — 128 households haven't RSVP'd and you can't email any of them

This is the one that actually matters. The deadline is **September 20 — 19 days away**, and 82% of the guest list hasn't responded.

The problem: **not one of those 128 non-responders has an email address on file.** Only 11 households in the entire database have an email at all, and all 11 have already RSVP'd. So an email reminder campaign has literally zero possible recipients. Of the 128, 43 have a phone number; the other 85 are address-only.

What I'd build:

- A **"Hasn't responded" view** in the admin dashboard: filterable list of the 128, showing name, phone (or "no phone"), and their personal RSVP link, with a one-click copy and a CSV export. That turns "who do I chase?" into a list you can work from your phone.
- **Copy-ready reminder text** for the 43 with phones — a short message with their direct link, in English and Spanish, so you can paste and send.
- For the 85 address-only households, the list doubles as a call/paper checklist.

Optional but worth deciding: whether the Sept 20 deadline is real or soft. The site already shows a late notice rather than closing, so nothing breaks if people trickle in after — but the caterer number is a different question.

## Issue 2 — Wedding Party is still hidden and still on placeholder copy

The 27 real names are in the data, but no card stats, abilities, or magazine-cover headlines are written, which is why the section is still flagged off. Ushers likewise. It's the only visibly unfinished part of the site. With 5 weeks to the wedding, this is the natural next content push — you can review it privately at `/?preview_party=1&preview_ushers=1` without flipping anything live.

## Issue 3 — Guest photo uploads are built but never turned on

Fully functional, zero photos in the system, flag off. Probably deliberate (you'd flip it the week of the wedding), but if you want guests uploading engagement-party or getting-ready photos beforehand, it's a one-toggle change plus a QA pass on the moderation queue.

## Issue 4 — Docs are 18 days stale

`ONBOARDING.md` and `HANDOFF.md` were last verified Aug 14, when there were 12 RSVPs and the headcount picture was different. Whichever of the above we do, both get updated and re-dated in the same turn.

## Nothing to do here

- No security issues found; RLS, admin gating, and verification lockout all behave as documented.
- No runtime errors, no failed sends, no locked-out guests.
- The ZIP-audit idea from the last session is now lower value: with 0 unverifiable households and 0 recorded failed verification attempts, no guest has actually hit a wrong-ZIP wall. Worth doing only if you hear from someone who can't get in.

## What I need from you

Tell me which to start with. My recommendation, in order: **Issue 1 (chase the 128)**, then **Issue 2 (finish the Wedding Party)**. Issue 3 whenever you want it live, Issue 4 rides along automatically.

## Technical notes

- Issue 1 adds a filter and export to the existing dashboard guest list plus a reminder-link column; it reuses `listGuestsWithRsvps` and the existing signed-token helpers, so no new tables, no new public routes, and no change to the RSVP flow itself.
- Reminder text lives in `src/i18n/dictionaries.ts` alongside the other EN/ES copy — no hardcoded strings.
- Issue 2 is data-only edits to `PARTY` in `src/lib/wedding-data.ts` (`cardRarity`, `cardAttributes`, `cardAbility`, `coverHeadline`, `coverSubline`); the card and cover components already fall back to placeholders and need no changes.
- Verification for either: `bun run build:dev`, plus Playwright screenshots at 440 and 1280.
