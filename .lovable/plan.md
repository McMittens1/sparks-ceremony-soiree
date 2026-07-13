## Root cause

The hero is being controlled in three places that fight each other, so its "fill the screen" behavior only works at desktop and breaks on tablet/mobile:

1. `src/components/site/sections/HeroSection.tsx` sets `height: calc(100vh - 73px)` + `minHeight: 560` + `containerType: size` inline.
2. `src/styles.css` under `@media (max-width: 1023px)` overrides that with `height: auto !important; min-height: 0 !important; container-type: normal !important; display: block !important;` and gives `.rs-hero-inner` its own padding.
3. `.rs-hero-title` has a `!important` font-size rule in `@media (max-width: 767px)` that overrides the inline `clamp()` typography set in the component.

Consequences that match what you're seeing:

- On tablet/mobile the hero collapses to its content height, so Section II — Our Story is visible on initial load.
- `100vh` is wrong on mobile browsers (address bar) and the subtracted `73px` header assumes desktop header padding; on mobile the header is shorter, so even the desktop rule is off by a few px.
- Typography is defined twice (inline `clamp` + `!important` media query), so tweaks in one place silently do nothing.
- The countdown lives in two components (`HeroSection`'s `HeroCountdown` for `<lg`, `CountdownSection` for `≥lg`) — that's fine as a pattern, but only if the hero height rule is consistent, otherwise the mobile countdown sits inside a collapsed hero and Story shows through.

## Fix — one source of truth per concern

Refactor so each concern is owned in exactly one place. No `!important` overrides for layout.

### Hero height (owned by HeroSection.tsx)

- Use `min-height: 100svh` (small viewport height — stable across mobile browser chrome), with a `@supports` fallback to `100vh`.
- Subtract the actual header height via a CSS variable `--header-h` set on `:root` (default `64px`, `md: 73px`) instead of hard-coding `73px`.
- Apply the same rule at every breakpoint. Delete the `@media (max-width: 1023px)` hero override block in `styles.css` entirely.
- Keep `display: flex; flex-direction: column` at all sizes so the inner content vertically centers within the full-viewport hero. Drop `containerType: size` (it was only needed for the desktop `cqh` typography trick — replace with `svh`-based `clamp` so units work at every size).

### Hero inner layout (owned by HeroSection.tsx)

- Single flex container that is `flex-direction: column` below `lg` and `flex-direction: row` at `lg+`. No CSS override needed.
- Padding uses `clamp()` in the component; remove the mobile padding override in CSS.

### Hero image visibility + cropping (owned by HeroSection.tsx)

- Rendered only at `lg+` via `hidden lg:flex` (already correct).
- Keep the `aspect-ratio: 3/2`, `object-fit: cover`, `object-position: center 35%`. This is the only place image styling lives; the old `.rs-hero-image` mobile rules in CSS are already gone — verify none re-appear.

### Countdown placement (owned by breakpoint, not by duplicated logic)

- `HeroCountdown` inside `HeroSection` renders `lg:hidden` (already correct).
- `CountdownSection` renders `hidden lg:block` (already correct).
- Because the hero now always fills the viewport, on `<lg` the countdown sits inside the full-viewport hero — Story stays below the fold. No additional change needed once the height rule is fixed.

### Responsive typography + spacing (owned by HeroSection.tsx)

- Replace `cqh`-based `clamp()` values (which depend on `container-type: size`) with `svh` + `vw`-based `clamp()` so they scale correctly at every viewport without needing container queries.
- Delete the `.rs-hero-title { font-size: … !important }` rule from `styles.css` so the component's `clamp()` is the only source.
- Tighten the small-viewport clamp floors so title, subtitle, buttons, and countdown remain visually balanced on a 360px phone up through a 1024px tablet.

### Section II transition

- No structural change. Once the hero is always `min-height: 100svh - header`, Section II — Our Story naturally sits below the fold on initial load at every breakpoint.

## Files touched

- `src/components/site/sections/HeroSection.tsx` — rewrite height + clamp values; remove `containerType`; keep image + countdown wiring.
- `src/styles.css` — delete the `.rs-hero-section` / `.rs-hero-inner` / `.rs-hero-text` block inside `@media (max-width: 1023px)`; delete the `.rs-hero-title { … !important }` inside `@media (max-width: 767px)`; add `:root { --header-h: 64px } @media (min-width: 768px) { :root { --header-h: 73px } }`.
- No changes to `CountdownSection.tsx`, `Header.tsx`, `StorySection.tsx`, or any other section — the refactor is scoped to the hero.

## Verification (Playwright, per-viewport reloads, not window resize)

For each of `375×812` (mobile), `430×932` (large mobile), `768×1024` (tablet portrait), `1024×1366` (tablet landscape), `1280×800` (laptop), `1920×1080` (desktop):

1. Load `/`, screenshot above-the-fold.
2. Assert `document.getElementById('story').getBoundingClientRect().top >= window.innerHeight` (Story is below the fold).
3. Assert hero image is visible only at `≥1024px`.
4. Assert countdown is visible in the hero at `<1024px` and in `#countdown` at `≥1024px`.
5. Reload twice; confirm layout is stable (no CLS between reloads).

Report screenshots + the numeric assertions per viewport before declaring done.
