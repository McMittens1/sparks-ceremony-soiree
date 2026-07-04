## Polish the existing wedding site — status

Goal: make the current site look great and work smoothly on every screen, then fold in the new photos and real content you provide.

### ✅ Done

1. **Responsive / mobile audit and fixes**
   - Checked every public page on mobile (390px), tablet (768px), and desktop (1280px).
   - Fixed horizontal overflow on the home page by clipping the travel section's reveal animation.
   - Verified no horizontal scroll at any viewport width.

2. **Visual polish pass**
   - Unified page titles: all routes now use "Geovanni & Addison" instead of "Geo & Partner".
   - Made placeholder content honest: wedding party shows "Names to be announced" and registry placeholders show "Details coming soon" instead of broken links.
   - Replaced generic `picsum.photos` placeholders in `/our-story` with real engagement photos.
   - Updated server functions to the current `.validator()` API (cleaner build output).

3. **Photo gallery improvement**
   - Added a new `Lightbox` component with keyboard navigation (Esc, ←, →) and a caption bar.
   - Wired the lightbox into `/photos` and the home page gallery.
   - Changed `/photos` layout to a CSS masonry-style `columns` grid.
   - Improved the empty state with a framed placeholder and a nudge to share photos.

4. **Final check**
   - Full production build passes.
   - MCP manifest extracts cleanly with 10 tools.
   - All pages pass the responsive overflow audit.

### ⏳ Waiting on you

- **More photos**: upload them directly in this chat — up to 10 images per message, up to 20 MB each works best. For a big batch, a Google Drive / Dropbox link is fine too. I'll place them in the hero, `/our-story`, `/photos`, `/rsvp`, or `/wedding-party` and migrate them to the Lovable CDN for fast loading.
- **Real wedding party names and roles** so I can replace the placeholder cards.
- **Real registry links** (Honeymoon Fund, Local charity) so I can make those cards clickable.
- **Venue address / exact map pin** for Sparks' Barn if you want the map to point directly at it instead of Louisville, NE.

### Out of scope

- No new AI chatbot or external MCP connection work yet.
- No schema changes or new backend features.
- No big redesign unless you ask for one later.
