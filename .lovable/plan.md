## Polish the existing wedding site

Goal: make the current site look great and work smoothly on every screen, then fold in the new photos and real content you provide.

### 1. Responsive / mobile audit and fixes
- Review every public page (`/`, `/rsvp`, `/details`, `/travel`, `/faq`, `/wedding-party`, `/registry`, `/photos`, `/our-story`) on mobile, tablet, and desktop.
- Fix any layout breaks, clipped text, oversized hero images, or buttons that are hard to tap.
- Check that navigation, the header CTA, and footer behave correctly on small screens.
- Verify no horizontal scroll at any viewport width.

### 2. Visual polish pass
- Normalize spacing, typography scale, and section rhythm across pages.
- Ensure the color palette and design tokens feel consistent (no hardcoded colors, only semantic tokens).
- Improve hover/focus states, transitions, and micro-interactions so the site feels refined.
- Tighten the RSVP section and hero so the two-step Knot flow is obvious and inviting.

### 3. Photo gallery improvement
- Better layout for `/photos` (masonry or clean grid) with lightbox on click.
- Add lazy loading and a graceful empty state before approved guest photos exist.
- Prepare the gallery to receive your new engagement/wedding photos.

### 4. Integrate new photos
- After you upload the new images, place them where they fit best: hero, `/our-story`, `/photos`, `/rsvp`, or `/wedding-party` placeholders.
- Optimize image sizing and `srcset` for performance across devices.
- Add meaningful alt text for accessibility and SEO.

### 5. Content and placeholders
- Replace placeholder text on `/wedding-party` and `/registry` with real names and links as you provide them.
- Keep the MCP tools in sync with the same real data so the site and MCP match.
- Refresh `/our-story` and `/faq` copy if you want new wording.

### 6. Final check
- Run a full build and click through every page in the preview to confirm no errors.
- Verify the MCP manifest still extracts cleanly after any content/tool changes.
- Check that the header, footer, and all CTAs remain usable on small screens.

### Out of scope
- No new AI chatbot or external MCP connection work.
- No schema changes or new backend features.
- No big redesign unless you specifically ask for one later.

Once you approve, I'll start with the responsive audit and visual polish, then pause for your photos and real content.