## Recommendation

Use **`favorite_pencil_cropped_1.png`** as the hero image. Reasoning:

- **Composition**: Balanced 5:4 crop. Both subjects framed evenly with generous headroom, arms and torsos anchored, natural fade at the bottom. Neither too square (image 2) nor too airy/wide (image 3, where subjects float small and off-center).
- **Scale on the hero column**: The current right-side hero image slot is roughly 3:2 landscape at ~520px+ wide. Image 1's proportions read as a portrait-leaning mid-crop that fits the column beautifully once we let it size to its natural aspect (see layout note below). Image 3 is too wide and would leave subjects tiny; image 2 is too tight and would feel cramped next to the tall headline.
- **Elegance/tone**: The pencil-sketch treatment on ivory is the strongest possible fit for the wedding site's paper-and-ink palette (`ivory #F8F4EC` · `ink #2A2520` · `lavender #8779A3`). It reads as commissioned, timeless, and editorial — exactly the design language of the rest of the site.

## Hero background color

`--background: oklch(0.958 0.014 82)` = **`#F8F4EC`** (`ivory`). The hero section inherits the page background — no per-section override. This is what the image needs to blend into.

## How to make the cutout blend seamlessly (no image editing needed)

The three uploads are pencil art on **pure white (#FFFFFF)**, not on ivory (`#F8F4EC`). Two ways to reconcile the ~4% brightness gap:

1. **CSS `mix-blend-mode: multiply`** on the `<img>`. On line art over a tinted paper background, multiply is the standard trick: white pixels vanish (become the ivory beneath), pencil marks darken naturally, negative space between arms/hair reads as ivory automatically. Zero image processing, zero re-uploads, works perfectly on every viewport. **This is the recommended approach.**
2. **Re-render the PNG with ivory background baked in** via `imagegen--edit_image`. Heavier, produces a new asset, and any future palette tweak requires re-editing. Only worth it if `mix-blend-mode` shows any artifact on a specific device (it shouldn't for grayscale line art).

I'll ship option 1 and fall back to option 2 only if visual QA reveals a problem.

## Plan

### A. Upload the chosen cutout as a Lovable asset
- `lovable-assets create --file /mnt/user-uploads/favorite_pencil_cropped_1.png --filename hero-portrait.png > src/assets/engagement/hero-portrait.png.asset.json`

### B. Swap the hero image (`src/components/site/sections/HeroSection.tsx`)
- Replace the `favorite` import with the new `hero-portrait` asset pointer.
- Change the image container: drop the forced `aspectRatio: "3 / 2"` and `objectFit: cover` (those were tuned to a full photograph). Let the cutout size to its intrinsic ~5:4 ratio with `height: auto`, `maxHeight: 100%`, `objectFit: contain`, so we don't crop faces or hands.
- Add `style={{ mixBlendMode: "multiply" }}` on the `<img>` so white blends into ivory.
- Keep the desktop-only visibility (`hidden lg:flex`) exactly as it is — mobile hero already omits the image and shows the inline countdown. No mobile behavior changes.
- Keep the OG/preload link in `src/routes/index.tsx` pointing at the same new asset URL so the social share preview matches the new hero.

### C. Update the OG image (`src/routes/index.tsx`)
- Replace the `favorite` import + the two `og:image` / `twitter:image` / preload references with the new `hero-portrait` asset. Alt text: "Pencil illustration of Geovanni Moreno and Addison Hillman."

### D. Leave everything else untouched
- No changes to typography, buttons, spacing, layout grid, countdown, or any other section.
- The old `favorite` engagement photo asset stays in the repo (it's still used elsewhere — Photos section — so we don't delete it).

## Verification

Playwright screenshot pass at 1024, 1280, 1568 (current viewport), 1920:
- Hero left column (headline / date / RSVP / countdown) unchanged.
- Right column shows the cutout at natural aspect, centered, with no visible white rectangle — negative space reads as ivory.
- Retake at 375 / 768 to confirm mobile/tablet layouts are unchanged (image hidden below `lg`).
- Confirm no horizontal overflow at any width.

## Technical notes

- `mix-blend-mode: multiply` is universally supported and safe for a grayscale image over a solid light background. It has no effect if the parent has a non-solid backdrop, which is why we only rely on it here in the hero (the ivory `--background` is solid).
- The new PNG will be served over the same CDN pipeline as the other engagement assets — no build config changes needed.
