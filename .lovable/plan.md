# Read-Only Codebase Audit Report

## Summary
The codebase is unusually clean for a project this size. RSVP gating, countdown breakpoints, feature flags, and the design-token CSS are all deliberately centralized and heavily commented to prevent the kind of drift this audit was asked to find. No dead application files, no duplicate components/logic, no contradictory Tailwind/CSS, no stale RSVP or countdown code, and every feature flag is wired to real behavior on both client and server. The only "unused" code is the standard shadcn/ui component library, which is expected boilerplate.

## Critical/High Findings
None found.

## Moderate Findings
None found.

## Low Findings

**1. Large, feature-dense files — `src/lib/rsvp.functions.ts` (~1425 lines) and `src/routes/rsvp.tsx` (~1312 lines)**
- Severity: low
- Evidence: `rsvp.functions.ts` contains ~15 top-level helpers (validation, rate limiting, CSV import/export, verification, write path) in one module; `rsvp.tsx` renders the entire lookup/verify/party/extras/address flow in one component tree.
- Why it matters: not a correctness bug — every helper checked (`normalizePhone`, `isValidPhone`, `parseCsv`, `planImportRows`, etc.) is single-purpose and non-duplicated. Size just makes future review/refactor slower and increases merge-conflict surface.
- Suggested fix (optional): split CSV import/export and rate-limiting helpers out of `rsvp.functions.ts` into sibling modules. Defer until a real refactor lands nearby.

**2. `TemplateEntry.component: ComponentType<any>` — `src/lib/email-templates/registry.ts:14`**
- Severity: low
- Evidence: the field is typed `any` because the registry is heterogeneous and props are decoded from runtime JSON; a comment above the line explains this.
- Why it matters: loosens type safety for email template props, but the tradeoff is documented and the registry has 3 real entries — right-sized, not over-engineered.
- Suggested fix: none needed; documented deliberate tradeoff.

## No Issues Found

- **Duplicate components / duplicated logic** — No parallel implementations. Section components (`HeroSection`, `CountdownSection`, `StorySection`, etc.) are single-purpose and non-overlapping. Typography primitives in `src/components/site/typography.tsx` (`Eyebrow`, `DisplayHeading`, `Subhead`, `BodyProse`) each have 2+ real call sites — genuine compression, not speculative abstraction.
- **Dead / unreferenced application files** — Every file under `src/components/site`, `src/lib`, `src/hooks`, `src/i18n` is referenced by at least one other module. No orphaned application code.
- **Contradictory Tailwind / CSS** — `src/styles.css` (~454 lines) has no duplicate keyframes or selectors. The only `!important` rules are two narrowly-scoped, intentional ones (`.mobile-menu-*` hidden above `md`, and the `prefers-reduced-motion` block). Custom tokens in `@theme inline` (`--color-ink`, `--color-lavender`, etc.) are all consumed via `text-*`/`bg-*` utilities. The `.rs-stack*` responsive grid contract is documented and matches the breakpoints actually used (640/768/1024).
- **Stale RSVP logic or copy** — `SITE.rsvpDeadline` / `rsvpDeadlinePretty` (`src/lib/site.ts:30-36`) are read wherever the deadline is shown (`rsvp.tsx:36,452`, `rsvp.functions.ts:631,879`). The `rsvp_open` flag gates identical UI and server paths (client: `rsvp.tsx:768-775,1043-1052,1157-1166`; server: `rsvp.functions.ts:683`), with the address-update path explicitly and correctly excluded from the gate on both ends. No references to removed fields.
- **Stale countdown logic / breakpoint behavior** — `src/components/site/Countdown.tsx:24-25` defines `COUNTDOWN_HERO_VISIBLE = "lg:hidden"` and `COUNTDOWN_SECTION_VISIBLE = "hidden lg:block"` as the single source of truth. `HeroSection.tsx:141` and `CountdownSection.tsx:9` both import these constants instead of hardcoding breakpoints. Hero image visibility (`HeroSection.tsx:32,150`) uses the same `lg` boundary, so hero-image ↔ countdown handoff is aligned.
- **Feature flags vs. rendered behavior** — Three flags exist end-to-end and are each read where expected: `show_ushers` (`WeddingParty.tsx:12`), `guest_photo_uploads` (client `PhotosSection.tsx:14`, server `photos.functions.ts:34`), `rsvp_open` (client `rsvp.tsx:155`, server `rsvp.functions.ts:683`). No defined-but-unread flag, no hardcoded true/false, no UI that ignores a disabled flag.
- **Unnecessary / misleading / overly complicated abstractions** — `Reveal.tsx`, `use-active-section.ts`, the typography primitives, `isFeatureEnabled`, and the MCP tools registry (`src/lib/mcp/index.ts`) each have multiple real consumers or an explicit single-source-of-truth rationale. No prop-forwarding wrappers or single-entry "config" objects found.

## Positive Findings
- Extensive in-code comments proactively document *why* shared constants exist and reference the past bug they prevent (e.g. the `COUNTDOWN_HERO_VISIBLE` / `COUNTDOWN_SECTION_VISIBLE` comment naming the earlier breakpoint-drift incident; the `rsvpDeadlinePretty` comment mirroring `eventDatePretty`).
- `SITE` in `src/lib/site.ts` is a genuine single source of truth for dates, URLs, and copy fallbacks — no re-typed dates or URLs elsewhere.
- Server-side and client-side flag/deadline checks are kept in lockstep by design ("gated by rsvp_open, same as the party section" comments).
- `src/components/ui/*` shadcn library is cleanly separated from application code; the 34-of-43 unused entries are expected scaffolding, not technical debt.

## Overall Recommendation
No cleanup action required. The two low-severity items (large RSVP files, `any` in the email template registry) are optional readability improvements, not defects, and can be deferred indefinitely without risk. Continue building against the current structure.

## Final Verdict
**Clean**
