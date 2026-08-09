# Our Story photos + a separate portrait gallery

Two different things, both included:

1. **Our Story keeps photos in every entry** — placeholder-but-finished-looking now, easy to swap later for story-relevant images.
2. **A new standalone gallery section** built from the additional photos.

Nothing currently in Section 05 (the proposal) changes. No existing story photo is removed.

## 1. Our Story — stays visually complete

- All six entries keep photo clusters. Section 05's four proposal photos and their alts are untouched, full stop.
- Entries 01, 02, 03, 04, 06 keep their current cluster sizes (4 / 3 / 4 / 3 / 3). The only change: swap a handful of the *repeated* keys (`eng06`, `eng94`, `eng82`, `eng13`, `eng10`, `fav` each appear twice today) for distinct images from the new set, so no photo shows up twice while scrolling.
- Layout, grid logic, and `StoryTimeline.tsx` cluster sizes stay as-is — this is a key-level swap in `STORY_ENTRIES`, not a redesign.
- These remain explicitly temporary. Replacing one later = changing one key in one entry; the gallery is unaffected.

## 2. The gallery — naming recommendation

**Recommended title: "Portraits"**, with the eyebrow reading `VI · Portraits` and a subhead like *"Our engagement portraits, taken in Lincoln in the spring."*

Why over the alternatives:
- "Engagement" alone reads as the proposal day — exactly the confusion you want to avoid.
- "Photos" collides with the existing guest-upload Photos section.
- "Gallery" / "Our Gallery" is generic and doesn't say who or what.
- "Portraits" matches the site's stationery, roman-numeral, editorial tone, is unambiguous next to Section 05, and the subhead does the explaining without the header having to.

If you'd rather be maximally literal, **"Engagement Portraits"** is the runner-up and reads clearly too — the word "portraits" is what removes the proposal-day implication either way.

## 3. What the gallery section is

Placed immediately after Our Story, before The Day. Roman numerals shift automatically; the guest-upload Photos section stays where it is with its own identity.

- Editorial grid in the existing aesthetic — hairline borders, tan/lavender accents, `rs-section` spacing, `Reveal` on scroll. Orientation-aware so nothing is badly cropped.
- Click to open a lightbox: arrow-key and Esc support, focus trapped, `aria-modal`, ≥44px controls.
- Lazy-loaded below the first row, explicit dimensions to avoid layout shift, descriptive alt text per photo.
- Gated behind a `show_portraits` feature flag (same pattern as `show_wedding_party`) so you can publish or hide it from the admin Features tab.
- Uses the additional uploaded photos — not the ones assigned to Our Story, so there's no duplication between the two sections.

## Technical details

- Upload all new files via `lovable-assets create` into `src/assets/engagement/`, one `.asset.json` pointer each.
- `src/lib/wedding-data.ts`: add the new `StoryPhotoKey` values; edit only the duplicate keys in entries 01–04 and 06. Entry 05 untouched.
- `src/components/site/StoryTimeline.tsx`: extend the `PHOTO_SRC` map with the new imports. No layout changes.
- New `src/lib/portrait-gallery.ts` (`{ key, alt, orientation }` list), `src/components/site/sections/PortraitsSection.tsx`, and a small `Lightbox.tsx`.
- Add `"portraits"` to `SECTION_ORDER` in `src/hooks/use-section-order.ts` (extend `ROMAN` to 9), register the flag, add the nav entry in `Header.tsx`, render it in `src/routes/index.tsx`.
- Migration inserting the `show_portraits` flag row (default off) with the existing flags.
- `src/i18n/dictionaries.ts`: EN/ES strings for nav label, eyebrow, title, subhead, lightbox controls.
- Verify with `bun run build:dev` plus Playwright screenshots at 440 and 1280; bump "Last verified" in `ONBOARDING.md` and `HANDOFF.md` and document the new flag and the temporary-story-photo status.
