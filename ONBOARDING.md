# Moreno Wedding 2026 — Onboarding Package

A single source of truth for continuing this project with any AI assistant (Claude Code, Cursor, etc.). Read this file in full before making changes.

---

## 1. Project overview

**What this is:** A wedding website for Geovanni Moreno and Addison Hillman, built as a TanStack Start full-stack React app.

**Live URLs:**
- Custom domain: https://www.morenowedding2026.com
- Published Lovable URL: https://sparks-ceremony-soiree.lovable.app
- Preview URL: https://id-preview--a290ad4a-bc98-421e-bbac-091b5ceb23e6.lovable.app

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
- RSVP lookup is by name or short invitation slug. No guest accounts or passwords.
- RSVP edit links are HMAC-signed tokens (`RSVP_EDIT_SECRET`) with a 90-day expiry; no login required.
- Admin access is behind an intentionally obscure URL: `/portal-ga-2026`. There is a single admin account; the first user to sign in via that page is auto-promoted to admin.
- All app-internal server logic uses `createServerFn` from `@tanstack/react-start`. Public HTTP endpoints (weather, `.ics`) live under `src/routes/api/public/`.

---

## 2. Current state

### Public site
- Hero, countdown, story timeline, day-of schedule, wedding party, travel/lodging, registry, FAQ, and footer are all live.
- Mobile-first, single-page scroll experience with a sticky header.
- Bilingual scaffolding exists (`src/i18n/dictionaries.ts` has `en` and `es`), but Spanish copy is mostly a mirror of English and needs a proofread pass.

### RSVP flow
- `/rsvp` lets guests look up their invitation by name or slug and submit a response.
- The form is currently **closed to real submissions** via the `RSVP_OPEN = false` flag in `src/routes/rsvp.tsx`. When closed, the form renders in a read-only preview state.
- `/rsvp/edit/$token` allows guests to edit an existing RSVP using a signed token. Tokens expire after 90 days.
- Confirmation emails include an "Edit your RSVP" button with a fresh token.
- Admin CSV export includes an `rsvp_url` column with the signed edit link.

### Admin dashboard (`/_authenticated/admin`)
- RSVPs tab: view, filter, sort, edit guests, import CSV, export CSV, copy RSVP links.
- Photos tab: approve/reject/delete guest-uploaded photos, bulk actions, captions.
- Activity strip shows recent RSVP and photo metrics.

### Guest photo uploads
- Guests can upload photos from the Photos section.
- Uploads are pending until approved in the admin dashboard.
- Approved photos appear in the public gallery.

### Calendar & maps
- `/api/public/wedding.ics` returns a downloadable iCalendar file.
- Day section has "Add to calendar (.ics)" and "Google Calendar" buttons.
- Travel section has "Get directions", "Copy address", and an embedded map.

### Email
- Transactional emails use Lovable Email (via `@lovable.dev/email-js` and `src/lib/email/enqueue.server.ts`).
- Templates live in `src/lib/email-templates/`.

### MCP
- The app exposes an MCP server at `src/routes/mcp.ts` and `src/routes/[.mcp]/`.
- Tools cover wedding info, schedule, travel, registry, weather, dress code, FAQ, wedding party, approved photos, and countdown.

---

## 3. Remaining work / roadmap

This is the living sprint plan. Pick up the next uncompleted sprint rather than inventing new work. Each sprint lists the goal, scope, acceptance criteria, key files, and blockers.

### Out of scope unless explicitly requested

- Multi-admin accounts (the app intentionally supports only one admin).
- Changing the admin URL (`/portal-ga-2026`).
- Replacing the single-page composition with separate page routes.
- Adding a public sign-up flow.

---

### Sprint 1 — Content & Copy Freeze

**Goal:** Finalize every word on the public site before any feature goes live.

**Scope:**
- Review all copy in `src/i18n/dictionaries.ts` against the actual site sections.
- Have a native speaker proofread the Spanish (`es`) dictionary. Current Spanish is functional but marked as needing a naturalness pass.
- Verify `src/lib/site.ts` (couple names, venue, address, date, RSVP deadline, fallback contact).
- Verify `src/lib/wedding-data.ts` (schedule, registry links, hotels, FAQ, wedding party, story timeline).
- Add or update wedding party portraits/notes in `src/lib/wedding-data.ts` if the couple provides photos.

**Acceptance criteria:**
- No placeholder copy remains on `src/routes/index.tsx` or in section components.
- Both `en` and `es` dictionaries read naturally and are culturally appropriate.
- All external links (registry, maps, Venmo) resolve correctly.

