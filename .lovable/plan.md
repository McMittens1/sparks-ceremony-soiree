## Status — Our Story rebuild: DONE (2026-07-27)

The nine-entry timeline was replaced with the finalized six-entry copy and the layout was rebuilt around it.

- `src/lib/wedding-data.ts` — one `StoryEntry` type `{ n, date, place, title, body, photos, layout }`; six entries, copy verbatim. `DatedStoryEntry` / `MontageStoryEntry` and the `photoStart` / `photoCount` index math are deleted.
- `src/components/site/StoryTimeline.tsx` — entries 01–05 alternate text/photo cluster around the hairline gutter (promotes at `md`); entry 06 is a centered `finale` with a three-across photo row. Ghost numerals come from each entry's own `n`. `Reveal`, `photo-zoom`, hairline borders and `loading="lazy"` preserved.
- `src/components/site/sections/StorySection.tsx` — subhead is "The short version of how all of this happened."
- Verified: `bun run build:dev` clean; Playwright at 440 / 768 / 1024 / 1440 shows six entries, correct alternation, no horizontal overflow. `#story` anchor and section numeral `II` unchanged.

## Open items

1. **Swap placeholder story photos for real per-entry images.** Every image in the Story section is a placeholder engagement shot, so keys repeat across entries. Replacement is a one-key edit in the entry's `photos` array plus an asset import mapped in `PHOTO_SRC`.
2. **Apply `<picture>`/WebP srcset to Story photos** once the real images land (hero portrait and venue aerial already have WebP variants).
3. **Guest re-import** — the `guests` table is empty; households must be re-imported before invitations go out.
4. **Wedding-party card copy** — headlines/attributes/abilities are still placeholder.
5. Re-run visual QA at 440px and 1280px after any Story image change.

## Notes

- Story content stays centralized in `wedding-data.ts` (shared with the MCP tools); only asset imports live in the component.
- No database, server function, or backend change was involved in this rebuild.
