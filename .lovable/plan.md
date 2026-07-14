## 1. Mobile hero — honest recommendation: leave it unchanged

The current mobile hero is already doing a lot in one viewport: eyebrow, two-line serif name lockup, italic date, venue line, RSVP + See details, and the 4-cell countdown strip pinned near the bottom. It fills `100svh` cleanly with real hierarchy and breathing room.

Ways I considered adding the cutout on mobile, and why each weakens the design:

- **Above the headline** — pushes the name below the fold on smaller phones (375×667), breaks the "name is the hero" hierarchy, and forces the cutout to shrink to ~180px tall where the pencil linework loses fidelity.
- **Behind the text as a faded background** — the pencil lines cross directly through "Geovanni & Addison" and the RSVP button. Even at 15–20% opacity it muddies contrast on ivory and fights the typography instead of supporting it.
- **Below the countdown** — requires a second scroll or breaks the full-viewport hero contract you deliberately built.
- **Small inset next to the eyebrow** — reads as a decorative sticker, not editorial. Cheapens the desktop treatment by association.

The desktop hero works precisely because the image gets its own 520px+ column. Phones don't have a second column to give it. **My recommendation: keep mobile as it is.** The typography-only mobile hero is already elegant and intentional — adding the image would be additive noise, not design improvement.

If you disagree and want to try one anyway, tell me which of the four options above you'd like me to prototype and I'll build it.

## 2. Desktop image bottom — soft arched mask, no palette change

Your instinct is right that the straight horizontal cutoff reads as accidental. The fix I recommend is different from the red-sketch mockup in one important way: **don't introduce lavender as a large section background.** Here's why:

- The site's palette is ivory-dominant with lavender as a small accent (the `&`, "October 10, 2026", "See details" underline, story dots). Turning the bottom third of the hero + the entire Counting Down section lavender would flip that ratio and make lavender the loudest color on the page. It would look great in isolation and wrong in context — every downstream section (Story, Day, Party) would suddenly feel disconnected from a saturated hero.
- The Counting Down section is currently a quiet ivory beat that lets the countdown numerals breathe. A lavender wash there overpowers the numerals.

Instead, do the same job (intentional, artistic ending; conceals only the minimum of the image; blends seamlessly into the next section) with a CSS mask on the image itself:

- Apply `mask-image` to the `<img>` in `HeroSection.tsx` using an SVG or radial gradient shaped as a **soft asymmetric arch** rising from the bottom-right and dipping across the bottom-left.
- The mask fades the image to transparency along that curve — so the pencil linework literally dissolves into the ivory background instead of being chopped by a rectangle. No new color, no new section, no straight edge.
- Because it's a mask (not a crop), we can tune it to cover only ~8–14% of the image height at its deepest point, well below the torsos, keeping arms and clothing intact.
- The Counting Down section stays ivory. The transition works because there is no visible edge at all — the image simply ends the way pencil ends on paper.

If after seeing that you still want an actual colored arch, we layer a second refinement on top: a **very thin lavender hairline curve** (2px stroke, `lavender-deep` at ~30% opacity) tracing just above where the mask fades, echoing the DiamondDivider language elsewhere on the site. That gives the "intentional composed line" your sketch is reaching for without introducing a color block.

### What I'll change

- `src/components/site/sections/HeroSection.tsx` — add an inline SVG mask (or `-webkit-mask-image` + `mask-image` with a radial/linear gradient) to the hero `<img>`. Keep `mixBlendMode: multiply`, `objectFit: contain`, and the `hidden lg:flex` visibility rule.
- No changes to `CountdownSection.tsx`, `styles.css` tokens, or the palette.
- No new image asset needed — the mask is applied in CSS, so we don't need you to re-export the PNG. If after review you want a harder, more sculpted arch that CSS masks can't quite hit, I'll then ask you for a 1600×1200 PNG with a pre-baked alpha curve at the bottom.

### Verification

- Playwright screenshots at 1024 / 1280 / 1568 / 1920 desktop widths — confirm the bottom of the cutout dissolves smoothly into ivory, no visible horizontal edge, torsos untouched, headline column unchanged.
- Screenshots at 768 and 375 to confirm mobile hero is untouched (image still hidden below `lg:`).
- Check the seam between the hero and the Counting Down section is invisible.

## Summary of what I'm proposing

- **Mobile**: no change. The typography-only hero is stronger than any way I can add the cutout.
- **Desktop bottom**: a CSS mask that softly dissolves the cutout into ivory along an asymmetric arch, keeping the palette and the next section exactly as they are today. Optional lavender hairline curve as a follow-up if you want more visible articulation.