**Key files:** `src/i18n/dictionaries.ts`, `src/lib/site.ts`, `src/lib/wedding-data.ts`, `src/components/site/sections/*`

**Blockers:** Needs final copy and any wedding party photos from the couple.

---

### Sprint 2 — RSVP Launch Readiness

**Goal:** Make the RSVP flow fully operational for real guests.

**Scope:**
- Flip `RSVP_OPEN` from `false` to `true` in `src/routes/rsvp.tsx`.
- Import the real guest list. Options:
  - Use the admin CSV import in `/_authenticated/admin`, or
  - Add a one-time seed migration for the `guests` table (keep it private; do not commit real guest PII).
- End-to-end test lookup by name, lookup by slug (`?g=<slug>`), submission, and edit-token flow (`/rsvp/edit/$token`).
- Test the RSVP confirmation email (`src/lib/email-templates/rsvp-confirmation.tsx`) and verify the edit link works.
- Verify admin dashboard counts, filters, CSV export, and the `rsvp_url` edit-link column.

**Acceptance criteria:**
- A guest can find their invitation, submit a response, receive a confirmation email, and edit their RSVP.
- Admin can see the new RSVP in the dashboard immediately.
- The late-RSVP notice works correctly after the deadline in `src/lib/site.ts`.

**Key files:** `src/routes/rsvp.tsx`, `src/routes/rsvp/edit.$token.tsx`, `src/lib/rsvp.functions.ts`, `src/lib/rsvp-token.server.ts`, `src/lib/email-templates/rsvp-confirmation.tsx`, `src/routes/_authenticated/admin.tsx`

**Blockers:** Real guest list must be available; `RSVP_EDIT_SECRET` env var must be set in production.

---

### Sprint 3 — Guest Photo Upload & Public Gallery

**Goal:** Let guests upload photos from the public site and display approved photos in a gallery.

**Scope:**
- Replace the disabled placeholder form in `src/components/site/sections/PhotosSection.tsx` with a working upload form.
- Wire the form to the existing upload server function in `src/lib/photos.functions.ts`.
- Build a public gallery that fetches and displays approved photos from the backend.
- Test the admin approve/reject/delete workflow and bulk actions.
- Ensure mobile upload works (camera access, file size validation, multiple files).

**Acceptance criteria:**
- Guests can upload up to 5 JPG/PNG images from the Photos section.
- Uploads land in a pending state.
- Approved photos appear in the public gallery; rejected/deleted photos do not.
- Admin can manage uploads from the Photos tab in `/_authenticated/admin`.

**Key files:** `src/components/site/sections/PhotosSection.tsx`, `src/lib/photos.functions.ts`, `src/lib/admin.functions.ts`, `src/routes/_authenticated/admin.tsx`

**Blockers:** Storage bucket and RLS policies for photos must already be configured in Lovable Cloud.

---

### Sprint 4 — Performance & Analytics

**Goal:** Make the site fast and add lightweight, privacy-friendly event tracking.

**Scope:**
- Audit images (engagement photos, venue photos, party portraits) for lazy loading, sizing, and modern formats.
- Add `loading="lazy"` and responsive `srcset` where appropriate; keep the hero preloaded.
- Run a bundle-size check (`bun run build` and inspect `.output/` or use `vite-bundle-visualizer`) and remove unused dependencies if any.
- Add minimal analytics. Prefer a privacy-friendly approach:
  - Server-side counters for RSVP submissions and photo uploads, or
  - A small custom event logger to Lovable Cloud, or
  - A lightweight third-party option that does not require a cookie banner.
- Track at minimum: RSVP submit, photo upload start/complete, calendar click, registry click.

**Acceptance criteria:**
- No layout shift from images; above-the-fold images are prioritized.
- Bundle size is reasonable (no unused large libraries).
- Key user actions are observable in the admin dashboard or an analytics view.

**Key files:** `src/components/site/sections/*`, `src/routes/index.tsx`, `src/routes/rsvp.tsx`, `src/lib/photos.functions.ts`, `src/lib/admin.functions.ts`

**Blockers:** Decide whether to use server-side counters, a third-party analytics provider, or both.

---

### Sprint 5 — Email Branding & Template Polish

**Goal:** Make transactional emails match the stationery-inspired visual identity.

**Scope:**
- Apply the design tokens from `src/styles.css` to `src/lib/email-templates/rsvp-confirmation.tsx` (ivory background, ink headings, lavender accents, Cormorant/Work Sans typography).
- Remove hardcoded hex values from email styles where possible; use the same palette as the site.
- Ensure email preview data in each template matches real content.
- Test rendering in common clients (Gmail, Apple Mail, Outlook web).
- If Spanish confirmations are required, decide whether to add a bilingual template or keep emails English-only.

