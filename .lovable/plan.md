# Refactor plan — tokens + component extraction

Goal: same look and behavior, cleaner structure. Every step is mechanical and independently verifiable.

## Why now

The homepage renders from a single 1042-line `src/routes/index.tsx`. The same palette (`#2A2520`, `#4C4066`, `#E1D6C3`, `#8779A3`, `#A39680`, `#F8F4EC`, etc.) is retyped as raw hex strings in `index.tsx`, `StoryTimeline.tsx`, `Header.tsx`, `Footer.tsx`, `rsvp.tsx` — even though `src/styles.css` already declares them as CSS variables and Tailwind v4 color tokens. Two sources of truth = drift risk. Story content also lives inside its rendering component instead of `wedding-data.ts` where the rest of the site content lives.

## Scope (in order)

### 1. One source of truth for the palette

- Confirm `@theme inline` in `src/styles.css` exposes: `ink`, `ivory`, `hairline`, `lavender`, `lavender-deep`, `tan`, `tan-deep`, `gold`, `body`, `soft`. Add any missing (e.g. `ivory/75` variants are just Tailwind opacity modifiers, no new token needed).
- Delete the local `const HAIRLINE/INK/IVORY/LAV/LAV_DEEP/TAN/TAN_DEEP/GOLD/BODY/SOFT` block in `src/routes/index.tsx`.
- Sweep the codebase and replace every hardcoded hex from that palette with a Tailwind class (`text-ink`, `border-hairline`, `bg-ivory`, `text-lavender-deep`, etc.) or `var(--color-…)` inside a remaining inline `style` where a class doesn't apply (e.g. dynamic `boxShadow`).
- Files touched: `index.tsx`, `StoryTimeline.tsx`, `Header.tsx`, `Footer.tsx`, `rsvp.tsx`, plus any other `src/components/site/*` that grep flags.
- Ad-hoc one-offs (`#EFE9DD`, `#C9BB9F`, `#B7A6D4`, `rgba(248,244,236,…)`) stay as-is unless they're used more than twice — then promote to a token.

### 2. Typography primitives

Create small, dumb components in `src/components/site/typography.tsx`:

- `<Eyebrow color?>` — the `uppercase font-sans text-[11px] tracking-[0.3em]` label pattern (used 15+ times).
- `<DisplayHeading size="md|lg|xl">` — `font-serif` heading with clamp() sizes (used 6+ times).
- `<BodyProse>` — `font-sans text-[17px] leading-[1.8] text-body max-w-[560px]` (used in every story row and most sections).

Replace inline-style copies of those patterns across `index.tsx` and `StoryTimeline.tsx`. Do not invent new visual variants — mirror what exists exactly.

### 3. Extract homepage sections

Split `src/routes/index.tsx` into `src/components/site/sections/`:

```text
sections/
  HeroSection.tsx
  CountdownSection.tsx
  StorySection.tsx        // just the wrapper; StoryTimeline stays where it is
  DaySection.tsx
  PartySection.tsx
  TravelSection.tsx
  PhotosSection.tsx
  RegistrySection.tsx
  FaqSection.tsx
```

`index.tsx` becomes a thin composition file — imports, `head()`, and `<HeroSection/> <CountdownSection/> …`. Move the shared `SectionHeader` helper into `src/components/site/SectionHeader.tsx`. No prop shuffling — each section reads from `SITE`/`wedding-data` directly, same as today.

### 4. Move story content into `wedding-data.ts`

- Move `ENTRIES_RAW` and the `StoryEntry`/`Dated`/`Montage` types from `StoryTimeline.tsx` into `src/lib/wedding-data.ts` (which is already the shared source for registry, party, hotels, FAQ, and MCP tools).
- `StoryTimeline.tsx` keeps only layout/animation and imports `STORY_ENTRIES`.
- Also move the small inline arrays in `index.tsx`: the three date cards (`index.tsx:313-317`) and the day-of schedule (`index.tsx:366-373`) — same pattern.

### 5. Dead-code sweep

Grep each of these for imports; delete if unused: `PhotoUploadModal.tsx` (Photos section hand-rolls its own inline form), `SectionDivider.tsx` vs `DiamondDivider.tsx` (only one is likely live), `SplitText.tsx`, `ScrollProgress.tsx`, `Parallax.tsx`, `Marquee.tsx`, `Magnetic.tsx`, `Lightbox.tsx`, `Cursor.tsx`, `SectionRail.tsx`. Also remove the "Legacy no-ops still supported" block in `src/styles.css:311-315` if the grep confirms it's dead.

### 6. Explicitly out of scope

- Rewriting the `.rs-*` responsive utility layer in `src/styles.css` or removing `!important` overrides. Those exist because JSX uses inline `style={}` for grid layout; unwinding them is a bigger, riskier pass and belongs to a follow-up ("Heavy — align with Tailwind v4 idioms").
- Any visual change. If a diff produces a visible difference, it's a bug in the refactor, not an intended change.
- Route-level changes, data-loading changes, RSVP form logic, MCP tools.

## Verification

After each numbered step, run Playwright at 390 / 820 / 1440 against the homepage and RSVP page and diff against pre-refactor screenshots. Any pixel drift = revert and investigate. Typecheck must stay green after each step.

## Deliverables

- ~10 new files under `src/components/site/sections/` + 1 `SectionHeader.tsx` + 1 `typography.tsx`.
- `index.tsx` shrinks from 1042 lines to roughly 60–80 lines.
- `StoryTimeline.tsx` loses ~60 lines of inline style / hex constants and its content array.
- `wedding-data.ts` gains `STORY_ENTRIES`, `DATE_CARDS`, `DAY_SCHEDULE`.
- Zero hardcoded palette hex strings in `src/routes/*` and `src/components/site/*` outside `styles.css`.

## Not doing (called out from the survey, deferred by choice)

- Removing `.rs-*` classes / `!important` from `styles.css`.
- Reworking `Header.tsx` hamburger into a subcomponent (only 3 lines, not worth it).
- Any change to `src/integrations/supabase/*`, `src/lib/mcp/*`, `src/lib/*.functions.ts`.
