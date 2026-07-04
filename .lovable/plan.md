
Home already has every section inline, and the header nav already scrolls to them via hash anchors (`#story`, `#details`, `#party`, `#travel`, `#photos`, `#registry`, `#faq`) — not links to separate pages. The standalone route files are pure duplicates that no in-site link points to.

## Delete these duplicate route files

- `src/routes/our-story.tsx`
- `src/routes/details.tsx`
- `src/routes/wedding-party.tsx`
- `src/routes/travel.tsx`
- `src/routes/photos.tsx`
- `src/routes/registry.tsx`
- `src/routes/faq.tsx`

TanStack Router regenerates `routeTree.gen.ts` from the remaining files on next build. Nothing else needs to change.

## Keep

- `/` — the full scroll (all sections)
- `/rsvp` — form flow, doesn't belong inline
- `/auth`, `/_authenticated/admin` — sign-in + admin
- `__root.tsx`, `/api/*`, `/[.mcp]/*`, `/[.well-known]/*` — shell + machine endpoints

## What stays the same

- Header nav — already hash-anchor scrolling, unchanged.
- SectionRail (right-side spine) — already anchors to `#home`, `#story`, etc., unchanged.
- All section content and copy — unchanged.

## What this does NOT touch

Content edits still pending (wedding party names, registry links, hotel copy, RSVP address subtitle, per-chapter story photos, Spanish mirror) — separate follow-ups after you send inputs.

## Optional (my vote: skip)

Redirect old paths like `/registry` → `/#registry` for anyone with an old link. Since the site isn't published yet, there's nothing to preserve. Skip.

Approve and I'll delete the 7 files in one pass.
