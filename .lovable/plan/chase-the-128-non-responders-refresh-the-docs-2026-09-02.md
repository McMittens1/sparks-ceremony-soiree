# Chase the 128 non-responders + refresh the docs

Two items: build the "who hasn't RSVP'd and how do I reach them" workflow (Issue 1), and bring `ONBOARDING.md` / `HANDOFF.md` back to current state (Issue 4). Then I report back with UI/UX/speed findings — recommendations only, no changes made from that list without your go-ahead.

## What already exists (verified in the dashboard code today)

The guest table already has a **No response** status filter, per-row copy-link, multi-select copy links, a Master CSV export and a TextMyWedding CSV export — all acting on the filtered view. So this is not a from-scratch build; it's making the chase workflow a first-class, phone-friendly path instead of something you assemble from filters each time.

## Item 1 — Chase list

**A. Reachability sub-filter**
Add a "Reachable by" control next to the existing status filter: All / Has phone / No phone (address only). Combined with No response, that gives you the 43-call list and the 85-paper list in two clicks.

**B. Chase panel**
When the view is narrowed to non-responders, show a compact summary strip: how many haven't responded, how many have a phone, how many are address-only, and days remaining until Sept 20.

**C. Copy-ready reminder text**
Per row (and for a multi-select batch), a "Copy reminder" action that puts a short message with that household's personal RSVP link on the clipboard, in English or Spanish. Language is a toggle on the panel, so you set it once per batch. Copy lives in `src/i18n/dictionaries.ts` with the rest of the site strings — no hardcoded text.

**D. Chase CSV**
A dedicated export with the columns you actually need offline: household name, party size, phone, city/state, reachable-by, and the personal link. Distinct from the Master backup CSV so the two never get confused.

Nothing changes in the guest-facing RSVP flow, no new tables, no new public routes. All of it reuses `listGuestsWithRsvps` and the existing signed-link helpers.

## Item 4 — Docs

Update `ONBOARDING.md` and `HANDOFF.md` to today's live state (157 households, 29 RSVPs, current flag values, email pipeline healthy), document the new chase view and export, and bump both "Last verified" dates. Fold the completed items into the plan file.

## UI/UX/Speed review (report only)

While in the code I'll audit and report back on:
- Admin dashboard weight — it's a single ~3,400-line route; note what could be split and whether it's worth it on a live site.
- Public site: image delivery, font loading, hero paint, and any layout shift at 440 and 1280.
- Guest-facing RSVP flow friction: verification step wording, error states, deadline messaging as the date approaches.
- Accessibility spot-check on the newest surfaces.

You get a prioritized list with effort/risk per item. I won't act on it in this pass.

## Technical notes

- Reachability + reminder-copy are client-side derivations off `AdminGuestRow` (it already carries `phone`, `verify_factor`, `verify_token`, `edit_token`) — no server function signature changes.
- Reminder strings are added to both EN and ES dictionaries.
- Chase CSV is a new formatter alongside `toMasterCsv` / `toTextMyWeddingCsv`, exported through the same `exportCsv` helper.
- Verification: `bun run build:dev`, plus Playwright screenshots of the dashboard chase view at 440 and 1280.
