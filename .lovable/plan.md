## Status — Our Story entry 05 real photos: DONE (2026-07-28)

Entry 05 ("The proposal") now uses four real Joyo Theater proposal photos instead of placeholder engagement shots.

- Assets: `src/assets/proposal/proposal-{kneel,marquee,ring,couple}.jpg.asset.json` (Lovable CDN pointers; no binaries in repo).
- `src/lib/wedding-data.ts` — `StoryPhotoKey` gains `propKneel` / `propMarquee` / `propRing` / `propCouple`; `StoryEntry` gains optional `photoAlts` (index-matched to `photos`). Entry 05 copy unchanged.
- `src/components/site/StoryTimeline.tsx` — `PHOTO_SRC` maps the new keys; photos flow through a `Photo = { src, alt }` shape so real alt text renders in both `PhotoCluster` and `FinaleRow`. `loading="lazy"` preserved.
- Selection: kneel shot as the large main; marquee, ring detail, and post-yes couple shot as the three secondaries. Not used: the B&W marquee duplicate, the second ring frame, the pre-proposal handhold, and the close-up portrait.
- Verified: `bun run build:dev` clean; Playwright at 440 / 1280 shows correct crops, marquee text legible, no overflow.

## Open items

1. **Swap remaining placeholder story photos.** Entries 01–04 and 06 still use placeholder engagement shots, so those keys repeat. Replacement is a one-key edit in the entry's `photos` array (plus `photoAlts`) and an asset import mapped in `PHOTO_SRC`.
2. **Apply `<picture>`/WebP srcset to Story photos** once the remaining real images land (hero portrait and venue aerial already have WebP variants).
3. **Guest re-import** — the `guests` table is empty; households must be re-imported before invitations go out.
4. **Wedding-party card copy** — headlines/attributes/abilities are still placeholder.
5. Re-run visual QA at 440px and 1280px after any Story image change.

## Notes

- Story content stays centralized in `wedding-data.ts` (shared with the MCP tools); only asset imports live in the component.
- No database, server function, or backend change was involved.