**Acceptance criteria:**
- RSVP confirmation email looks on-brand and displays correctly on mobile and desktop.
- All transactional templates have consistent header/footers.
- No broken links or placeholder values in preview data.

**Key files:** `src/lib/email-templates/rsvp-confirmation.tsx`, `src/lib/email-templates/*.tsx`, `src/lib/email-templates/registry.ts`

**Blockers:** Couple must approve the email design direction.

---

### Sprint 6 — Pre-Launch QA

**Goal:** Ship a polished, accessible, SEO-ready site.

**Scope:**
- Accessibility audit: form labels, focus states, color contrast, alt text on images, semantic headings.
- SEO/social metadata review on every route:
  - `src/routes/index.tsx` (home)
  - `src/routes/rsvp.tsx`
  - `src/routes/rsvp/edit.$token.tsx`
  - `src/routes/portal-ga-2026.tsx`
  - `src/routes/__root.tsx`
- Verify `og:image` is absolute and meaningful on leaf routes.
- Cross-device testing at 440px and 1280px.
- Final admin workflow verification: first-admin claim, sign-in, sign-out, session persistence.
- Verify the `.ics` calendar file and Google Calendar link.

**Acceptance criteria:**
- No critical accessibility issues.
- Every public route has unique title/description and valid canonical/og tags.
- Site looks and works correctly on mobile and desktop.
- Admin can sign in and manage RSVPs/photos without errors.

**Key files:** `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/rsvp.tsx`, `src/routes/rsvp/edit.$token.tsx`, `src/routes/portal-ga-2026.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/api/public/wedding[.]ics.ts`

**Blockers:** Should be the last sprint before inviting real guests.

---

### Sprint 7 — Post-Wedding

**Goal:** Convert the site into a post-event photo hub.

**Scope:**
- Keep or reopen photo uploads so guests can share wedding-day photos.
- Batch-approve photos from the wedding day in the admin dashboard.
- Optionally add a thank-you note or recap section to `src/routes/index.tsx`.
- Optionally disable RSVP edits after a final cutoff while preserving read-only access.

**Acceptance criteria:**
- Post-event gallery is live and manageable from the admin dashboard.
- Upload flow remains simple for guests on mobile.
- Any new homepage section matches the existing design language.

**Key files:** `src/components/site/sections/PhotosSection.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/index.tsx`

**Blockers:** Wedding must have happened and photos must be available.

---

## 4. Design & UX principles

**Visual direction:** Stationery-inspired, warm, minimal. Ivory paper, ink type, lavender and tan accents, no border radius except circular avatars.

**Palette tokens (defined in `src/styles.css`):**
- `--color-ivory`: #F8F4EC (page background)
- `--color-ink`: #2A2520 (headings, primary buttons)
- `--color-ink-body`: #4A4238 (body text)
- `--color-ink-soft`: #6E6255 (muted text)
- `--color-lavender`: #8779A3 (accent)
- `--color-lavender-deep`: #4C4066 (dark accent sections)
- `--color-lavender-wash`: #EAE3F1 (subtle backgrounds)
- `--color-tan`: #A39680 (borders, secondary accents)
- `--color-tan-deep`: #6B5F49 (links on light backgrounds)
- `--color-gold`: #D9C9A0 (text on dark lavender sections)
- `--color-hairline`: #E1D6C3 (dividers)

**Typography:**
- Serif headings/italics: Cormorant
- Sans UI/labels: Work Sans
- Labels use uppercase + wide letter-spacing (`tracking-[0.2em]` to `[0.35em]`).

**Rules:**
- Mobile-first. Test at 440px and 1280px.
- Do not hardcode hex values in components; use the semantic tokens above.
- No rounded corners except circular avatars.
- Keep section copy in `src/lib/wedding-data.ts` or `src/i18n/dictionaries.ts`, not inline in components.
- Preserve the existing aesthetic. Do not introduce generic AI gradients, Inter/Poppins defaults, or purple/indigo palettes.

---

## 5. Architecture & patterns

**Routing (TanStack Start file-based):**
- `src/routes/__root.tsx` — root layout; must keep `<Outlet />`.
- `src/routes/index.tsx` — homepage; the main public page.
- `src/routes/portal-ga-2026.tsx` — admin sign-in page (obscure URL).
- `src/routes/_authenticated/route.tsx` — auth gate for `/admin`.
- `src/routes/_authenticated/admin.tsx` — admin dashboard.
- `src/routes/rsvp.tsx` — public RSVP lookup/submit.
- `src/routes/rsvp/edit.$token.tsx` — signed-token RSVP edit.
- `src/routes/api/public/` — public HTTP endpoints (weather, `.ics`).
- `src/routes/mcp.ts` + `src/routes/[.mcp]/` — MCP server.
- Do not create `src/pages/`. Do not create Next.js/Remix-style layouts.

