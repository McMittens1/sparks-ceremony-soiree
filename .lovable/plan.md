
# Responsive Refactor — Site-Wide Consolidation

## Problem (root cause, not symptoms)

The site mixes three layout systems that fight each other:

1. **Inline `style={{ padding: "80px 56px", fontSize: 30, margin: "24px 0 0" }}`** on nearly every section (Story, Photos, Registry, Travel, FAQ, Day, Party, StoryTimeline, WeddingParty). These are fixed pixel values with no responsive scaling.
2. **`!important` overrides in `src/styles.css`** under `@media (max-width: 767px)`, `≤640px`, `≤639px`, `640–1023px` that exist *only* to beat those inline styles back down for smaller screens (`.rs-section`, `.rs-stack`, `.rs-stack-2/3/4`, `.rs-story-*`, `.rs-day-*`, `.rs-montage-grid`, section `h2`).
3. **Ad-hoc breakpoints** — some rules split at 640, some at 767, some at 1023, some at 1024 (Tailwind `lg`). Registry/hotels use one set; Story uses another; hero uses yet another. No shared scale.

The Hero already went through this refactor (svh + clamp + `--header-h`, no `!important`). The rest of the site hasn't. Every future change risks a new inline value that requires a new `!important` override.

## Goal

One responsive source of truth per concern (section padding, section max-width, stack grids, typography scale, spacing rhythm). No `!important` outside true edge cases (motion reduce, mobile-menu display). Inline styles reserved for one-off dynamic values only.

## Approach

### 1. Section shell utility (`.rs-section`)

Move to a single definition in `styles.css` using `clamp()` — no media queries, no `!important`:

```css
@utility rs-section {
  padding-inline: clamp(24px, 5vw, 56px);
  padding-block: clamp(64px, 8svh, 96px);
  max-width: 1500px;
  margin-inline: auto;
}
```

Remove every `style={{ padding: "80px 56px", maxWidth: 1500, margin: "0 auto" }}` from StorySection, PhotosSection, RegistrySection, TravelSection, DaySection, FaqSection, PartySection. Keep only the `border-t border-hairline` class where it exists.

Delete the `@media (max-width: 767px) .rs-section { padding-*: … !important }` block.

### 2. Responsive stack utilities

Replace `.rs-stack`, `.rs-stack-2`, `.rs-stack-3`, `.rs-stack-4` inline `gridTemplateColumns` values with utilities that already carry breakpoints:

```css
@utility rs-stack       { display: grid; gap: clamp(24px, 4vw, 64px); grid-template-columns: 1fr; }
@utility rs-stack-2     { display: grid; gap: clamp(20px, 3vw, 32px); grid-template-columns: 1fr; }
@utility rs-stack-3     { display: grid; gap: clamp(20px, 3vw, 32px); grid-template-columns: 1fr; }
@utility rs-stack-4     { display: grid; gap: clamp(20px, 3vw, 32px); grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .rs-stack-2 { grid-template-columns: 1fr 1fr; }
  .rs-stack-3 { grid-template-columns: repeat(2, 1fr); }
  .rs-stack-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .rs-stack   { grid-template-columns: 5fr 7fr; }   /* Photos-style split */
  .rs-stack-3 { grid-template-columns: repeat(3, 1fr); }
  .rs-stack-4 { grid-template-columns: repeat(4, 1fr); }
}
```

Remove inline `gridTemplateColumns` and `gap` from the JSX and drop the `!important` overrides. Where a section needs a different split (e.g., FAQ 1fr 1fr), give it a variant class rather than an inline value.

### 3. Section header rhythm

Section titles currently use `.rs-section h2 { font-size: clamp(36px, 8vw, 52px) !important }` only at ≤767px. Move a single `clamp(32px, 6vw, 60px)` rule onto the shared `DisplayHeading`/`SectionHeader` sizes so titles scale everywhere without `!important`.

### 4. StoryTimeline

