# Our Story photo refresh — all 18 new photos

## What's there now

Six entries in `STORY_ENTRIES` (`src/lib/wedding-data.ts`) name photo keys; `StoryTimeline.tsx` maps keys to CDN asset pointers. There are 21 slots but only 15 distinct images today, so six photos repeat: `fav` (01, 06), `eng06` (01, 04), `eng94` (01, 04), `eng82` (02, 04), `eng13` (03, 06), `eng10` (03, 06). Entry 05 uses the four real proposal photos. Nothing else on the site uses these engagement images (the hero uses a separate cutout), so any of them can be reassigned or retired.

Layout contract: split rows render one large 60% photo plus a row/column of smaller ones (grid of 2 or 3 on mobile); the finale renders a 1/3-up grid.

## New inventory

18 new photos across two batches: the courthouse/garden set (pink + white outfits), the downtown rooftop set, the stairs black-and-white, and the green-door close-ups. Combined with the 15 existing images that's 33 photos for a section that currently holds 21.

## What I'll do

1. Upload all 18 as CDN asset pointers via `lovable-assets` — no binaries land in the repo.
2. Extend `StoryPhotoKey` and `PHOTO_SRC` with the new keys.
3. Widen the clusters slightly so more of the strong images fit without crowding, keeping the existing grid rules:
   - 01 The first date — 5 (1 lead + 4-up)
   - 02 When the boys met — 4 (1 lead + 3-up)
   - 03 Trips, holidays, random Tuesdays — 6 (1 lead + 5)
   - 04 One roof, four of us — 5
   - 05 The proposal — 4, unchanged
   - 06 See you at the barn — 4 (4-up finale grid)
   Total 28 slots, every photo unique. The ~5 weakest/most redundant existing engagement frames get retired from the section rather than padding an entry.
4. Cast photos by content, not by order: intimate close-ups lead 01; playful/candid frames in 02; the widest travel-and-city variety (rooftop, stairs, colonnade) in 03; settled, at-home-feeling frames in 04; three-plus forward-looking full-length frames in the finale.
5. Write real alt text for every photo (only entry 05 has alts today), so the whole section is described for screen readers.
6. Keep the existing style and performance practices exactly: `loading="lazy"`, `object-cover` crop rules, 4:5 / square aspect ratios, md-breakpoint two-column promotion, `photo-zoom`, hairline borders.
7. Verify with `bun run build:dev` and Playwright screenshots at 440 / 768 / 1280.

## Technical detail

- `src/assets/engagement/*.asset.json` — 18 new pointer files.
- `src/lib/wedding-data.ts` — extend `StoryPhotoKey`; rewrite `photos` + `photoAlts` for entries 01–04 and 06.
- `src/components/site/StoryTimeline.tsx` — new imports and `PHOTO_SRC` entries; small tweak to the small-photo grid so a 4- and 5-photo cluster wraps cleanly on mobile (2 cols) and tablet (grid) without changing the desktop row.
- `ONBOARDING.md` / `HANDOFF.md` — bump "Last verified", note the new story photo inventory.
