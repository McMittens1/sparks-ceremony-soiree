# Moreno Wedding 2026 — Onboarding Package

A single source of truth for continuing this project with any AI assistant (Claude Code, Cursor, etc.). Read this file in full before making changes. A companion document, `HANDOFF.md`, captures narrative context, judgment calls, and lessons learned from the most recent development session — read that too if it exists.

> **Git policy — read this first:** All work on this project happens directly on the `main` branch. No feature branches, no dev branch, no pull requests, ever — commit and push straight to `main`. This isn't a default you should second-guess; it's a deliberate choice tied to how this repo syncs bidirectionally with Lovable (see §8). If you're about to run `git checkout -b`, stop.

---

## 1. Project overview

**What this is:** A wedding website for Geovanni Moreno and Addison Hillman, built as a TanStack Start full-stack React app.

**Live URLs:**
- Custom domain: https://morenowedding2026.com (canonical form used everywhere in code — no `www`)
- Published Lovable URL: https://sparks-ceremony-soiree.lovable.app (Lovable's own hosting subdomain; not the domain guests see)
- Preview URL: https://id-preview--a290ad4a-bc98-421e-bbac-091b5ceb23e6.lovable.app
- Lovable project ID: `a290ad4a-bc98-421e-bbac-091b5ceb23e6` (workspace `8lk3HziGBvuDvQuiDZjW`) — needed for any Lovable MCP tool call (`query_database`, `get_project`, etc.)

**Event details:**
- Date: Saturday, October 10, 2026
- Time: 5:00 PM ceremony; doors open 4:30 PM; send-off 11:30 PM
- Venue: Sparks' Barn, 13817 108th St, Louisville, NE 68037
- Dress code: Cocktail attire in warm neutrals, lavender, or plum; avoid stilettos (grass lawn + uneven barn floor)

**Tech stack:**
- Framework: TanStack Start v1 (full-stack React, file-based routing, server functions)
- Build tool: Vite 8
- React: 19
- Styling: Tailwind CSS v4 via `src/styles.css` with custom semantic tokens
- Backend / auth / storage: Lovable Cloud (Supabase under the hood — never say "Supabase" to the user)
- Language: TypeScript (strict mode enabled)
- Package manager: bun

**Key architectural decisions:**
- The public site is a single long scrolling page (`src/routes/index.tsx`) composed of section components under `src/components/site/sections/`.
- All copy, schedule, registry, wedding party, hotels, and FAQ data live in `src/lib/wedding-data.ts` so the site and MCP tools stay in sync.
- A centralized **feature-flag system** (`feature_flags` DB table + `src/lib/feature-flags.functions.ts` + `src/hooks/use-feature-flags.ts`) gates guest-facing features that need to be turned on/off without a deploy. Currently gates `rsvp_open` and `guest_photo_uploads`. The admin Features panel uses an explicit **draft → confirm → save** workflow, not instant-toggle — see §5.
- RSVP lookup is by name or short invitation slug. No guest accounts or passwords.
- RSVP edit links are HMAC-signed tokens (`RSVP_EDIT_SECRET`) with a 90-day expiry; no login required. **By design, editing an existing RSVP via its signed token works even when `rsvp_open` is off** — the flag gates new submissions, not self-service edits to an RSVP a guest already made. See `HANDOFF.md` for the reasoning.
- Admin access is behind an intentionally obscure URL: `/portal-ga-2026`. There is a single admin account; the first user to sign in via that page is auto-promoted to admin. The `/_authenticated` route guard checks the `admin` role itself (via a shared `hasAdminRole()` helper), not just that a user is signed in.
- The Wedding Party section (`src/components/site/WeddingParty.tsx`) uses a **collectible-card theme**: Groomsmen + Best Man are Pokémon/sports-card-style trading cards (`GroomsmanCard.tsx`) with a flip interaction; Bridesmaids + Maid of Honor are full-bleed editorial magazine covers (`MagazineCover.tsx`, masthead "SPARKS.") with no flip interaction. Both the Best Man's "Legendary" card and the Maid of Honor's "Collector's Edition" cover use a **categorical color inversion** (not just a size bump) to signal rarity — see §4 and `HANDOFF.md` for why.
- All app-internal server logic uses `createServerFn` from `@tanstack/react-start`. Public HTTP endpoints (weather, `.ics`) live under `src/routes/api/public/`.
- SEO/social metadata for every route is built through a shared `buildMeta()` helper (`src/lib/seo.ts`), not hand-duplicated per-route arrays.

---

## 2. Current state

**As of this audit (2026-07-15), live production feature-flag values:**
- `rsvp_open` → **false** (RSVP is built and fully functional, but not open to real guests yet)
- `guest_photo_uploads` → **false** (photo upload is built and fully functional, but not open yet)

Both are toggled from the Features tab in `/_authenticated/admin` — no code change needed to flip them on. **Check the live value before assuming either feature is "on" or "off"; this file only reflects a snapshot.**

**Guest data:** the `guests` table currently has exactly **1 row** — a test/seed guest, not the real invite list. `rsvps` has 1 matching row. `guest_photos` is empty. **The real guest list has not been imported.** This is the single biggest blocker to actually opening `rsvp_open` — see Sprint 2 below.