The biggest offender: 20+ `!important` rules re-arrange the row on mobile. Restructure `StoryTimeline.tsx` so mobile is the default (single column, photos stacked) and desktop is the enhancement:

- Base: `flex flex-col` with photos block and text block in source order (text first).
- `lg:` promote to the 3-column `grid-cols-[1fr_88px_1fr]` layout with `order` swaps.
- Move `marginTop: 110` → `mt-16 lg:mt-28`.
- Move `height: 640` on the photo cluster → `lg:h-[640px]` (auto on mobile).
- Big background number: express with `clamp(120px, 34vw, 360px)` and drop the mobile override.

Result: every `.rs-story-*` `!important` line in `styles.css` can be deleted.

### 5. Fixed pixel typography → clamp

Replace inline `fontSize: 11 / 15 / 16 / 19 / 21 / 30` scattered through Photos, FAQ, Story, WeddingParty with the existing `Eyebrow`/`BodyProse`/`DisplayHeading` size variants (extending them if a size is missing). No inline `fontSize` in section components after refactor.

### 6. Viewport units

Standardize on `svh` for anything measured against the viewport (hero already does this; CountdownSection uses fixed `72px 32px`). Add a `--section-pad-y: clamp(64px, 8svh, 96px)` variable so all vertical rhythm is comparable.

### 7. Breakpoint scale

Adopt a single scale used everywhere:

- `sm` 640 — 1→2 columns for card grids
- `md` 768 — header layout change (already used by `--header-h`)
- `lg` 1024 — 2→3/4 columns, hero image appears, StoryTimeline promotes to 3-col

Delete stray `@media (max-width: 639px)` / `(min-width: 640px) and (max-width: 1023px)` blocks; they collapse into the utilities above.

### 8. Keep as-is (explicitly out of scope)

- `HeroSection.tsx` (already refactored last turn).
- Header mobile drawer CSS (`.mobile-menu-panel`, backdrop) — it's already a single source of truth.
- Reveal/motion utilities.
- shadcn tokens in `@theme inline`.
- `prefers-reduced-motion` block (legitimate `!important`).
- RSVP page (frozen per prior instruction).

## Files touched

- `src/styles.css` — rewrite `.rs-section` / `.rs-stack*` as `@utility` with intrinsic breakpoints; delete the `≤767`, `≤640`, `≤639`, `640–1023` override blocks (except mobile-menu display + reduce-motion).
- `src/components/site/sections/{Story,Photos,Registry,Travel,Day,Faq,Party,Countdown}Section.tsx` — remove inline padding/maxWidth/gap/gridTemplateColumns; drop inline fontSize where a typography component covers it.
- `src/components/site/StoryTimeline.tsx` — mobile-first restructure, kill order/height overrides.
- `src/components/site/WeddingParty.tsx` — replace inline `fontSize`/`margin` with typography components + utility spacing.
- `src/components/site/typography.tsx` — add any missing `Eyebrow`/`BodyProse` sizes needed to absorb inline values.

Approximate delta: `styles.css` shrinks ~120 lines; section components lose ~80 lines of inline `style` props.

## Verification

Playwright screenshot pass at `375×812`, `430×932`, `768×1024`, `1024×1366`, `1280×800`, `1920×1080`. For each viewport:

1. Home page scroll to Story, Day, Party, Travel, Photos, Registry, FAQ — no overflow, consistent gutters, titles legible.
2. Hero unchanged (regression check).
3. Mobile drawer opens with solid ivory background, covers full height (regression check).
4. RSVP page renders identically (frozen).
5. Computed style spot-check: no leftover `!important` on `.rs-section`, `.rs-stack*`, `.rs-story-*`.

## Risk

Story timeline restructure is the highest-risk change (touching order/flex/height across breakpoints). Mitigation: build mobile layout first, verify at 375px, then add `lg:` promotion and verify at 1280px before deleting the old CSS overrides.

## Not doing

- No design changes (colors, fonts, copy).
- No component API changes beyond adding typography size variants.
- No changes to routing, data, RSVP, or backend code.
