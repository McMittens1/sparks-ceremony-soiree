
# Morenowedding2026 — Expanded Roadmap

Goal: take the site from "polished front-end" to "production-ready wedding platform" — launch, admin, ops, analytics, guest experience, and content — reprioritized by real value before launch.

Legend: Impact (H/M/L) · Effort (L/M/H). Items grouped by tier, not category, so we execute in value order.

---

## Tier 0 — Launch blockers (do first)

Nothing ships publicly until these pass.

1. **End-to-end smoke test on live URL** — H / L
   Manual + Playwright pass on `morenowedding2026.com` covering: RSVP lookup (name + slug, typos, not-found), RSVP submit (attending / partial / declining), edit existing RSVP, address confirmation, song request, photo upload flow, registry outbound links, all nav anchors, EN↔ES toggle on every section, mobile menu focus trap. Record console errors, CLS, and 4xx/5xx in network. Real iOS Safari + Android Chrome, not just DevTools.

2. **RSVP confirmation email + success screen** — H / M
   After `submitRsvp` succeeds: send templated confirmation (attendee list, edit link with slug, event details) and render a real success screen with "Edit my RSVP" CTA. Currently the form silently upserts.

3. **Photo upload confirmation + admin notification** — H / L
   Confirmation email to uploader ("received, pending review"), admin email with moderation link. Today uploads land in `guest-photos` bucket with `status='pending'` and nobody knows.

4. **Admin RSVP + upload notifications** — H / L
   Digest or per-event email to the couple when an RSVP is submitted/edited and when a photo is uploaded. Keeps them in the loop without opening `/admin`.

5. **Error boundary + monitoring wired to real sink** — H / L
   `reportLovableError` exists but only pipes to `window.__lovableEvents`. Confirm Lovable's built-in error capture is picking these up in production; add explicit boundaries around RSVP form and photo upload so a bad submit doesn't blank the page.

6. **Security & RLS audit before public share** — H / L
   Re-run security scan. Verify: `guest_photos` insert policy for anon uploads is scoped, `guests`/`rsvps` have no anon SELECT, `user_roles` cannot be written from client, admin server fns all re-check `has_role`. Confirm `SUPABASE_SERVICE_ROLE_KEY` never appears in a client bundle.

7. **Hero on mobile/tablet + no-scroll `100svh`** — H / M
   Cutout portrait currently only renders at `lg:`. Show a scaled portrait above the headline on mobile, beside on tablet; ensure countdown fits `100svh` on 375×812 without scroll. (Carried from previous roadmap — still a launch blocker for mobile share links.)

8. **Content proofread pass (EN + ES)** — H / L
   Full read-through of `i18n/dictionaries.ts` and every section: tone consistency, grammar, wedding-appropriate phrasing, missing/placeholder Spanish keys, CTA wording ("RSVP" vs "Confirmar asistencia"), date/time formatting per locale.

9. **SEO + social share card** — M / L
   Dedicated 1200×630 OG image (couple photo + names + date) at absolute HTTPS URL, wired only on `index.tsx` head — not root. Verify Twitter/iMessage/WhatsApp previews.

---

## Tier 1 — High-value ops & admin (pre- or immediately post-launch)

10. **Admin dashboard upgrade** — H / M
    Current `/admin` is functional but sparse. Add: totals (invited / responded / attending / declined / kids / pending photos), search + filter (by status, party size, city), sortable columns, bulk actions (resend invite, export CSV), inline edit for address + email, per-guest RSVP history/audit trail.

11. **Photo moderation UI** — H / M
    Grid of pending uploads with approve/reject/delete, caption edit, uploader info, one-click bulk approve. Wire to `guest_photos.status`.

12. **RSVP edit link via signed token** — H / M
    Confirmation email links back to `/rsvp?slug=XXX` prefilled. Consider short-lived signed token instead of raw slug in URL to avoid slug-guessing for edits.

13. **Real "Add to calendar" + directions deep links** — H / L
    `.ics` download, Google Calendar URL, and `maps://` / `https://maps.google.com` deep links from the Day section. Currently copy-only.

14. **Performance pass** — M / M
    Trim Google Fonts to used weights, `font-display: swap`, verify hero PNG dimensions vs. render size, `fetchpriority="high"` on LCP image, `loading="lazy"` + `decoding="async"` on gallery, audit LCP/CLS/INP on live URL.

15. **Analytics — lightweight** — M / L
    Add a privacy-friendly analytics tool (Plausible or the built-in Lovable analytics) for pageviews, device/language split, RSVP funnel (view → start → submit), registry outbound clicks, photo upload count. No cookies, no consent banner needed.

---

## Tier 2 — Guest experience enhancements

16. **Personalized welcome after RSVP** — M / M
    After lookup, greet by name across the site, show "You're attending — see you Oct 3" strip, hide the RSVP CTA in nav.

17. **Weekend itinerary / personalized schedule** — M / M
    Per-guest schedule based on RSVP (welcome dinner vs. ceremony-only, kids activities). Pulls from `party_members` + a new `events` table.

18. **Digital guestbook / well-wishes** — M / M
    Public feed of short messages, moderated. Reuses `guest_photos` moderation pattern.

19. **Weather widget on Travel/Day section** — L / L
    `api/public/weather.ts` already exists — surface a 10-day forecast card as the date approaches.

20. **Interactive venue/parking map** — M / M
    Embedded map with pinned parking, ceremony, reception, restrooms. Static SVG is fine; Mapbox if we want zoom.

21. **Apple/Google Wallet pass** — L / H
    Event pass with date/time/venue. Nice-to-have; skip unless bandwidth allows.

22. **Post-wedding gallery** — M / M
    Same `guest_photos` table, but with pro photos surfaced first, downloadable, filter by moment (ceremony/reception).

---

## Tier 3 — Code health & maintainability

23. **Consolidate hero + countdown duplication** — L / M
    Two countdown paths (`Countdown.tsx` + `HeroSection` inline) drifted before; unify.

24. **Photo upload component extraction** — L / L
    `PhotoInput` inline in section; pull into reusable component with progress + error UI.

25. **Motion primitives + `prefers-reduced-motion`** — M / L
    2–3 named primitives (fade-up, reveal, parallax) and gate them on the media query.

26. **Accessibility audit** — M / M
    Focus trap in mobile menu, `aria-describedby` on disabled form inputs, contrast check on `text-tan` over `ivory`, keyboard-only RSVP flow.

27. **Story imagery consistency** — L / L
    Standardize aspect ratios in `StoryTimeline`, unified rounded/shadow treatment.

---

## Already strong — leave alone

Header, hero desktop composition, design tokens in `styles.css`, `rs-stack` grid contract, root route metadata, auth-gated admin route, Supabase server-fn split (`.functions.ts` vs `.server.ts`), fuzzy guest lookup via `pg_trgm`.

---

## Proposed execution order

**Sprint 1 (launch):** #1, #2, #3, #4, #5, #6, #7, #8, #9
**Sprint 2 (admin/ops):** #10, #11, #12, #13, #14, #15
**Sprint 3 (delight):** #16, #17, #18, #19, #20, #22
**Backlog:** #21, #23–#27

---

## Question before we build

Which sprint should I turn into a build-ready plan next — full Sprint 1, or a subset (e.g. #2 + #3 + #4 as the "notifications + admin alerts" wedge, since your email domain is already configured)?