**Admin:** exactly 1 admin has claimed the account (`user_roles` has 1 `admin` row). The first-admin-claim flow has been exercised and works.

### Public site
- Hero, countdown, story timeline, day-of schedule, wedding party, travel/lodging, registry, FAQ, and footer are all live.
- Mobile-first, single-page scroll experience with a sticky header.
- Bilingual scaffolding exists (`src/i18n/dictionaries.ts` has `en` and `es`), but Spanish copy is mostly a mirror of English and needs a proofread pass. **Unchanged this session — still outstanding.**

### Wedding Party section — collectible-card theme (built this cycle)
- **Groomsmen (8) + Best Man (1):** trading cards (`GroomsmanCard.tsx`), 232×388px, flip interaction (front: photo/name/rarity; back: 3–4 stat attributes + one "signature move" ability box). The Best Man renders once, alone, in a centered row above the 8-card grid at `scale={1.1}` with `legendary` — an ink-ground, gold-on-gold finish on both faces, not just a bigger card.
- **Bridesmaids (6) + Maid of Honor (1):** full-bleed editorial magazine covers (`MagazineCover.tsx`), same 232×388px footprint as the trading cards (deliberately matched — see `HANDOFF.md`), masthead "SPARKS." (an original title referencing the venue, Sparks' Barn), no flip — headline/subline print directly on the cover. The Maid of Honor renders once, alone, above the 6-cover grid at `scale={1.15}` with `collectorsEdition` — a lavender-deep backdrop, diagonal "Collector's Ed." foil band, gold corner marks.
- **Personalization content is almost entirely outstanding.** Only the Best Man has a real field set (`cardRarity: "Legendary"`). Every other party member — all 6 bridesmaids, the Maid of Honor, all 8 groomsmen — is rendering on component-level placeholder fallback text for `cardAttributes`/`cardAbility`/`coverHeadline`/`coverSubline`. This is real, visible-to-guests unfinished content, not a code gap.
- Photo spec for the magazine covers (once the user provides photos): 232×388px cover ratio, background-removed transparent PNG, waist-up to 3/4-length framing, soft even lighting. Full spec detail was given to the user in-conversation; not yet re-stated in this file since it's a one-time creative brief, not an evolving architectural fact.
- Down the aisle first: Flower Girl (Ivy Smith), Ring Bearer (Alan Meza).
- Ushers (9) exist in `wedding-data.ts` but are intentionally hard-disabled (`{false && ...}`) in `WeddingParty.tsx` — data preserved, rendering off by design.

### RSVP flow
- `/rsvp` lets guests look up their invitation by name or slug and submit a response.
- **Gating moved from a hardcoded constant to the feature-flag system.** There is no more `RSVP_OPEN` boolean in `src/routes/rsvp.tsx` — it reads the `rsvp_open` flag via `useFeatureFlag` and shows a "not open yet" disabled-form state when off. The server function `submitRsvp` independently re-checks the same flag server-side (`isRsvpOpen()` in `rsvp.functions.ts`) — don't rely on the client-side gate alone.
- `/rsvp/edit/$token` allows guests to edit an existing RSVP using a signed token, **regardless of the `rsvp_open` flag** (intentional — see §1).
- CSV import (`importGuestsCsv`) dedupes against existing guests by email or phone — deliberately never by name, since two real invitees can share a name.
- Confirmation emails include an "Edit your RSVP" button with a fresh token.
- Admin CSV export includes an `rsvp_url` column with the signed edit link.

### Admin dashboard (`/_authenticated/admin`)
- **RSVPs tab:** view, filter, sort, edit guests, import CSV, export CSV, copy RSVP links.
- **Photos tab:** approve/reject/delete guest-uploaded photos, bulk actions, captions, keyboard-shortcut lightbox.
- **Features tab:** toggle `rsvp_open` / `guest_photo_uploads` via an explicit draft → confirm → save flow (toggling doesn't take effect until you click Save and confirm the listed changes).
- Activity strip shows recent RSVP and photo metrics.

### Guest photo uploads
- Guests can upload photos from the Photos section, gated client-side by `guest_photo_uploads` and **also gated server-side** in `uploadGuestPhotos` (`photos.functions.ts`) — added this session to close a gap where the flag was only enforced by disabling the form's inputs.
- A total-failure case (every file in a batch fails) throws a real error instead of silently reporting success — fixed earlier this session, verified still present.
- Uploads land in a pending state; approved photos appear in the public gallery.

### Calendar & maps
- `/api/public/wedding.ics` returns a downloadable iCalendar file. RFC 5545 line-folding (75-octet limit) and full TEXT escaping (backslash/semicolon/comma/newline, in that order) were added this session so the file stays well-formed as copy changes — not previously broken, just fragile.
- Day section has "Add to calendar (.ics)" and "Google Calendar" buttons; their dates are confirmed consistent (verified this session).
- Travel section has "Get directions", "Copy address", and an embedded map.

### SEO / social metadata
- Every route (`__root.tsx`, `index.tsx`, `rsvp.tsx`, `rsvp/edit.$token.tsx`, `portal-ga-2026.tsx`) builds its `head()` through the shared `buildMeta()` helper (`src/lib/seo.ts`) — title, description, og:*, twitter:*, canonical link, optional `robots`. `rsvp/edit.$token.tsx` and `portal-ga-2026.tsx` correctly keep `robots: "noindex,nofollow"`.
- `public/robots.txt` and `public/sitemap.xml` exist (added this session) and point at `morenowedding2026.com`.
- `SITE.siteUrl` (`src/lib/site.ts`) is the single source of truth for the absolute site URL — everything above derives from it. **This was briefly wrong** (pointed at the Lovable preview subdomain instead of the real domain) and was corrected; if you ever add new absolute-URL code, source it from `SITE.siteUrl`, don't hardcode a domain string.

### Accessibility
- Keyboard focus visibility restored on both RSVP forms (an inline `outline: none` was suppressing the site's global `:focus-visible` ring).
- Contrast-failing tan/lavender text and borders on real (non-decorative) content bumped to the palette's own `-deep` tokens across ~8 files. Purely decorative flourish text (eyebrow kickers, punctuation separators) was deliberately left in the lighter tone — that distinction is intentional, not inconsistent.
- Real alt text added to wedding-party card/cover photos and the admin photo lightbox.
- A few heading-styled `<p>` tags promoted to real `<h3>` for screen-reader heading navigation.
- **Not done:** live cross-device visual QA (440px/1280px) — the sandbox this was built in couldn't boot a browser; see `HANDOFF.md` for whether that's still true for you.

### Email
- Transactional emails use Lovable Email (via `@lovable.dev/email-js` and `src/lib/email/enqueue.server.ts`).
- Templates live in `src/lib/email-templates/`, styled on-brand via `src/lib/email-templates/tokens.ts` (mirrors `src/styles.css`'s palette exactly) — confirmed still true this session.

### MCP
- The app exposes an MCP server at `src/routes/mcp.ts` and `src/routes/[.mcp]/`.
- Tools cover wedding info, schedule, travel, registry, weather, dress code, FAQ, wedding party, approved photos, and countdown.

### Build health
- `tsc --noEmit` is **fully clean (0 errors)** as of this audit, confirmed with real dependencies installed (see §8's sandbox note — this required working around a registry block that made most of this session's own typechecks noisy with false-positive "cannot find module" errors).
- `vite build` succeeds end-to-end (SSR bundle, all routes, all server functions).
- `eslint .` reports ~2,400 problems, the overwhelming majority pre-existing Prettier formatting deviations that predate this session and were deliberately left untouched (see `HANDOFF.md` — running `eslint --fix` broadly reformats large amounts of unrelated code and was reverted once already this session). Real, non-formatting lint issues are effectively zero.

---

## 3. Remaining work / roadmap

This is the living sprint plan. Pick up the next uncompleted sprint rather than inventing new work. Each sprint lists the goal, scope, acceptance criteria, key files, and blockers.

### Out of scope unless explicitly requested

- Multi-admin accounts (the app intentionally supports only one admin).
- Changing the admin URL (`/portal-ga-2026`).
- Replacing the single-page composition with separate page routes.
- Adding a public sign-up flow.

---

### Sprint 1 — Content & Copy Freeze — ⚠️ Partially done

**Status:** Wedding party trading-card/magazine-cover data model exists but is almost entirely placeholder (see §2). Spanish dictionary proofread still outstanding.

**Remaining scope:**
- Write real `cardAttributes`/`cardAbility` for all 8 groomsmen and `coverHeadline`/`coverSubline` for all 6 bridesmaids + the Maid of Honor in `src/lib/wedding-data.ts` — this is copy only the couple can write (jokes, inside references, personality). The component-level placeholder fallback (`Add {name}'s headline here.` etc.) makes it obvious in the live UI what's still missing.
- Have a native speaker proofread the Spanish (`es`) dictionary.
- Verify `src/lib/site.ts` and `src/lib/wedding-data.ts` (schedule, registry links, hotels, FAQ, story timeline) against final copy.
- Get real photos for every wedding party member per the photo specs already given (3:4 background-removed for avatars/cards; 232×388 background-removed cutout for magazine covers).

**Key files:** `src/lib/wedding-data.ts`, `src/i18n/dictionaries.ts`, `src/lib/site.ts`

---

### Sprint 2 — RSVP Launch Readiness — ⚠️ Code complete, not yet flipped on

**Status:** The RSVP flow is fully built, feature-flag-gated, and verified working end-to-end (lookup, submit, confirmation email, token-based edit, admin dashboard). It is currently **off** in production (`rsvp_open = false`) because the real guest list has not been imported.

**Remaining scope:**
- Import the real guest list via the admin CSV import in `/_authenticated/admin` (dedup is by email/phone, verified correct).
- Turn `rsvp_open` on via the admin Features tab once the list is loaded and ready.
- Do one real end-to-end pass with a live guest lookup once the flag is on.

**Key files:** `src/routes/rsvp.tsx`, `src/routes/rsvp/edit.$token.tsx`, `src/lib/rsvp.functions.ts`, `src/lib/rsvp-token.server.ts`, `src/lib/email-templates/rsvp-confirmation.tsx`, `src/routes/_authenticated/admin.tsx`

**Blockers:** Real guest list must be imported. `RSVP_EDIT_SECRET` env var must be set in production (unverified from this sandbox — confirm in Lovable Cloud env settings).

---

### Sprint 3 — Guest Photo Upload & Public Gallery — ✅ Done, not yet flipped on

**Status:** Fully built, server-side and client-side flag-gated, admin approve/reject/delete workflow complete, silent-failure bug fixed. Currently **off** in production (`guest_photo_uploads = false`).

**Remaining scope:** Just flip the flag on via the admin Features tab whenever the couple wants uploads open (no code work left).

**Key files:** `src/components/site/sections/PhotosSection.tsx`, `src/lib/photos.functions.ts`, `src/lib/admin.functions.ts`, `src/routes/_authenticated/admin.tsx`

---

### Sprint 4 — Performance & Analytics — Not started

**Goal:** Make the site fast and add lightweight, privacy-friendly event tracking.

**Scope:**
- Audit images (engagement photos, venue photos, party portraits) for lazy loading, sizing, and modern formats.
- Add `loading="lazy"` and responsive `srcset` where appropriate; keep the hero preloaded.
- Run a bundle-size check (`bun run build` and inspect `.output/` or use `vite-bundle-visualizer`) and remove unused dependencies if any.
- Add minimal analytics (server-side counters, a small custom event logger, or a cookie-banner-free third party). Track at minimum: RSVP submit, photo upload start/complete, calendar click, registry click.

**Acceptance criteria:** No layout shift from images; bundle size reasonable; key user actions observable in the admin dashboard or an analytics view.

**Key files:** `src/components/site/sections/*`, `src/routes/index.tsx`, `src/routes/rsvp.tsx`, `src/lib/photos.functions.ts`, `src/lib/admin.functions.ts`

---

### Sprint 5 — Email Branding & Template Polish — ✅ Done

**Status:** Confirmed this session — `rsvp-confirmation.tsx` and `admin-notification.tsx` use only `EMAIL_COLORS.*` from `src/lib/email-templates/tokens.ts`, which mirrors `src/styles.css` exactly. No hardcoded hex in either template. Nothing left to do here unless the couple wants a design change.

---

### Sprint 6 — Pre-Launch QA — ⚠️ Mostly done, real work remains

**Status:** Accessibility, SEO metadata, `.ics` conformance, and the admin auth flow were all audited and fixed this session (see §2 for specifics). What's genuinely still outstanding:

**Remaining scope:**
- **Live cross-device visual QA at 440px/1280px** — never actually performed with a real browser. Check `HANDOFF.md` for whether your environment can boot the dev server; if so, this is the highest-value remaining QA item.
- **Session-expiry/revoked-token UX in the admin dashboard** — untested; needs a live session to observe what actually happens.
- **The TOCTOU race in first-admin-claim** (two near-simultaneous first sign-ins could theoretically both pass the "no admin yet" check) — known, accepted as very low risk for a single-couple site with one intentional claim, not fixed. Would need a DB-level unique constraint/transaction if ever addressed.
- Full Prettier reformat of the codebase's pre-existing formatting debt (~2,400 lint findings, almost all `prettier/prettier`) is a legitimate but separate, large, cosmetic-only task — not blocking launch, not attempted this session beyond the files actively touched.

**Key files:** `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/rsvp.tsx`, `src/routes/rsvp/edit.$token.tsx`, `src/routes/portal-ga-2026.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/_authenticated/route.tsx`, `src/lib/admin.functions.ts`, `src/lib/seo.ts`, `src/routes/api/public/wedding[.]ics.ts`

---

### Sprint 7 — Post-Wedding — Not started (blocked on the wedding happening)

**Goal:** Convert the site into a post-event photo hub.

**Scope:**
- Keep or reopen photo uploads so guests can share wedding-day photos.
- Batch-approve photos from the wedding day in the admin dashboard.
- Optionally add a thank-you note or recap section to `src/routes/index.tsx`.
- Optionally disable RSVP edits after a final cutoff while preserving read-only access.

**Key files:** `src/components/site/sections/PhotosSection.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/index.tsx`

**Blockers:** Wedding must have happened (October 10, 2026) and photos must be available.

---

## 4. Design & UX principles

**Visual direction:** Stationery-inspired, warm, minimal. Ivory paper, ink type, lavender and tan accents, no border radius except circular avatars.

**Palette tokens (defined in `src/styles.css`):**
- `--color-ivory`: #F8F4EC (page background)
- `--color-ink`: #2A2520 (headings, primary buttons)
- `--color-ink-body`: #4A4238 (body text)
- `--color-ink-soft`: #6E6255 (muted text)
- `--color-lavender`: #8779A3 (accent — decorative use only; fails AA contrast on ivory)
- `--color-lavender-deep`: #4C4066 (dark accent sections; use for functional lavender-family text on ivory)
- `--color-lavender-wash`: #EAE3F1 (subtle backgrounds)
- `--color-tan`: #A39680 (decorative use only — fails AA contrast on ivory)
- `--color-tan-deep`: #6B5F49 (use for functional tan-family text/borders on ivory — labels, buttons, links, the only visual affordance of an interactive element)
- `--color-gold`: #D9C9A0 (text on dark lavender/ink sections)
- `--color-hairline`: #E1D6C3 (dividers)

**Contrast rule, made explicit this session:** `tan`/`lavender` (the lighter tokens) are contrast-safe *only* on dark backgrounds or as purely decorative flourishes (an eyebrow kicker where the real content is elsewhere, a punctuation separator). Any text a guest needs to actually read to understand or operate something — a button, a link, a form label, an instructional hint, a border that's the sole indicator of an interactive element — must use the `-deep` variant. When adding new UI, default to `-deep` for anything functional and only reach for the lighter tone with a specific decorative rationale.

**Typography:**
- Serif headings/italics: Cormorant
- Sans UI/labels: Work Sans
- Labels use uppercase + wide letter-spacing (`tracking-[0.2em]` to `[0.35em]`).

**The "categorical, not quantitative" rarity/specialness principle (established this session):** when a UI element needs to read as "the rare/special one" among a set of otherwise-identical siblings (the Best Man among groomsmen, the Maid of Honor among bridesmaids), don't just make it bigger — invert its color scheme (light ground → dark ground, or vice versa) so it's a different *finish*, not a scaled copy. A pure size bump reads as "the same thing, but bigger," which was explicitly called out as unconvincing. A modest size bump (1.1–1.15×) on top of a genuine color/finish inversion is fine and was used for both the Best Man and Maid of Honor. Apply this principle to any future "featured/premium/rare" treatment on the site.

**Rules:**
- Mobile-first. Test at 440px and 1280px.
- Do not hardcode hex values in components; use the semantic tokens above.
- No rounded corners except circular avatars.
- Keep section copy in `src/lib/wedding-data.ts` or `src/i18n/dictionaries.ts`, not inline in components.
- Preserve the existing aesthetic. Do not introduce generic AI gradients, Inter/Poppins defaults, or purple/indigo palettes.
- The Wedding Party section's two card families (trading cards vs. magazine covers) are deliberately styled as **siblings, not clones** — same footprint (232×388px), same "collectible" concept, genuinely different genre (bordered game-card vs. full-bleed editorial cover) so they pair without feeling repetitive. If asked to extend this system (e.g., a third card type for parents or officiants), preserve that same-footprint-different-genre relationship rather than reskinning one of the two existing components.

---

## 5. Architecture & patterns

**Routing (TanStack Start file-based):**
- `src/routes/__root.tsx` — root layout; must keep `<Outlet />`.
- `src/routes/index.tsx` — homepage; the main public page.
- `src/routes/portal-ga-2026.tsx` — admin sign-in page (obscure URL).
- `src/routes/_authenticated/route.tsx` — auth gate for `/admin`; checks the `admin` role, not just sign-in status.
- `src/routes/_authenticated/admin.tsx` — admin dashboard.
- `src/routes/rsvp.tsx` — public RSVP lookup/submit.
- `src/routes/rsvp/edit.$token.tsx` — signed-token RSVP edit.
- `src/routes/api/public/` — public HTTP endpoints (weather, `.ics`).
- `src/routes/mcp.ts` + `src/routes/[.mcp]/` — MCP server.
- Every route's `head()` should call `buildMeta()` from `src/lib/seo.ts` rather than hand-writing a meta array — see `rsvp.tsx` for the simplest example.
- Do not create `src/pages/`. Do not create Next.js/Remix-style layouts.

**Server functions:**
- Use `createServerFn` from `@tanstack/react-start`.
- Public server functions go in `src/lib/*.functions.ts`.
- Admin-only functions use `.middleware([requireSupabaseAuth])` and check the `user_roles` table (via `hasAdminRole()`/`ensureAdmin()` in `admin.functions.ts` — reuse these, don't re-write the role query).
- Server-only helpers go in `*.server.ts` files.
- Read `process.env` only inside `.handler()` bodies, never at module scope.
- **Feature-flag gating pattern:** any server function whose behavior a flag controls should re-check that flag itself (`isRsvpOpen()` in `rsvp.functions.ts`, `isGuestPhotoUploadsOpen()` in `photos.functions.ts` — both are small, local, single-purpose async functions querying `feature_flags` directly). Client-side gating (disabling a form) is a UX nicety, never the actual enforcement boundary.

**Supabase clients:**
- Browser: `import { supabase } from "@/integrations/supabase/client"`.
- Server as authenticated user: `requireSupabaseAuth` middleware provides `context.supabase`.
- Server admin / bypass RLS: `supabaseAdmin` from `@/integrations/supabase/client.server` — use only in admin/webhook contexts, and import it dynamically inside handlers when called from `*.functions.ts`.

**Data loading:**
- Prefer TanStack Query loaders (`context.queryClient.ensureQueryData`) and `useSuspenseQuery` in components.
- The feature-flag hook (`useFeatureFlag` in `src/hooks/use-feature-flags.ts`) is the one established exception to "prefer TanStack Query" — it's a small `useState`/`useEffect` hook, and that's this codebase's convention for this kind of lightweight client-fetched state (a dormant `QueryClient` exists but isn't the house style for this). Match whichever pattern the surrounding code already uses rather than introducing a third.

**Auth:**
- Single admin. The first person to sign in at `/portal-ga-2026` gets the `admin` role via `claimAdminIfFirst`. A failed claim now surfaces its error to the UI instead of silently proceeding.
- `/_authenticated` checks the admin role at the route guard, not just sign-in — this is a redundant, earlier UX check; the real authorization boundary is still `ensureAdmin()`/RLS on every server call.
- Do not add sign-up flows or allow public registration.

**Component scale-multiplier pattern (`GroomsmanCard.tsx`, `MagazineCover.tsx`):** both cards derive every pixel value (width, height, padding, font sizes) from a `BASE_WIDTH`/`BASE_HEIGHT` constant times a `scale` prop, via a local `s(px) => px * scale` helper — never a hand-duplicated "large variant." If you need a differently-sized instance of either component, use `scale`, don't fork the component.

**SEO metadata pattern (`src/lib/seo.ts`):** `buildMeta({ title, description, image?, url, type?, robots? })` returns the full `{ meta, links }` shape a route's `head()` needs. `url` should always come from `` `${SITE.siteUrl}${path}` ``, never a hardcoded domain. Pass `robots: "noindex,nofollow"` for any private/non-indexable route.

---

## 6. Important files

| File | Why it matters |
|------|----------------|
| `src/lib/site.ts` | Single source for couple names, venue, address, date, map links, RSVP deadline, fallback contact, and `siteUrl` (the canonical absolute domain — everything SEO-related derives from this). |
| `src/lib/wedding-data.ts` | Registry, wedding party (`PARTY` array + `PartyMember` type, including card/cover personalization fields), hotels, FAQ, story timeline, schedule, date cards. |
| `src/i18n/dictionaries.ts` | All user-facing copy in `en` and `es`. |
| `src/lib/feature-flags.functions.ts` + `src/hooks/use-feature-flags.ts` | The centralized feature-flag system. `getFeatureFlags`/`setFeatureFlags` server functions, `useFeatureFlag(key)` client hook — defaults to `enabled: false` while loading/on error, on purpose. |
| `src/components/site/WeddingParty.tsx` | Wedding Party section layout — wires `GroomsmanCard`/`MagazineCover` to the `PARTY` data, handles the Best Man/Maid of Honor leading-slot placement and grid sizing. |
| `src/components/site/GroomsmanCard.tsx` | Groomsmen/Best Man trading card, with the flip interaction and the `legendary` ink-inversion variant. |
| `src/components/site/MagazineCover.tsx` | Bridesmaids/Maid of Honor magazine cover, with the `collectorsEdition` lavender-deep-inversion variant. |
| `src/lib/rsvp.functions.ts` | Public RSVP lookup/submit/update + admin guest/CSV functions. Contains `isRsvpOpen()`. |
| `src/lib/rsvp-token.server.ts` | HMAC token signing/verification for RSVP edit links. |
| `src/lib/photos.functions.ts` | Guest photo upload (`uploadGuestPhotos`, now flag-gated server-side) + `listApprovedPhotos`. |
| `src/lib/admin.functions.ts` | Admin-only server functions (photos, activity, first-admin claim, `hasAdminRole`/`ensureAdmin`). |
| `src/lib/seo.ts` | `buildMeta()` — the shared SEO/social metadata helper every route's `head()` should use. |
| `src/lib/email/enqueue.server.ts` | Email queue logic. |
| `src/lib/email-templates/rsvp-confirmation.tsx`, `admin-notification.tsx` | On-brand transactional emails, styled via `email-templates/tokens.ts`. |
| `src/routes/portal-ga-2026.tsx` | Admin sign-in page. |
| `src/routes/_authenticated/route.tsx` | Auth + admin-role route guard for `/admin`. |
| `src/routes/_authenticated/admin.tsx` | Admin dashboard (RSVPs + Photos + Features tabs). |
| `src/routes/rsvp.tsx` | Public RSVP page — reads `rsvp_open` via the feature-flag hook. |
| `src/routes/rsvp/edit.$token.tsx` | Signed-token RSVP edit page — intentionally not flag-gated. |
| `src/routes/api/public/wedding[.]ics.ts` | iCalendar download endpoint, RFC 5545 line-folding + escaping. |
| `src/components/site/sections/` | All public homepage sections. |
| `src/styles.css` | Tailwind v4 theme, semantic tokens, custom utilities (including `.gm-card-*` for the trading-card flip). |
| `public/robots.txt`, `public/sitemap.xml` | Crawl directives / sitemap, pointed at `SITE.siteUrl`. |
| `AGENTS.md` | Lovable-specific guardrail: do not rewrite published git history. |
| `.claude/hooks/session-start.sh`, `.claude/settings.json` | A `SessionStart` hook (added by another session, not this one) that works around this sandbox's blocked private-npm-registry `bun install` — see §8 and `HANDOFF.md`. |

---

## 7. Never-do rules

- **Do not expose "Supabase" terminology to the end user.** Say "Lovable Cloud", "backend", "database", "auth", or "storage".
- **Do not create additional admin accounts or a public sign-up flow.** The app intentionally has one admin.
- **Do not change the admin URL** (`/portal-ga-2026`) unless the user explicitly asks.
- **Do not hardcode colors** (`text-white`, `bg-black`, `bg-[#...]`). Use the tokens in `src/styles.css`, and prefer the `-deep` variant of tan/lavender for anything functional (see §4).
- **Do not use `src/pages/`.** TanStack Start uses `src/routes/`.
- **Do not import `*.server.ts` files into client components.** Only `*.functions.ts` are client-safe.
- **Do not put protected server functions in public route loaders.** Call them from components via `useServerFn` + `useQuery`, or keep them under `_authenticated/`.
- **Do not rewrite published git history.** No force-push, rebase, amend, or squash of commits already on `main`.
- **Do not add dependencies that only work on Node.js.** Server functions run in a Worker runtime; prefer pure JS, Web APIs, fetch-based clients, or WASM.
- **Do not leave placeholder content** on `src/routes/index.tsx`.
- **Do not gate a feature client-side only.** Every flag-gated server function must also re-check the flag itself — see §5.
- **Do not hardcode an absolute site URL anywhere.** Derive it from `SITE.siteUrl` in `src/lib/site.ts`. This file's `siteUrl` value pointed at the wrong domain for one commit this session — check it's still `https://morenowedding2026.com` (no `www`) if anything SEO-related looks off.
- **Do not run `eslint --fix` broadly across a file you're only making a small change to.** This codebase carries a large amount of pre-existing Prettier formatting debt; a blanket `--fix` reformats far more than you intended and produces a bloated, hard-to-review diff. Scope fixes to the lines you actually touched, or leave pre-existing violations alone.
- **Do not assume env var injection is uniform between secrets.** `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected through different mechanisms in this Lovable project; untracking `.env` broke production once this session because of that mismatch (since reverted, `.env` stays tracked). Verify before "fixing" something that looks like a security smell.

---

## 8. Git & branching workflow

**Policy:** Work directly on `main`. No feature branches, no dev branch, no pull requests — this is the stated policy and the one this session followed throughout. **Note:** a different session recently landed a change via a branch + PR (`McMittens1/claude/next-priorities-leo2v8`, merged as PR #2) — that appears to be a one-off, not a policy change; keep working direct-on-main unless you're told otherwise.

**Why:** Lovable is connected to GitHub and syncs `main` bidirectionally. Any commit pushed to `main` appears in the Lovable editor, and any edit made in Lovable commits straight back to `main`. Branching and PRs add friction without benefit for this project.

**Rules for every AI assistant (Lovable, Claude Code, Cursor, etc.):**
1. Make sure you are on `main` before editing: `git checkout main && git pull`.
2. Make changes, commit them, and push directly to `main`.
3. Do not create `feat/*`, `dev`, or any other branch (see the PR #2 note above — if you find divergent history on `main` from another session, `git fetch` + merge it in rather than force-pushing over it).
4. Do not open pull requests.
5. Never force-push, rebase, amend, or squash commits already pushed to `main`.
6. Keep `main` in a working state: run `bun run build` (see the sandbox note below) before pushing if possible, and do not push broken code.

**Sandbox / dependency note (read before assuming you can't run `bun install`):** `bun.lock` pins every package to Lovable's private registry mirror, which some sandboxed dev environments' network policy blocks — `bun install` then fails outright, and `tsc`/`vite build` report a wall of false-positive "cannot find module" errors that have nothing to do with your actual changes. A `SessionStart` hook (`.claude/hooks/session-start.sh`) now works around this automatically in Claude Code web sessions: it temporarily removes `bun.lock`, runs `bun install` against the public npm registry instead, then restores the original lockfile untouched. If you're in an environment where dependencies still won't resolve, try running that script manually (`CLAUDE_PROJECT_DIR=$(pwd) bash .claude/hooks/session-start.sh`) before concluding the sandbox can't build. **This solved a real, previously-unresolvable limitation** — see `HANDOFF.md` for the full story and what it unblocked (a full clean `tsc --noEmit`, a successful `vite build`, and discovery of 5 real pre-existing type errors that had been invisible under the noise).

**Lovable sync note:**
- If you edit inside the Lovable UI, those commits go straight to `main` on GitHub.
- If you edit in Claude Code, Cursor, or another local editor, push to `main`; the changes will sync back to Lovable automatically.
- Because everyone writes to `main`, pull before you start and push frequently in small commits to reduce the chance of conflicts.

---

## 9. Recommended first steps for a new AI

Before writing or changing code:

1. Read this file (`ONBOARDING.md`) in full, then read `HANDOFF.md` if it exists — it has narrative context this file doesn't (design rationale, judgment calls, things that went wrong and how they were fixed).
2. Read `AGENTS.md` for Lovable-specific git guardrails.
3. Read `src/lib/site.ts` and `src/lib/wedding-data.ts` to understand the data model.
4. Read `src/styles.css` to internalize the color/type tokens.
5. Check the **live** feature-flag values before assuming `rsvp_open`/`guest_photo_uploads` are on or off — query the `feature_flags` table or check the admin Features tab; this file's §2 is a snapshot, not a live source.
6. Try `bun install` / `bun run build` to verify the project compiles — if it fails on missing packages, see §8's sandbox note before concluding the codebase is broken.
7. If you touch RSVP, admin, or email logic, test the affected flow in the browser or via the existing server functions.

Note: Work directly on `main`. Do not create feature branches or open PRs. See §8 for the full git workflow.

---

## 10. Reusable onboarding prompt

Paste the block below into any new AI conversation to bring it up to speed. It is intentionally concise and directive.

```text
You are continuing an existing Lovable/TanStack Start project: the Moreno Wedding 2026 website.

BEFORE you make any code changes, do the following:
1. Read ONBOARDING.md in the repo root, then HANDOFF.md if it exists.
2. Read AGENTS.md for git guardrails.
3. Read src/lib/site.ts and src/lib/wedding-data.ts.
4. Read src/styles.css to understand the color/type tokens.
5. Check the LIVE feature_flags table (or admin Features tab) for rsvp_open / guest_photo_uploads — don't assume from this prompt.
6. Read §3 of ONBOARDING.md (Remaining work / roadmap) and pick up the next uncompleted sprint rather than inventing new work.

PROJECT ESSENTIALS:
- Tech stack: TanStack Start v1, React 19, Vite 8, Tailwind CSS v4, TypeScript strict, Lovable Cloud (Supabase-backed but never say "Supabase" to users).
- Public site is a single scrolling page at src/routes/index.tsx composed of sections in src/components/site/sections/.
- Wedding data (schedule, registry, party, hotels, FAQ, story) lives in src/lib/wedding-data.ts. The wedding-party trading cards / magazine covers are mostly still placeholder copy — real headlines/attributes/abilities are outstanding, see Sprint 1.
- Copy lives in src/i18n/dictionaries.ts (en + es; Spanish needs proofreading).
- Admin sign-in is at /portal-ga-2026. There is intentionally only ONE admin account. The route guard checks the admin role itself, not just sign-in.
- Admin dashboard is at /_authenticated/admin (RSVPs / Photos / Features tabs).
- RSVP is at /rsvp; edit links use signed HMAC tokens at /rsvp/edit/$token (which intentionally bypasses the rsvp_open flag).
- rsvp_open and guest_photo_uploads are DB-backed feature flags (feature_flags table, src/lib/feature-flags.functions.ts, src/hooks/use-feature-flags.ts) with a draft/confirm/save admin UI — not hardcoded booleans. Every flag-gated server function re-checks its flag server-side too.
- SEO metadata goes through buildMeta() in src/lib/seo.ts, sourcing the absolute URL from SITE.siteUrl (src/lib/site.ts) — never hardcode a domain.
- All app-internal server logic uses createServerFn from @tanstack/react-start.
- Public HTTP endpoints live under src/routes/api/public/.
- Do not use src/pages/. Do not import *.server.ts into client components.
- If bun install / tsc / vite build fail with "cannot find module" for third-party packages, see ONBOARDING.md §8 — a SessionStart hook usually fixes this automatically; try it manually if not.

DESIGN RULES:
- Palette: ivory #F8F4EC, ink #2A2520, lavender #8779A3 (decorative only), deep lavender #4C4066 (functional text), tan #A39680 (decorative only), tan-deep #6B5F49 (functional text/borders), gold #D9C9A0, hairline #E1D6C3.
- Fonts: Cormorant (serif) + Work Sans (sans).
- No border radius except circular avatars. Mobile-first.
- Use semantic tokens from src/styles.css; never hardcode text-white, bg-black, or bg-[#...].
- Preserve the existing stationery/minimal aesthetic. Do not introduce generic AI gradients or Inter/Poppins defaults.
- For any "rare/special/featured" UI treatment, invert color/finish rather than just scaling up size — see ONBOARDING.md §4.

GIT WORKFLOW:
- Work directly on `main`. Do not create feature branches or open PRs.
- Pull before you start; commit and push to `main` frequently in small commits.
- Never force-push, rebase, amend, or squash commits already on `main`.

NEVER DO:
- Do not expose "Supabase" terminology to end users.
- Do not add multi-admin support or public sign-up.
- Do not change the admin URL unless explicitly asked.
- Do not rewrite published git history.
- Do not leave placeholder content on src/routes/index.tsx.
- Do not gate a feature client-side only — re-check flags server-side too.
- Do not run eslint --fix broadly; it reformats large amounts of unrelated pre-existing code.

When you are ready to propose a change, explain it briefly, then implement it. After editing, run `bun run build` to verify the project compiles. If you touch RSVP/admin/email logic, test the affected flow.
```

---

*Last updated: July 2026, following a session that shipped the feature-flag system, RSVP + photo uploads, the Wedding Party collectible-card redesign, and a full pre-launch QA pass. Keep this file current as the project evolves — update it, don't let it drift, and consider folding `HANDOFF.md`'s content back into this file (or archiving it) once its context has been fully absorbed by ongoing work.*
