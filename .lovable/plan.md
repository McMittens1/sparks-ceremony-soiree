
# Next-Steps Roadmap — Geovanni & Addison Wedding Site

A holistic review after the recent refactor, hero cutout, and Story fixes. Ordered by **value to the finished product**, not by ease. Each item notes impact and effort so you can pick a cut line.

Where a section is already strong, it's called out at the end — no busywork proposed.

---

## Tier 1 — Highest value

### 1. Hero portrait on mobile & tablet
**What:** The pencil cutout only renders at `lg:` and above (`hidden lg:flex`). On phones and tablets — the majority of guests opening the invite — the hero is text-only, which is the least distinctive view of the site.
**Do:** Show the portrait above the headline on mobile (small, centered, ~180–220px, `mix-blend-multiply` preserved) and beside/behind at tablet. Rebalance the mobile countdown spacing so total hero height still fits `100svh` without scroll on a 375×812 device.
**Why it matters:** The cutout is the site's signature image. Hiding it from ~70% of real traffic wastes the strongest visual asset.
**Impact:** High · **Effort:** Low

### 2. RSVP flow polish & confirmation email
**What:** `src/routes/rsvp.tsx` is 762 lines — the single most complex surface and the one action every guest must complete. Two concrete gaps worth verifying/fixing:
- Confirmation email after submit (guests expect a receipt; also lets them forward attendance to a partner).
- Success screen that summarizes what was submitted with an "edit my RSVP" path via the same lookup.
- Inline validation copy and error recovery states (server errors, party-not-found).
**Why:** RSVP is the site's job. A confirmation email removes 80% of "did it go through?" texts.
**Impact:** High · **Effort:** Medium

### 3. Real, tested "Add to calendar" + directions affordance
**What:** Add an `.ics` download and Google Calendar link in the Day section, plus a prominent "Open in Maps" that deep-links (`maps://` on iOS, Google Maps on Android). Currently the address is copy-only.
**Why:** These are the two actions guests take from a wedding site after RSVP. Low-friction saves them from re-typing.
**Impact:** High · **Effort:** Low

### 4. Performance pass — fonts, image priorities, LCP
**What:**
- Cormorant + Work Sans are loaded via Google Fonts `<link>` in `__root.tsx` with 8 axis combinations. Trim to the weights actually used (audit: 400/500 serif italics + 400/600 sans is likely enough) and add `&display=swap` (already present) plus `font-display: optional` for non-critical weights.
- Add `rel="preload"` for the one weight used in the H1.
- Verify the hero PNG is served at appropriate dimensions — a pencil cutout PNG can be huge; a 2x WebP would beat PNG at similar quality.
- Confirm `fetchpriority="high"` only on the LCP image and that engagement gallery images use `loading="lazy"` + explicit `width`/`height` to prevent CLS.
**Why:** Fonts + hero image dominate LCP. On a hotel Wi-Fi guest hitting the site on cellular, this is felt.
**Impact:** High · **Effort:** Medium

---

## Tier 2 — Meaningful polish

### 5. Accessibility audit sweep
**What:** Targeted pass, not a full rewrite:
- Header hamburger `aria-expanded` is set (good) but the mobile drawer uses `aria-hidden={!menuOpen}` while remaining focusable — trap focus inside the panel when open and return focus to the toggle on close.
- Photos section inputs are `disabled` but wrapped in a `<form>` with a submit; add `aria-describedby` pointing at the "uploads open closer" copy so screen readers understand the state.
- Confirm every icon-only button (share, close, hamburger) has an `aria-label` — spot-checks suggest yes, worth a full grep.
- Color-contrast pass on `text-tan` on `ivory` — likely under AA for body copy.
**Why:** WCAG AA is baseline for anything shared publicly, and older relatives use assistive tech more than you think.
**Impact:** Medium–High · **Effort:** Medium

### 6. Story section — imagery consistency & scroll cadence
**What:** The rewritten `StoryTimeline` reads well structurally, but the sequence of engagement photos varies in crop (some vertical, some square). Standardize to a single aspect (e.g. all 4:5) so the timeline has a consistent rhythm. Optional: add a subtle parallax or fade-in on scroll via existing `Reveal` component to make it feel less like a static grid.
**Why:** Story is the emotional anchor; polish here compounds.
**Impact:** Medium · **Effort:** Low–Medium

### 7. Motion & interaction language
**What:** The site has some `Reveal` fade-ins but no consistent motion vocabulary. Define 2–3 primitives (fade-up on scroll, hover lift on cards, page transition) and apply consistently. Respect `prefers-reduced-motion` everywhere (audit current usage).
**Why:** A shared motion language is what separates "good template" from "designed site."
**Impact:** Medium · **Effort:** Medium

### 8. Photos section — real upload flow (or remove the form)
**What:** Right now it's a disabled form with placeholder inputs. Either:
- (a) Wire it to the existing `photos.functions.ts` backend now with a moderation queue, or
- (b) Replace the form with a clean "Coming after the wedding — we'll email you when it opens" card so it doesn't read as broken.
**Why:** A disabled form always looks unfinished. Pick a stance.
**Impact:** Medium · **Effort:** (a) Medium–High · (b) Low

### 9. SEO / social share
**What:** Root `og:image` is set to a `.webp` on `storage.googleapis.com`; `/` route overrides it with the hero portrait cutout. Cutout on transparent bg looks awkward as a social preview (white pencil on white). Commission or generate one dedicated 1200×630 social card with the couple's names, date, and venue baked in, then use it as the site-wide og:image.
**Why:** The share preview is often the first impression before anyone clicks.
**Impact:** Medium · **Effort:** Low

---

## Tier 3 — Nice to have

### 10. Spanish translation completeness
**What:** `LanguageProvider` and `t.nav` exist, but audit whether every user-facing string across sections has an `es` entry (spot-check suggests some inline English literals remain in sections). Also verify the RSVP flow is bilingual.
**Impact:** Medium (depends on guest list) · **Effort:** Medium

### 11. Code maintainability — extract hero countdown & shared primitives
**What:** `HeroSection.tsx` inlines a full countdown component; `Countdown.tsx` already exists. Consolidate. Similarly, `PhotoInput` in `PhotosSection` is a one-off styled input — either move to `components/site/` or accept it as local.
**Impact:** Low · **Effort:** Low

### 12. Analytics & error monitoring in production
**What:** `reportLovableError` is wired in the root error boundary. Confirm it's actually firing to a real sink post-publish, and add lightweight page-view analytics so you know what guests actually visit.
**Impact:** Low–Medium · **Effort:** Low

---

## Already strong — leave alone

- **Header** — active-section highlighting, mobile drawer, language toggle, keyboard/escape handling are all solid.
- **Countdown** component and the standalone `CountdownSection`.
- **Design tokens** in `styles.css` (`--ivory`, `--ink`, `--lavender-deep`, `--tan`) — the palette is coherent and applied consistently.
- **`rs-stack` responsive grid contract** — after the recent refactor this is the right abstraction.
- **Root route metadata, canonical, and preload** — well-configured.
- **Auth-gated admin/portal routes** — correctly using `_authenticated/` with the Supabase gate.

---

## Suggested next sprint

If you want a single, high-value cut: **1 (hero on mobile) + 3 (calendar/maps) + 4 (perf) + 9 (social card)**. That's a day or two of focused work and moves the site from "polished" to "premium as delivered on any device."

Tell me which items you want to tackle and I'll draft a build plan for that specific slice.
