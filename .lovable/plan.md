## Goal

Replace the nine-entry Our Story timeline with the finalized six-entry copy, and reshape the layout so it reads as purpose-built for six moments — with a denser photo cluster per entry, since the current engagement shots are placeholders that will be swapped for unique per-entry photos later.

## What changes

### 1. Content (`src/lib/wedding-data.ts`)

- Delete all nine current `STORY_ENTRIES` and both entry variants (`DatedStoryEntry` / `MontageStoryEntry`) plus the `photoStart` / `photoCount` index math.
- Replace with a single `StoryEntry` type: `{ n, date, place, title, body, photos, layout }`.
  - `photos` is a list of named photo keys (e.g. `"eng74"`) — one explicit slot per image, so swapping in the real photo for a slot is a one-line edit. No modulo indexing into a shared pool.
  - `layout` is `"split"` (alternating text/photo cluster) or `"finale"` (centered closing panel).
- Six entries, copy verbatim as supplied (including "Fall 2024" for entry 04 and "May 16, 2025" for entry 05). Curly quotes preserved.
- Section subhead becomes "The short version of how all of this happened." (in `StorySection.tsx`).

### 2. Photo distribution — 3–4 per entry

Placeholder frames will repeat across entries for now; each slot is independent and named, so the repeats disappear the moment real photos land.

| Entry | Photos | Cluster shape |
|---|---|---|
| 01 First date | 4 | 1 tall main + 3 stacked |
| 02 The boys met | 3 | 1 tall main + 2 stacked |
| 03 Years in between | 4 | 1 tall main + 3 stacked (widest — matches "the photos beside this paragraph") |
| 04 Moved in together | 3 | 1 tall main + 2 stacked |
| 05 The proposal | 4 | 1 tall main + 3 stacked |
| 06 See you at the barn | 3 | centered wide row |

The existing main-plus-stack cluster already handles a variable side column; it gets a small change so 3 side photos stay legible rather than squeezing into slivers (side column caps at 3, tighter aspect on mobile where the side row scrolls into a 2-up + 1 arrangement instead of a 3-across strip).

### 3. Layout (`src/components/site/StoryTimeline.tsx`)

Rebuild around one row component rather than two divergent ones:

```text
01  [ text ]   |  [ photos ]       04  [ text ]   |  [ photos ]
02  [ photos ] |  [ text ]         05  [ photos ] |  [ text ]
03  [ text ]   |  [ photos ]

          06  ——  centered title + copy, 3-photo wide row  ——
```

- Entries 01–05 use the existing alternating two-column grid with the hairline gutter + diamond (promotes at `md`; below that, single column with text above photos).
- Entry 06 is a centered finale: eyebrow date/place, title, copy, then a three-across photo row — a deliberate closing beat instead of a sixth identical alternating row.
- The old full-width montage grid variant is deleted.
- Ghost numerals come from each entry's own `n` (01–06), not derived counting.
- `Reveal`, `photo-zoom`, hairline borders, `loading="lazy"`, and the `StoryGutter` line/diamond reveal are all preserved.

### 4. Cleanup and verification

- Remove CSS in `src/styles.css` used only by the deleted montage grid (keep `.story-line` / `.diamond-in`).
- Nav anchor `#story` and section numeral `II` unchanged; re-checked after the rebuild.
- Run `bun run build:dev`, then Playwright screenshots at 440 / 768 / 1024 / 1440 to confirm rhythm, no overflow, and correct alternation.

### 5. Documentation (same turn)

- `ONBOARDING.md` — story timeline description + "Last verified" bump, and a note that story photos are named placeholder slots awaiting real per-entry images.
- `HANDOFF.md` — six-entry restructure, retired montage variant, placeholder-slot convention.
- `.lovable/plan.md` — replace the open "Story photo decision" item with "swap placeholder story photos for real per-entry images", and unblock the remaining WebP/srcset work.

## Notes

- Content stays centralized in `wedding-data.ts` (still shared with the MCP tools); only asset imports live in the component.
- No database, server function, or backend change is involved.
