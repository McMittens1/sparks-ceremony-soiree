## Goal

Replace the four placeholder engagement photos in Our Story entry 05 ("The proposal") with real proposal photos from the Joyo Theater shoot.

## Photo selection

Entry 05 renders as a split row: one large main photo (60% width, full row height on md+) plus a row/column of smaller square-ish photos. Picking for that shape:

- **Main (large):** `IMG_7697.jpg` — Geo on one knee under the marquee, full vertical composition. It's the narrative moment and the only shot that reads clearly at large size.
- **Secondary 1:** `IMG_7613-2.jpg` — the color marquee "WILL YOU MARRY ME ADDI" with no people; sets the place, crops well square.
- **Secondary 2:** `IMG_7629.jpg` — the ring held up against the blurred marquee; strong detail shot, landscape so it crops square cleanly.
- **Secondary 3:** `IMG_7757.jpg` — the two of them together under the marquee after she said yes; closes the beat.

Not used: `IMG_7613.jpg` (black-and-white duplicate of the color marquee — the site has no other B&W imagery, so it would read as a mistake), `IMG_7631.jpg` (near-duplicate of the ring shot), `IMG_7674.jpg` (pre-proposal handhold, weaker), `IMG_7742.jpg` (close-up portrait — lovely, but redundant next to IMG_7757 and better saved for another section).

## Technical changes

1. Upload the four selected files as Lovable CDN assets via `lovable-assets create` from `/mnt/user-uploads/`, writing pointers to `src/assets/proposal/*.asset.json`. No binaries land in the repo.
2. `src/lib/wedding-data.ts` — add four proposal keys to the `StoryPhotoKey` union (`propKneel`, `propMarquee`, `propRing`, `propCouple`) and set entry 05's `photos` to `["propKneel", "propMarquee", "propRing", "propCouple"]`. No copy changes.
3. `src/components/site/StoryTimeline.tsx` — import the four new pointers and add them to `PHOTO_SRC`. Keep the existing placeholder keys for entries 01–04 and 06 untouched.
4. Add meaningful `alt` text for these four (currently all story photos use `alt=""`), since they now carry real content. Keep `loading="lazy"`.
5. Docs: update `.lovable/plan.md` (entry 05 is no longer placeholder) and the `mem://content/story-photos` memory; bump "Last verified" in `ONBOARDING.md` / `HANDOFF.md` per the docs-are-code rule.

## Verification

`bun run build:dev` clean, then Playwright screenshots of `#story` entry 05 at 440px and 1280px to confirm the main photo's crop keeps Geo and Addi in frame and the three secondaries don't crop the marquee text badly. If the square crop cuts the marquee wording, I'll adjust `object-position` on those tiles only.