**Server functions:**
- Use `createServerFn` from `@tanstack/react-start`.
- Public server functions go in `src/lib/*.functions.ts`.
- Admin-only functions use `.middleware([requireSupabaseAuth])` and check the `user_roles` table.
- Server-only helpers go in `*.server.ts` files.
- Read `process.env` only inside `.handler()` bodies, never at module scope.

**Supabase clients:**
- Browser: `import { supabase } from "@/integrations/supabase/client"`.
- Server as authenticated user: `requireSupabaseAuth` middleware provides `context.supabase`.
- Server admin / bypass RLS: `supabaseAdmin` from `@/integrations/supabase/client.server` — use only in admin/webhook contexts, and import it dynamically inside handlers when called from `*.functions.ts`.

**Data loading:**
- Prefer TanStack Query loaders (`context.queryClient.ensureQueryData`) and `useSuspenseQuery` in components.
- Avoid `useEffect` + `fetch` for initial data loads.

**Auth:**
- Single admin. The first person to sign in at `/portal-ga-2026` gets the `admin` role via `claimAdminIfFirst`.
- Do not add sign-up flows or allow public registration.

---

## 6. Important files

| File | Why it matters |
|------|----------------|
| `src/lib/site.ts` | Single source for couple names, venue, address, date, map links, RSVP deadline, fallback contact. |
| `src/lib/wedding-data.ts` | Registry, wedding party, hotels, FAQ, story timeline, schedule, date cards. |
| `src/i18n/dictionaries.ts` | All user-facing copy in `en` and `es`. |
| `src/lib/rsvp.functions.ts` | Public RSVP lookup/submit/update + admin guest/CSV functions. |
| `src/lib/rsvp-token.server.ts` | HMAC token signing/verification for RSVP edit links. |
| `src/lib/admin.functions.ts` | Admin-only server functions (photos, activity, first-admin claim). |
| `src/lib/email/enqueue.server.ts` | Email queue logic. |
| `src/lib/email-templates/rsvp-confirmation.tsx` | RSVP confirmation email with edit link. |
| `src/routes/portal-ga-2026.tsx` | Admin sign-in page. |
| `src/routes/_authenticated/admin.tsx` | Admin dashboard (RSVPs + photos). |
| `src/routes/rsvp.tsx` | Public RSVP page. Note the `RSVP_OPEN` flag. |
| `src/routes/rsvp/edit.$token.tsx` | Signed-token RSVP edit page. |
| `src/routes/api/public/wedding[.]ics.ts` | iCalendar download endpoint. |
| `src/components/site/sections/` | All public homepage sections. |
| `src/styles.css` | Tailwind v4 theme, semantic tokens, custom utilities. |
| `AGENTS.md` | Lovable-specific guardrail: do not rewrite published git history. |

---

## 7. Never-do rules

- **Do not expose "Supabase" terminology to the end user.** Say "Lovable Cloud", "backend", "database", "auth", or "storage".
- **Do not create additional admin accounts or a public sign-up flow.** The app intentionally has one admin.
- **Do not change the admin URL** (`/portal-ga-2026`) unless the user explicitly asks.
- **Do not hardcode colors** (`text-white`, `bg-black`, `bg-[#...]`). Use the tokens in `src/styles.css`.
- **Do not use `src/pages/`.** TanStack Start uses `src/routes/`.
- **Do not import `*.server.ts` files into client components.** Only `*.functions.ts` are client-safe.
- **Do not put protected server functions in public route loaders.** Call them from components via `useServerFn` + `useQuery`, or keep them under `_authenticated/`.
- **Do not rewrite published git history.** No force-push, rebase, amend, or squash of commits already on `main`.
- **Do not add dependencies that only work on Node.js.** Server functions run in a Worker runtime; prefer pure JS, Web APIs, fetch-based clients, or WASM.
- **Do not leave placeholder content** on `src/routes/index.tsx`.

---

## 8. Git & branching workflow

**Policy:** Work directly on `main`. No feature branches, no dev branch, no pull requests.

**Why:** Lovable is connected to GitHub and syncs `main` bidirectionally. Any commit pushed to `main` appears in the Lovable editor, and any edit made in Lovable commits straight back to `main`. Branching and PRs add friction without benefit for this project.

