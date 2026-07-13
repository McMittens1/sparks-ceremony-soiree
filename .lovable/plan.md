# Pre-publish plan

Not everything has to ship on day one. This is ordered by "if we skip it, publishing gets embarrassing" → "nice to have, can follow post-launch."

## 1. Content + copy audit (must do before publish)

Real guests will read this — placeholder or wrong info is the #1 embarrassment risk.

- Read every section end to end at 390 / 768 / 1440: hero, countdown, Our Story, Day-of schedule, Wedding Party, Travel, Photos, Registry, FAQ, Footer.
- Verify facts against `src/lib/wedding-data.ts` and `src/lib/site.ts`: date (Oct 10 2026), venue address, RSVP deadline (Sept 15 2026), fallback contact, hotel names, registry links (Zola, The Knot, both Venmos), Sparks' Barn address on Travel.
- FAQ: confirm answers match reality (dress code, kids, plus-ones, arrival time, indoor vs outdoor).
- Story entries: last read — typos, tense, punctuation. `DATE_CARDS` currently shows "MMXXVI" but year is 2026 — confirm intended.
- Spanish translations: click EN/ES on every section and make sure nothing is missing or awkward. If ES isn't ready, hide the toggle for launch and re-enable post-publish.

## 2. RSVP end-to-end test (must do)

RSVP is the one thing that can silently lose data — worth 20 minutes of real testing.

- Load `/rsvp` with no `?g=` param → lookup by name works.
- Load with `?g=<real-slug>` → hydrates guest, existing RSVP if any.
- Submit as attending, then re-open and edit → previous answer is preloaded.
- Submit as not attending, add/remove attendees, mark a child.
- Confirm submissions land in the DB (check via backend tools) and the fallback contact shows on error.
- Confirm the deadline banner appears when the clock is past `SITE.rsvpDeadline`.
- Verify `attachSupabaseAuth` middleware in `src/start.ts` — RSVP server functions must not require auth (they're guest-facing), or the form silently 401s.

## 3. SEO + social share polish (must do)

- Root `__root.tsx` has generic title/description. Give each shareable route its own `head()` with unique `title`, `description`, `og:title`, `og:description`, `twitter:card`. `/rsvp` already has partial metadata; audit /` and confirm og:image is a real image on the deployed domain.
- Replace the hardcoded `https://sparks-ceremony-soiree.lovable.app` in `src/routes/index.tsx` with the final published URL if we're changing slugs.
- Add `robots` meta as `index, follow` on public routes and `noindex` on `/rsvp` (guest data, not for search).
- Add a real `favicon.ico` + apple-touch-icon if the current one is the Lovable default.
- Structured data: JSON-LD `Event` on `/` with name, startDate, location — makes Google/iMessage previews richer.

## 4. Accessibility pass (must do — this is a wedding site, older relatives will use it)

- Every image has real alt text (engagement photos, party portraits, hero). `alt=""` is only OK for decorative photos.
- Color contrast: `text-body` / `text-soft` on `bg-ivory` — verify AA at 14px+ body sizes.
- Keyboard-only pass: tab through Header → RSVP button → mobile menu → every section anchor. Skip-link works.
- Focus rings visible on all interactive elements (buttons currently rely on browser defaults).
- Reduced-motion: countdown, Reveal, StoryTimeline animations should respect `prefers-reduced-motion`.
- Screen reader smoke test (VoiceOver): hero couple names, countdown, section headings all announce sensibly.

## 5. Performance + bundle sanity (nice, do before publish if quick)

- Hero image (`favorite.jpg`) is already preloaded — verify it's not oversized. Serve at ≤1600px wide, WebP if we're not already.
- Engagement + party portraits: confirm they're routed through `lovable-assets` (CDN) not raw imports of huge originals.
- Check for unused imports and dead components (the refactor already killed most; do a final `rg` sweep).
- Lighthouse-in-browser on `/` at mobile — target Perf ≥ 85, A11y ≥ 95, Best Practices ≥ 95, SEO 100.

## 6. Error/empty states + guardrails

- 404 page (`NotFoundComponent`): already exists, but wording is fine. Confirm it renders when someone hits `/oops`.
- Error boundary: try to trigger by throwing in a section, confirm "Try again" invalidates + resets cleanly.
- RSVP: what happens if the DB is offline? Confirm the fallback contact text shows.

## 7. Security scan (must do — gate for publish)

- Run the built-in security scan on the project.
- Verify RLS + GRANT on the RSVP + guest tables — public form must only insert/update its own row via `slug`, never list all guests.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` never appears in client code.

## 8. Publish

- Publish to Lovable URL (choose a final slug — current `sparks-ceremony-soiree` is fine, or pick something shorter like `moreno-hillman`).
- Then, from the publish dialog: connect the custom domain if the couple owns one.
- After publish, re-test the `og:image` and canonical URLs against `https://<final-domain>/` in an actual iMessage/WhatsApp preview.

## Post-publish (fine to defer)

- Story timeline photo pass — real captions and photo tuning.
- Analytics (if wanted): plausible/umami tag on published domain only.
- Add-to-calendar button on Day-of section (Google + ICS).
- Guestbook / photo upload (Photos section currently hand-rolls a form — decide if we want it live or gated).
- Registry: gentle nudge to add gift categories or a honeymoon fund highlight.
- Cleanup pass on `src/styles.css` `.rs-*` utilities + inline `style={}` in `rsvp.tsx` (called out as deferred in the refactor plan).
- Copy the two hex constants left in `__root.tsx` NotFoundComponent/ErrorComponent onto tokens.

## Order of operations

1 → 2 → 4 → 3 → 7 → 5 → 6 → **publish** → 8 (custom domain, share, celebrate).

Sections 1, 2, 3, 4, 7 are hard gates. 5 and 6 are "spend 30 min, ship whatever you got." Everything under Post-publish waits.

## What I'd tackle first this turn

Say the word and I'll start with **Section 1 (content audit)** — I'll walk every route at three viewports, list every factual/copy issue I find, and we can fix them in one pass before moving to RSVP testing.
