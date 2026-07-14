
## What the refactor actually improved (kept as-is)

- One source of truth for section padding / max-width via `.rs-section` and `.rs-section-bleed` (removed ~110 lines of `!important` overrides).
- Predictable `.rs-stack{,-2,-3,-4}` grid utilities with `clamp()` gaps.
- Hero uses `100svh - --header-h` correctly across all viewports.
- Header/mobile drawer no longer fight ad-hoc breakpoints.

These wins stay. The regressions below are all from over-collapsing layouts to a single column, plus one hash-scroll bug that predates the refactor but became more visible.

## What regressed and why

1. **Story section looks worse on laptops/small desktops.** `StoryTimeline` was rewritten mobile-first with the two-column + gutter layout gated behind `lg:` (>=1024px). Your current viewport is 947px, so you see the stacked mobile layout on a laptop. Previous design promoted the timeline much earlier (around md/768px) with images and text side-by-side and the vertical gutter/diamond between them.
2. **Numeric "01/02" ghost numeral** is now `clamp(120px, 34vw, 380px)` — on mobile 34vw is enormous and overlaps content; before it was more restrained.
3. **Story photo stack heights** use `max-h-[52svh]` / `max-h-[22svh]` — capped by viewport height so on short/wide windows they render tiny.
4. **Countdown section is `hidden lg:block`** — anything under 1024px sees nothing (the hero has its own mobile countdown, but the tablet range 768–1023px loses the standalone countdown that existed before).
5. **Grid columns in `.rs-stack-3` / `-4` collapse to 1 column below 640px and stay 2 columns until 1024px** — previously several sections promoted to 3/4 cols at md (768px). Tablets look emptier than before.
6. **Auto-scroll to Our Story on load.** `src/routes/index.tsx` runs `scrollIntoView` inside a `useEffect` whenever `location.hash` is present. If the URL carries `#story` (from a prior visit, a back-nav, or a shared link) it scrolls immediately on mount. Intended behavior: land at the top of the hero on a fresh load; only smooth-scroll when the hash changes during the session.

## Plan

### A. Fix auto-scroll on initial load (`src/routes/index.tsx`)

- Track a `hasMountedRef`. On first mount, do not scroll — instead call `window.scrollTo(0, 0)` once so the browser doesn't restore a hash position.
- Only run `scrollIntoView` for hash changes that happen after mount (in-session nav from header links).
- Also set `<ScrollRestoration getKey={location => location.pathname} />` behavior equivalent by clearing hash on first paint if desired (optional; primary fix is the mount guard).

### B. Restore the Story timeline visual (`src/components/site/StoryTimeline.tsx`)

- Promote the two-column layout at `md:` (768px) instead of `lg:` — matches the previous look on laptops and tablets.
- Keep the mobile-first single column below `md`.
- Reduce the ghost numeral to `clamp(96px, 22vw, 320px)` and cap negative offsets so it never overlaps the first line of body text on narrow widths.
- Drop the `svh`-based photo caps (`max-h-[52svh]`, `max-h-[22svh]`); use intrinsic `aspect-ratio` sizing so short windows still render photos at readable sizes.
- Keep the `StoryGutter` diamond/line, but only render it at `md:` and up (where the grid actually has 3 columns).

### C. Restore Countdown standalone section on tablet (`src/components/site/sections/CountdownSection.tsx`)

- Change `hidden lg:block` to `hidden md:block` so the tablet range shows the standalone countdown again. Hero's inline mobile countdown stays for < md.

### D. Restore earlier column promotion for stacked grids (`src/styles.css`)

- `.rs-stack-3`: 1 col → 2 col at `sm` (640) → **3 col at `md` (768)** instead of waiting until `lg`.
- `.rs-stack-4`: 1 col → 2 col at `sm` → **4 col at `md`** instead of `lg`.
- `.rs-stack` (asymmetric 5/7): keep promotion at `lg` (this is the story/day content-with-sidebar layout and needs the width).
- No new `!important`, no ad-hoc media queries elsewhere.

### E. Guardrails so refactors don't silently redesign

- Add a short comment block at the top of `src/styles.css` documenting the intended breakpoint promotions per utility (sm/md/lg) as the contract.
- Add a comment in `StoryTimeline.tsx` noting the `md:` promotion is a design requirement, not incidental.

### Out of scope / unchanged

- Hero section behavior (already correct).
- Mobile drawer, Header, RSVP route.
- Colors, typography scale, iconography, section content.
- No new dependencies, no data or backend changes.

## Verification

Playwright screenshot pass at 375, 430, 768, 947 (your current), 1024, 1280, 1920:

- Fresh load of `/` lands at hero top; no jump.
- Fresh load of `/#story` scrolls to Our Story (intended deep-link).
- 768–1023px: Story timeline renders side-by-side with gutter; Countdown standalone section visible; 3-up / 4-up grids no longer look half-empty.
- >=1024px: Matches the pre-refactor desktop layout.
- <768px: Mobile layout unchanged (still stacked, hero countdown inline).
- Confirm no return of `!important` overrides or duplicated media queries.
