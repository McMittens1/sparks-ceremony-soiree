# Next step: seed project memory + pick the next execution wedge

## 1. Seed project memory (recommended)

Yes — the standing rules in `AGENTS.md` are exactly the kind of thing that should live in `mem://` so every future session applies them automatically instead of rediscovering them from files.

Planned memory files:
- `mem://index.md` — Core rules distilled from `AGENTS.md`:
  - Docs-are-code: update `ONBOARDING.md`, `HANDOFF.md`, `.lovable/plan.md` on every material change.
  - Verify current state before asserting it (DB query / file read).
  - Work directly on `main`; no branches, no PRs.
  - Single-admin invariant: no public sign-up, no multi-admin, no renaming `/portal-ga-2026` URLs.
  - RLS + GRANTs on every new public table; admin functions use `requireSupabaseAuth` + `ensureAdmin()`, not `supabaseAdmin`.
  - No hardcoded colors/fonts/domains; use `src/styles.css` tokens and `SITE.siteUrl`.
  - Preserve load-bearing design decisions (card system, stationery aesthetic, categorical rarity).
  - Small reversible diffs; never broad `eslint --fix`.
  - Gate features on both client and server.
  - Verify with `bun run build:dev` and Playwright screenshots (440 / 1280) before claiming done.
- `mem://reference/onboarding-prompt` — the reusable assistant prompt already drafted, so it can be pasted into any future agent's custom instructions.
- `mem://design/tokens` — pointer to `src/styles.css` and the no-hardcoded-colors rule.
- `mem://security/single-admin` — obscure URLs, first-admin claim, RLS policy shape.
- `mem://ops/email` — `notify.morenowedding2026.com`, templates location, send-log verification rule.
- `mem://content/wedding-party` — placeholder status and the categorical-rarity design constraint.
- `mem://content/story-photos` — pending decision (remove / generic / cutouts).

## 2. Verified current state (today)

- `guests`: 0, `rsvps`: 0, `guest_photos`: 0, `email_send_log`: 39.
- Feature flags: `rsvp_open = true`, `guest_photo_uploads = false`, `show_ushers = false`.
- 1 admin claimed.
- `DAY_SCHEDULE`: 6 rows.
- Build was clean at last verification.

This matches the docs after the last sync pass, so the docs are currently accurate.

## 3. Choose the next execution wedge

The top roadmap items that are *blocked on you* are:
- #1 Re-import household CSV (needs the couple's guest list).
- #2 Wedding-party personalization copy (needs the couple's writing).

The unblocked, high-impact items are:
- #3 Story section photo decision.
- #5 Live cross-device visual QA at 440px / 1280px.
- #7 Sprint 4 engineering hygiene (bundle, webp/srcset, minimal analytics).
- #6 Spanish proofread (defer until copy is frozen).

### Recommended: Wedge A — "Story photos + visual QA"

This unblocks the homepage's biggest visible content gap and uses Playwright to catch any regressions before launch.

1. Decide the Story section photo strategy with you:
   - (a) Remove all Story photos.
   - (b) Use generic engagement photos.
   - (c) Use background-removed cutouts (like the hero pencil portrait).
2. Implement the chosen approach in `src/components/site/StoryTimeline.tsx` and `src/lib/wedding-data.ts` if needed.
3. Run a full visual QA sweep at 440px and 1280px across every section (Hero, Story, Day, Travel, Registry, FAQ, Party, Photos, Footer).
4. Fix any layout regressions or overflow found; re-screenshot to verify.
5. Update `ONBOARDING.md`, `HANDOFF.md`, and `.lovable/plan.md` with the decision and QA results, bumping "Last verified".

### Alternative: Wedge B — "Sprint 4 engineering hygiene"

1. Bundle-size audit (`bun run build` analyzer or manual chunk inspection).
2. Add responsive `srcset` + WebP conversion for engagement/venue/party photos.
3. Add minimal analytics events: RSVP submit, photo upload, calendar click, registry click.
4. Update docs with performance numbers and event list.

### Alternative: Wedge C — "Spanish proofread"

1. Native-speaker pass over `src/i18n/dictionaries.ts`.
2. Keep English as source of truth; Spanish should not invent copy that doesn't exist in English.
3. Update docs when complete.

## 4. Out of scope

- Re-importing the household CSV or writing wedding-party copy (waiting on couple-provided content).
- Multi-admin, public sign-up, new post-wedding features.

## Decision needed

Approve **memory seed + Wedge A**, or tell me to swap to Wedge B or C.