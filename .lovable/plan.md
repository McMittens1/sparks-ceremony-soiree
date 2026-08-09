# Engagement Gallery (recommended) instead of redistributing photos

## Recommendation

Go with **Option 2 — a dedicated Engagement Gallery section**, and leave every existing Our Story photo (including all of Section 05) exactly as it is.

Why:
- **Least work now, most flexibility later.** The gallery is additive: one new section, zero edits to `STORY_ENTRIES`. Later, when you want a story photo swapped for something narratively relevant, you change one key in one entry — the gallery keeps standing on its own.
- **Better UI/UX.** Our Story photo clusters are supporting evidence for the text. Stuffing 18 more images into six entries would force 5–6 photo grids, break the current visual rhythm, and make each entry a scroll marathon on mobile. A gallery is the right container for "lots of beautiful photos with no caption duty."
- **No repeat problem.** Redistribution forces awkward reuse/retirement decisions across 33 images. A gallery consumes the new set cleanly.
- **It fills a real gap.** The current Photos section is the guest-upload gallery and stays empty until after the wedding. An engagement gallery gives the site real photography today.

## What gets built

A new section, **"Engagement"**, placed immediately after Our Story (so it reads as the visual companion to the story) and before The Day.

- Roman numerals shift automatically; the guest Photos section stays where it is and keeps its own identity.
- Nav gets an "Engagement" link (EN + ES).
- Layout: an editorial masonry-ish grid matching the existing stationery aesthetic — hairline borders, tan/lavender accents, `rs-section` spacing, `Reveal` on scroll. Portrait/landscape aware so nothing is badly cropped.
- Click a photo to open a simple lightbox (keyboard: arrows + Esc, focus trapped, `aria-modal`). Tap targets ≥44px.
- Images lazy-loaded below the first row, explicit width/height to avoid layout shift, descriptive alt text per photo.
- Optional but included: gate the section behind a `show_engagement_gallery` feature flag, same pattern as `show_wedding_party`, so you can publish it when you're ready and hide it without a code change.

## Photos used

The 18 newly uploaded engagement images only. Nothing currently used in Our Story is moved, removed, or duplicated into the gallery — including all four Section 05 proposal photos, which are untouched.

## Technical details

- Upload the 18 files via `lovable-assets create` into `src/assets/engagement/`, one `.asset.json` pointer each.
- New `src/lib/engagement-gallery.ts`: ordered list of `{ key, alt, orientation }`; new `src/components/site/sections/EngagementSection.tsx` + a small `Lightbox.tsx`.
- Add `"engagement"` to `SECTION_ORDER` in `src/hooks/use-section-order.ts` (extend the `ROMAN` array to 9), add the flag to `use-feature-flags`, add the nav entry in `Header.tsx`, and render it in `src/routes/index.tsx`.
- Migration to insert the `show_engagement_gallery` flag row (default off) alongside the existing flags.
- `src/i18n/dictionaries.ts`: EN/ES labels for the nav item, section eyebrow, title, subhead, and lightbox controls.
- No changes to `src/lib/wedding-data.ts` or `StoryTimeline.tsx`.
- Verify with `bun run build:dev` plus Playwright screenshots at 440 and 1280; bump "Last verified" in `ONBOARDING.md` and `HANDOFF.md` and document the new flag.
