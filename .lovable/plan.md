# Photo storage review + a practical Photo Manager

## What's true today (verified this session)

Every photo on the public site is **hardcoded in the frontend**. There is no admin control over any of them.

- **All 37 site photos** live in one place: `src/assets/**` as `.asset.json` pointer files served from the Lovable CDN (`/__l5e/assets-v1/...`). Subfolders: `engagement/`, `proposal/`, `venue/`, plus a few loose files.
- **Our Story photos**: `src/lib/wedding-data.ts` names photo *keys* per entry (`photos: ["fav","eng74",...]`), and `StoryTimeline.tsx` maps those keys to imported asset URLs. Two files must be edited in sync to change a photo.
- **Portraits gallery**: `src/lib/portrait-gallery.ts` holds its own separate import list plus alt text, dimensions and order in one array. Different shape from Our Story, same underlying storage.
- **Hero / venue**: `HeroSection.tsx` and `DaySection.tsx` mix CDN assets with pre-generated WebP variants in `public/images/`.
- **The only DB-backed photos** are guest uploads: `guest_photos` table + private `guest-photos` storage bucket, already managed from the admin Photos tab (approve/reject/delete).

So: same storage system, three different hand-written registries, zero admin control.

## Recommendation

Add a **Photo Manager tab** to the admin portal backed by the existing storage + a small database table, using a **DB-overrides-code** model. Do not migrate the existing images out of the codebase.

Why this shape:

- The current CDN assets already work, are fast, and are version-controlled — ripping them out buys nothing and risks a live site.
- A single `site_photos` table gives you upload / replace / remove / reorder / caption without touching code, and the code-defined lists stay as the fallback if the table is empty.
- It reuses infrastructure that already exists here (storage bucket, admin auth, `requireSupabaseAuth` + `ensureAdmin`, the existing photo-review UI patterns), so it is maintenance you already understand.

What it will **not** do (deliberately, to avoid overengineering): no folder tree, no tagging system, no image editor, no bulk re-processing pipeline, no replacement of the hero or venue images (those are performance-tuned WebP sets and are better left in code).

## What gets built

**Storage**
- New public `site-photos` bucket. Admin-only writes, public reads.

**Database** — one table, `site_photos`:
- `id`, `placement` (`story` | `portraits`), `story_entry` (null for gallery), `storage_path`, `alt_text`, `caption`, `sort_order`, `width`, `height`, `created_at`.
- GRANTs + RLS: public `SELECT`, admin-only write via `has_role(auth.uid(),'admin')`.

**Server functions** (`src/lib/site-photos.functions.ts`)
- Public: `listSitePhotos()` — returns rows grouped by placement.
- Admin (auth + `ensureAdmin`): upload (signed upload to bucket + row insert), replace, delete, update alt/caption, reorder.

**Public site**
- `StoryTimeline.tsx` and `PortraitsSection.tsx` read from `listSitePhotos()`; when a placement has no rows, they fall back to today's hardcoded lists exactly as they render now. Nothing changes visually until you upload something.

**Admin — new "Photos" sub-tab: "Site Photos"**
- Two panels: *Our Story* (grouped by the six entries) and *Portraits*.
- Drag-to-reorder, upload, replace-in-place, delete with confirm, inline alt text + caption fields.
- The existing guest-upload moderation panel stays as-is; this is a sibling, not a replacement.

**Docs**
- `ONBOARDING.md` + `HANDOFF.md` updated in the same turn with the new table, bucket, functions, and the DB-overrides-code rule.

## Scope note

This is a real feature, not a tweak — roughly a full session of work: migration, bucket, server functions, two public component refactors, one admin panel, plus verification screenshots at 440/1280. If you'd rather have something smaller right now, the cheap alternative is a **replace-only** version: keep the existing slots and order fixed in code, and let the admin portal swap the image behind any single slot. That's about a third of the work and covers the most likely real need (dropping better photos into existing slots) but gives up reordering and adding/removing photos.