**Rules for every AI assistant (Lovable, Claude Code, Cursor, etc.):**
1. Make sure you are on `main` before editing: `git checkout main && git pull`.
2. Make changes, commit them, and push directly to `main`.
3. Do not create `feat/*`, `dev`, or any other branch.
4. Do not open pull requests.
5. Never force-push, rebase, amend, or squash commits already pushed to `main`.
6. Keep `main` in a working state: run `bun run build:dev` before pushing if possible, and do not push broken code.

**Lovable sync note:**
- If you edit inside the Lovable UI, those commits go straight to `main` on GitHub.
- If you edit in Claude Code, Cursor, or another local editor, push to `main`; the changes will sync back to Lovable automatically.
- Because everyone writes to `main`, pull before you start and push frequently in small commits to reduce the chance of conflicts.


---

## 9. Recommended first steps for a new AI

Before writing or changing code:

1. Read this file (`ONBOARDING.md`) in full.
2. Read `AGENTS.md` for Lovable-specific git guardrails.
3. Read `src/lib/site.ts` and `src/lib/wedding-data.ts` to understand the data model.
4. Read `src/styles.css` to internalize the color/type tokens.
5. Run `git branch --show-current` and ensure you are on a feature branch, not `main`.
6. Run `bun run build` or `bun run build:dev` after any change to verify the project compiles.
7. If you touch RSVP, admin, or email logic, test the affected flow in the browser or via the existing server functions.

---

## 10. Reusable onboarding prompt

Paste the block below into any new AI conversation to bring it up to speed. It is intentionally concise and directive.

```text
You are continuing an existing Lovable/TanStack Start project: the Moreno Wedding 2026 website.

BEFORE you make any code changes, do the following:
1. Read ONBOARDING.md in the repo root.
2. Read AGENTS.md for git guardrails.
3. Read src/lib/site.ts and src/lib/wedding-data.ts.
4. Read src/styles.css to understand the color/type tokens.
5. Run `git branch --show-current`. You MUST be on a feature branch, not `main`, before editing. If you are on `main`, create and switch to `feat/<short-description>` first.
6. Read §3 of ONBOARDING.md (Remaining work / roadmap) and pick up the next uncompleted sprint rather than inventing new work.

PROJECT ESSENTIALS:
- Tech stack: TanStack Start v1, React 19, Vite 8, Tailwind CSS v4, TypeScript strict, Lovable Cloud (Supabase-backed but never say "Supabase" to users).
- Public site is a single scrolling page at src/routes/index.tsx composed of sections in src/components/site/sections/.
- Wedding data (schedule, registry, party, hotels, FAQ, story) lives in src/lib/wedding-data.ts.
- Copy lives in src/i18n/dictionaries.ts (en + es; Spanish needs proofreading).
- Admin sign-in is at /portal-ga-2026. There is intentionally only ONE admin account.
- Admin dashboard is at /_authenticated/admin.
- RSVP is at /rsvp; edit links use signed HMAC tokens at /rsvp/edit/$token.
- RSVP_OPEN = false in src/routes/rsvp.tsx currently disables real submissions.
- All app-internal server logic uses createServerFn from @tanstack/react-start.
- Public HTTP endpoints live under src/routes/api/public/.
- Do not use src/pages/. Do not import *.server.ts into client components.

DESIGN RULES:
- Palette: ivory #F8F4EC, ink #2A2520, lavender #8779A3, deep lavender #4C4066, tan #A39680, gold #D9C9A0, hairline #E1D6C3.
- Fonts: Cormorant (serif) + Work Sans (sans).
- No border radius except circular avatars. Mobile-first.
- Use semantic tokens from src/styles.css; never hardcode text-white, bg-black, or bg-[#...].
- Preserve the existing stationery/minimal aesthetic. Do not introduce generic AI gradients or Inter/Poppins defaults.

GIT WORKFLOW:
- Lovable syncs from `main`. Treat `main` as published/canonical.
- Do all work on feature branches (`feat/<name>`) and open PRs into `main`.
- Never force-push, rebase, amend, or squash commits already on `main` or any shared branch.
- After merging, changes sync back to Lovable automatically.

NEVER DO:
- Do not expose "Supabase" terminology to end users.
- Do not add multi-admin support or public sign-up.
- Do not change the admin URL unless explicitly asked.
- Do not rewrite published git history.
- Do not leave placeholder content on src/routes/index.tsx.

When you are ready to propose a change, explain it briefly, then implement it. After editing, run `bun run build` (or `bun run build:dev`) to verify the project compiles. If you touch RSVP/admin/email, test the affected flow.
```

---

*Last updated: July 2026. Keep this file current as the project evolves.*
