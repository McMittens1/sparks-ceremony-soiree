# Expand onboarding package with a comprehensive sprint roadmap

## Goal

Replace the short "Remaining work / roadmap" list in `ONBOARDING.md` with a detailed, prioritized sprint plan that captures every known piece of unfinished work — not just the four items previously listed — so any future AI assistant can pick up exactly where the project left off.

## Why now

The current `ONBOARDING.md` only lists four backlog items (performance, analytics, email branding, Spanish proofread). From inspecting the codebase, several larger features are still disabled or placeholder-level:

- `RSVP_OPEN = false` in `src/routes/rsvp.tsx` — the entire RSVP flow is in preview mode.
- `PhotosSection.tsx` has a disabled upload form and no live approved-photo gallery.
- Transactional emails (`rsvp-confirmation.tsx`) use generic hardcoded styling, not the stationery brand.
- Spanish copy exists but is marked as needing a native-speaker proofread.
- No analytics or performance tooling is installed yet.

A future assistant needs a single source of truth for what is actually left to do.

## Work to do

### 1. Audit remaining work and organize it into sprints

Review the following areas and confirm what is shipped vs. what is still pending:

- Public homepage sections (`src/components/site/sections/`)
- RSVP flow (`src/routes/rsvp.tsx`, `src/routes/rsvp/edit.$token.tsx`, `src/lib/rsvp.functions.ts`)
- Guest photo upload/gallery (`src/components/site/sections/PhotosSection.tsx`, `src/lib/photos.functions.ts`, `src/lib/admin.functions.ts`)
- Admin dashboard (`src/routes/_authenticated/admin.tsx`)
- Email templates (`src/lib/email-templates/`)
- i18n Spanish copy (`src/i18n/dictionaries.ts`)
- Performance/analytics (package.json, build output, no current tooling)
- SEO/social metadata (`src/routes/index.tsx`, `src/routes/__root.tsx`)

### 2. Rewrite `ONBOARDING.md` §3 as a detailed sprint roadmap

Replace the current four-item list with a sprint-style plan. Each sprint should include:

- Sprint name and goal
- Scope (what is in and what is out)
- Acceptance criteria (when is it done)
- Key files involved
- Dependencies/blockers
- Estimated priority order

Proposed sprints (subject to refinement during implementation):

#### Sprint 1 — Content & Copy Freeze
- Final copy review of all public sections against `src/lib/wedding-data.ts` and `src/i18n/dictionaries.ts`.
- Native-speaker proofread of the Spanish (`es`) dictionary.
- Verify dates, venue address, schedule, registry links, and contact info in `src/lib/site.ts`.
- Add any missing wedding party photos or notes in `src/lib/wedding-data.ts`.
- Acceptance: all copy is final and both languages read naturally.

#### Sprint 2 — RSVP Launch Readiness
- Change `RSVP_OPEN` from `false` to `true` in `src/routes/rsvp.tsx`.
- Import the real guest list via the admin CSV import or a seed migration.
- End-to-end test lookup, submit, edit-token, and confirmation email flows.
- Verify admin dashboard counts, filters, and CSV export.
- Acceptance: a guest can look up their name, submit, edit, and receive a branded confirmation email.

#### Sprint 3 — Guest Photo Upload & Public Gallery
- Wire the disabled `PhotosSection.tsx` form to the existing upload server function.
- Build a public gallery that displays approved photos from the backend.
- Test the admin approve/reject/delete workflow and mobile upload.
- Acceptance: guests can upload from the public site; approved photos appear in the gallery.

#### Sprint 4 — Performance & Analytics
- Audit images for lazy loading, sizing, and format (engagement photos, venue photos, party portraits).
- Run a bundle-size check and remove unused dependencies if any.
- Add lightweight, privacy-friendly event tracking for RSVP submissions, photo uploads, calendar clicks, and registry clicks.
- Acceptance: no layout shift from images, bundle size is reasonable, and key events are trackable.

#### Sprint 5 — Email Branding & Template Polish
- Apply the stationery design tokens (ivory, ink, lavender, Cormorant/Work Sans) to `rsvp-confirmation.tsx` and other transactional templates.
- Ensure email preview data matches real content.
- Test rendering in common clients.
- Acceptance: confirmation emails look on-brand and display correctly on mobile and desktop.

#### Sprint 6 — Pre-Launch QA
- Accessibility audit (form labels, focus states, color contrast, alt text).
- SEO/social metadata review (title, description, og:image, canonical, twitter card) on every route.
- Cross-device testing at 440px and 1280px.
- Final admin workflow verification (first-admin claim, sign-in, sign-out).
- Acceptance: site passes manual QA and is ready to publish.

#### Sprint 7 — Post-Wedding
- Reopen or keep photo uploads live for guests after the event.
- Curate and approve batch-uploaded photos from the wedding day.
- Optionally add a thank-you note or recap section to the homepage.
- Acceptance: post-event gallery is live and manageable from the admin dashboard.

### 3. Update `.lovable/plan.md`

Replace the previous onboarding/Git-workflow plan with this expanded roadmap plan, so Lovable's internal plan file stays in sync with `ONBOARDING.md`.

### 4. Update the reusable onboarding prompt

Add a line to the reusable prompt in `ONBOARDING.md` §10 instructing the AI to read the sprint roadmap in §3 before choosing what to work on.

### 5. Review for consistency

- Ensure sprint names and file paths in the roadmap match the actual codebase.
- Keep the tone and format consistent with the rest of `ONBOARDING.md`.
- Verify no placeholder language remains in the new sections.

## Out of scope

- Actually implementing any of the sprints (this plan is documentation only).
- Changing application code, feature flags, or environment variables.
- Creating Git branches or opening PRs.

## Verification

- `ONBOARDING.md` contains a new §3 with detailed sprint descriptions.
- `.lovable/plan.md` reflects the expanded roadmap.
- The reusable prompt references the sprint roadmap.
- `bun run build:dev` still passes (documentation-only change should not affect build).
- No broken internal links or duplicated content.
