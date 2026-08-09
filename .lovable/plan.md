# Our Story photo refresh — batch 1 (10 new photos)

## What's there now

The section renders six entries from `STORY_ENTRIES` in `src/lib/wedding-data.ts`. Each entry names photo keys; `StoryTimeline.tsx` maps keys to CDN asset pointers. Today there are 21 photo slots but only 15 distinct images, so several repeat:

- `fav` used 2x (01, 06), `eng06` 2x (01, 04), `eng94` 2x (01, 04), `eng82` 2x (02, 04), `eng13` 2x (03, 06), `eng10` 2x (03, 06).
- Entry 05 (the proposal) uses the four real proposal photos — untouched.

Layout contract per entry: split rows show one large 60% photo plus 2–3 smaller ones; the finale shows a 3-up grid. Nothing else on the site uses these engagement images (the hero uses a separate cutout), so reassigning them is safe.

## What I'll do

1. Upload the 10 attached photos as CDN assets (`lovable-assets`), same pointer pattern as the current images — no binaries added to the repo.
2. Add their keys to `StoryPhotoKey` / `PHOTO_SRC`.
3. Re-cast all 21 slots so every photo appears exactly once, choosing by content fit:
   - **01 The first date** — warm, close, two-of-them shots (the doorway kiss leads).
   - **02 When the boys met** — playful/candid frames.
   - **03 Trips, holidays, random Tuesdays** — the widest variety: rooftop, stairs, city frames.
   - **04 One roof, four of us** — settled, at-home-feeling frames.
   - **05 The proposal** — unchanged, four proposal photos.
   - **06 See you at the barn** — three strong, forward-looking frames (the full-length rooftop portrait leads).
4. Write real alt text for every new photo (currently only entry 05 has alts), so the section is fully described for screen readers.
5. Keep every existing practice: `loading="lazy"`, `object-cover` with the existing crop rules, the 4:5 / square aspect ratios, the md-breakpoint two-column promotion, `photo-zoom` hover, hairline borders.
6. Verify with a build and Playwright screenshots at 440 / 768 / 1280.

## Capacity note (the 8 still to come)

21 slots vs. 25 photos after this batch means roughly 4 of the current engagement placeholders get retired from the section in this pass — I'll drop the weakest/most redundant ones rather than crowd entries. When the remaining 8 arrive I'll widen the clusters (entries 01/03 to five photos, finale 06 to four) so the strongest images all land, and rebalance again with no repeats.

## Technical detail

- `src/assets/engagement/*.asset.json` — 10 new pointer files.
- `src/lib/wedding-data.ts` — extend `StoryPhotoKey`, rewrite `photos` + `photoAlts` for entries 01–04 and 06.
- `src/components/site/StoryTimeline.tsx` — imports and `PHOTO_SRC` entries only; no layout changes.
- `ONBOARDING.md` / `HANDOFF.md` — bump "Last verified", note the story photo inventory change.
