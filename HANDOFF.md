# Handoff — Moreno Wedding 2026 Website

Written at the end of a development session that took this project from "RSVP disabled, no feature flags, generic wedding-party avatars" to "RSVP + photo uploads live behind a real feature-flag system, a from-scratch collectible-card wedding party section, and a full pre-launch QA pass." This document is for whichever AI picks the project up next. Read `ONBOARDING.md` too — it's the structured reference (sprint plan, file table, never-do rules); this document is the narrative: why things are built the way they are, what almost went wrong, and what to watch out for. If the two ever disagree, trust `ONBOARDING.md` for current state and this file for reasoning — and if you finish reading this and it feels stale, fold whatever's still true into `ONBOARDING.md` and archive or delete this file rather than let two sources of truth drift apart.

**You will be doing all work directly on the `main` branch.** No feature branches, no PRs — every session on this project, including this one, commits and pushes straight to `main`. See `ONBOARDING.md` §8 for the full policy and why it matters here specifically.

---

## 1. Project summary

A wedding website for Geovanni Moreno and Addison Hillman (wedding: October 10, 2026, Sparks' Barn, Louisville, NE), built on TanStack Start v1 + React 19 + Tailwind v4, hosted on Lovable Cloud (Supabase-backed — never say "Supabase" to the user, they don't know the plumbing and don't need to). It's a single long scrolling homepage plus an RSVP flow, a guest photo-upload feature, and a single-admin dashboard. Custom domain: `morenowedding2026.com`.

As of this handoff: the site is feature-complete for launch except for two things only the couple can do — write real personalization copy for the wedding party cards, and provide the real guest list. Both `rsvp_open` and `guest_photo_uploads` are currently **off** in the live database (verified by direct query, not assumed), waiting on that content/data.

---

## 2. Current architecture

**Routing:** TanStack Start file-based routing under `src/routes/`. One long public homepage (`index.tsx`) composed of section components (`src/components/site/sections/`), plus `/rsvp`, `/rsvp/edit/$token`, `/portal-ga-2026` (admin sign-in — deliberately obscure URL, not linked from anywhere public), and `/_authenticated/admin` (the dashboard, gated by an auth + admin-role route guard).

**Data:** Postgres via Lovable Cloud/Supabase. Tables: `guests`, `rsvps`, `guest_photos`, `feature_flags`, `user_roles`, plus email infrastructure (`email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`). Static content (schedule, registry, wedding party roster, hotels, FAQ, story timeline) lives in `src/lib/wedding-data.ts`, not the database — it's edited as code, and the same file backs both the website and an MCP server the couple can query directly.

**Auth:** Supabase Auth, single admin account. First person to sign in at `/portal-ga-2026` becomes admin (`claimAdminIfFirst`). No public sign-up, ever — this is intentional, not an oversight, don't "fix" it into a multi-user system.

**Feature flags:** a `feature_flags` table (`key`, `enabled`, `updated_at`) plus `src/lib/feature-flags.functions.ts` (server functions) and `src/hooks/use-feature-flags.ts` (client hook). The admin Features tab uses a **draft → confirm → save** UX (toggle a switch, it stages a change; nothing hits the server until you click Save and confirm a diff of what's about to change) — this was an explicit design ask from the couple, not a default pattern, so preserve it if you touch that panel. Two flags exist today: `rsvp_open`, `guest_photo_uploads`.

**The Wedding Party "collectible card" system** — the biggest single feature built this session, worth understanding in full:
- Groomsmen + Best Man render as `GroomsmanCard.tsx` — a Pokémon/sports-card-style trading card with a CSS 3D flip (front: photo, name, rarity tier, "tap to flip" hint; back: 3–4 stat attributes and one "signature move" ability box, styled like a TCG attack box). Built with `aria-hidden` toggling per face and `prefers-reduced-motion` support.
- Bridesmaids + Maid of Honor render as `MagazineCover.tsx` — a full-bleed editorial magazine cover under an original masthead, "SPARKS." (a nod to the venue, Sparks' Barn — deliberately not a copy of a real magazine). No flip; personality content (headline + subline) prints directly on the cover instead. This was a deliberate genre choice, not a missing feature — see §5.
- Both components use the exact same footprint, 232×388px, and the exact same "scale multiplier" implementation pattern: a `BASE_WIDTH`/`BASE_HEIGHT` constant, a `scale` prop, and a local `s(px) => px * scale` helper that every pixel value (padding, font sizes, everything) derives from. If either component needs a differently-sized instance, use `scale` — never fork a "big version" of the component.
- Both have a "this one is special" variant — `legendary` on `GroomsmanCard` (the Best Man), `collectorsEdition` on `MagazineCover` (the Maid of Honor) — and both use the same underlying principle: a categorical color inversion (light ground → dark/rich ground, text colors following), not just a size bump. This took two iterations to get right — see §7's lessons-learned.

**SEO:** every route's `head()` builds through `buildMeta()` (`src/lib/seo.ts`), which returns a complete `{ meta, links }` set (title, description, og:*, twitter:*, canonical) from one call. `robots.txt`/`sitemap.xml` exist in `public/`. Everything derives its absolute URL from `SITE.siteUrl` (`src/lib/site.ts`) — this one constant was briefly wrong (see §7) and now cascades correctly everywhere.

---

## 3. Design philosophy

The site's stated visual direction is "stationery-inspired, warm, minimal" — ivory paper, ink type, lavender and tan accents, Cormorant serif + Work Sans sans, no border radius except circular avatars, deliberately not the generic-AI-app look (no purple/indigo gradients, no Inter/Poppins-as-default). This was true before this session and remains the load-bearing constraint on every visual decision.

Two design principles were established or reinforced this session, worth internalizing before making UI calls:

**Categorical differentiation over quantitative differentiation.** When something needs to read as "the special one" among otherwise-identical siblings, changing its *finish* (color scheme, background, texture) reads as genuinely rare/different; changing only its *size* reads as "the same thing, but bigger" — this was explicit, repeated user feedback on the Best Man card's first iteration. Real trading cards signal rarity with holofoil/reverse-color treatments, never bigger physical dimensions (every card in a real deck is the same size). Apply this any time a "featured/premium/special" UI element is requested.

**Pairing sections should feel like siblings, not clones.** The Groomsmen trading cards and Bridesmaids magazine covers needed to "complement" each other (explicit ask) without "feeling repetitive" (also explicit). The solve was: same footprint, same conceptual genre (collectible/editorial print objects), completely different visual grammar within that genre (bordered game card vs. full-bleed cover). If asked to extend this pattern to a third group (parents, officiants, etc.), don't reskin one of the two existing components — find a third genre that's still recognizably part of the same "collection."

A meta-point on process: this project's owner cares about *why*, not just *what*. Several times this session, brainstorming multiple concepts and presenting tradeoffs against explicit criteria (via a rendered visual comparison, not just prose) got a much better outcome than jumping straight to one implementation. When a request has real aesthetic/design stakes and more than one reasonable approach, that comparison step is worth the extra turn.

---

## 4. Established coding patterns

- **Flag-gate client AND server, always.** A UI-only gate (disabling a form) is a UX nicety; the actual enforcement has to be a server-side re-check of the same flag inside the `createServerFn` handler. `isRsvpOpen()` in `rsvp.functions.ts` and `isGuestPhotoUploadsOpen()` in `photos.functions.ts` are the two examples — small, local, single-purpose functions that query `feature_flags` directly, not a shared abstraction. Follow that same shape for any new flag-gated function; don't introduce a generic "checkFlag(key)" utility unless a third call site makes the duplication actually painful.
- **Scale-multiplier components, not size variants.** See §2's card-system description. This is the established way to make one component render at multiple sizes in this codebase.
- **`useState`/`useEffect` for lightweight client-fetched state, not TanStack Query — except when the surrounding code already uses Query.** `useFeatureFlag` is a small hook, not a Query-backed loader, even though a `QueryClient` exists in the app and is used elsewhere for route loader data. Match whichever pattern already surrounds the code you're touching rather than "correcting" it toward consistency — this codebase has both patterns live on purpose (or at least, changing that isn't this session's call to make).
- **Design tokens, no hardcoded hex.** `text-tan-deep` not `text-[#6B5F49]`, ever, in new code. The one sanctioned exception is CSS gradient/shadow values Tailwind utilities can't express directly (e.g. `GroomsmanCard.tsx`'s hover sheen), which use `rgba(...)` approximations of the token colors with a comment explaining why — follow that exact precedent (approximate the token, comment why) rather than inventing a new hardcoded color.
- **Absolute URLs derive from `SITE.siteUrl`, never a literal domain string.** See §7 for why this matters more than it sounds like it should.
- **Contrast: `-deep` tokens for anything functional, light tokens for pure decoration only.** See `ONBOARDING.md` §4 for the exact rule; it was applied as a deliberate sweep this session, not case-by-case guessing.
- **Small, surgical diffs; never run `eslint --fix` broadly.** This codebase has a large amount of pre-existing Prettier formatting debt (~2,400 lint findings, almost entirely `prettier/prettier`, none of it touched this session beyond lines actually edited). Running `--fix` on a whole file reformats far more than intended — this happened once this session on `wedding-data.ts` and had to be reverted via `git checkout HEAD -- <file>` and reapplied by hand. If you touch a file with a small change, verify via `git diff` that your diff stayed small; if `--fix` or a linter auto-touches unrelated lines, revert and redo it surgically.

---

## 5. Important implementation details

- **RSVP flag vs. RSVP edit-by-token: an intentional asymmetry.** `submitRsvp` (new RSVPs) checks `isRsvpOpen()`; `updateRsvpByToken` (editing an existing RSVP via a private signed link) does not, and never has. This was flagged during this session's final audit as a possible gap and deliberately left as-is: the token itself is the real security boundary (HMAC-signed, 90-day expiry, unguessable), and a guest who already RSVP'd should reasonably be able to fix a typo or update a meal choice even if the couple has since paused new sign-ups. If this is ever wrong, it's a product call the couple should make explicitly, not something to "fix" by matching `submitRsvp`'s behavior on autopilot.
- **The Wedding Party section's personalization content is almost entirely placeholder.** Every card/cover component has a documented placeholder-fallback contract (`Add {name}'s headline here.` etc.) specifically so the site renders acceptably before real copy exists — this is working as designed, not broken. But as of this handoff, only the Best Man has a real field set (`cardRarity: "Legendary"`); all 6 bridesmaids, the Maid of Honor, and all 8 groomsmen are showing fallback text live. This is the single most visible piece of unfinished work on the site right now, and it needs the couple's own writing (jokes, inside references) — an AI shouldn't invent it.
- **The guest list is not real yet.** `guests` has exactly 1 row (test data), matched by 1 row in `rsvps`. `rsvp_open` being off is directly downstream of this — there's no point opening RSVP to a guest list of one. Importing the real list (via the admin CSV import, which dedupes correctly by email/phone) is a prerequisite to flipping that flag, not just a nice-to-have.
- **`.env` stays tracked in git.** Earlier in this project's life, `.env` was untracked as a security-hygiene improvement and it broke production, because `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` are injected differently than `SUPABASE_SERVICE_ROLE_KEY` in this Lovable project — the former aren't auto-injected the way the latter is. That change was reverted. Don't re-attempt it without first confirming, with actual evidence, exactly how each env var gets into the running app.
- **A `SessionStart` hook now exists that may change your sandbox experience entirely.** `.claude/hooks/session-start.sh` + `.claude/settings.json` were added by a different session (merged via a PR — see §6) partway through this one. It works around `bun.lock` pinning every package to a private registry mirror that some sandboxes' network policy blocks, by temporarily dropping the lockfile, installing against public npm, then restoring the lockfile untouched. **This session ran almost entirely unable to `bun install`, boot a dev server, or get a clean `tsc`/`eslint` run** — that limitation was worked around all session with static code review, Explore-agent audits, and a Lovable screenshot tool that only showed above-the-fold content. Near the very end of this session, the hook was run manually and it worked completely: a from-scratch `bun install` succeeded, `tsc --noEmit` went from ~90 noisy errors to 0, and `vite build` succeeded end-to-end. **If you're a fresh session in this same sandbox type, the hook should already have run automatically at your session start — verify dependencies actually resolve before assuming you're stuck with the same limitations this session had.** If they don't, try running the script manually (`CLAUDE_PROJECT_DIR=$(pwd) bash .claude/hooks/session-start.sh`) before concluding the sandbox can't build.
- **That real dependency install surfaced 5 genuine, previously-invisible pre-existing bugs**, now fixed: every `<Link to="/rsvp">` in the codebase (`Header.tsx` ×3, `FaqSection.tsx`, `HeroSection.tsx`, `rsvp/edit.$token.tsx`) either passed `search={{}}` or omitted `search` entirely, neither of which structurally satisfies `/rsvp`'s `validateSearch` return type (`{ g: string | undefined }`). Fixed to `search={{ g: undefined }}` everywhere. Worth knowing: this had been silently broken (type-wise) for a while, masked by the sandbox's missing-package noise looking similar enough to ignore. If you ever see a wall of "cannot find module" errors again, don't assume every error in the list is that same noise — grep for errors NOT matching a missing-package pattern before dismissing the whole list.

---

## 6. Remaining priorities (ranked)

1. **Write real wedding-party personalization copy** (`coverHeadline`/`coverSubline` for 7 people, `cardAttributes`/`cardAbility` for 8) — blocks the Wedding Party section from feeling finished. Needs the couple, not an AI.
2. ~~Import the real guest list, then flip `rsvp_open` on.~~ **Done as of 2026-07-17** — `guests` has 52 real rows, `rsvp_open` is live. See ONBOARDING.md §2 for the current snapshot (verify live before trusting any snapshot).
3. **Get real wedding-party photos** per the specs already given (background-removed, 232×388 for magazine covers; ratio 3:4 for the general avatar convention), then flip `guest_photo_uploads` on whenever the couple wants uploads open.
4. **Live cross-device visual QA at 440px/1280px** — genuinely never done with a real browser this whole project. If your sandbox can boot a dev server (see §5's hook note), this is the highest-value QA task left; nothing in this codebase has had real visual confirmation beyond static code review and a hero-only screenshot tool.
5. Sprint 4 (Performance & Analytics) — not started at all.
6. Spanish dictionary proofread — flagged since early in this project's life, still untouched.
7. Lower-priority QA items documented in `ONBOARDING.md` §3 Sprint 6 (session-expiry UX, the admin-claim TOCTOU race) — real but low-risk, intentionally deferred.

---

## 7. Current sprint status

See `ONBOARDING.md` §3 for the full sprint-by-sprint breakdown with acceptance criteria and key files. Short version:

| Sprint | Status |
|---|---|
| 1 — Content & Copy Freeze | ⚠️ Data model done, content almost entirely outstanding |
| 2 — RSVP Launch Readiness | ✅ Live — real guest list imported (52 households), `rsvp_open` is on |
| 3 — Guest Photo Upload | ✅ Done; off pending the couple's choice to open it |
| 4 — Performance & Analytics | ⬜ Not started |
| 5 — Email Branding | ✅ Done |
| 6 — Pre-Launch QA | ⚠️ Accessibility/SEO/`.ics`/admin-auth done; live visual QA and a couple of low-risk items remain |
| 7 — Post-Wedding | ⬜ Not started (blocked on the wedding happening) |

---

## 8. Future roadmap

Beyond the sprint plan: no major new feature was requested or implied as "next" by the couple. The site is deliberately scoped to launch, not to accumulate speculative features. Resist inventing scope (a guest book, a seating chart, a livestream embed, etc.) unless explicitly asked — this project's owner has been specific and intentional about what they want at every step, and "make a reasonable call and keep going" should mean picking up the next *documented* sprint item, not improvising new ones.

If the couple does extend the Wedding Party card system to a new group (parents, officiant, etc.), see §3's "siblings, not clones" principle before building anything.

---

## 9. Cautions and lessons learned

- **A subagent-driven implementation pass can silently over-reach its instructions in small ways.** During the QA pass, one delegated fix correctly added a `TAN_DEEP` color constant and applied it to a form's underline border in `rsvp.tsx`, but the identical twin file `rsvp/edit.$token.tsx` was missed for the same fix — caught only by an explicit before/after diff review across both files during verification, not by trusting the subagent's own "done" summary. Always independently re-derive what "done" should look like (grep for the pattern across every file it should apply to) rather than trusting a summary at face value, especially for mechanical sweeps meant to apply consistently across a codebase.
- **A tool-call denial isn't always a signal to stop asking questions forever — read the specific denial in context.** One `AskUserQuestion` call (about cover-sizing proportions) was denied by the user; the reasonable read was "just decide, don't make me answer every micro-question," and the session proceeded to make well-reasoned unilateral calls on subsequent small decisions. A later, more consequential question (which literal production domain to standardize on, with real SEO stakes and genuinely ambiguous evidence pointing two different directions) was asked anyway and answered directly — the denial didn't generalize into "never ask again," it generalized into "the earlier question wasn't worth asking." Calibrate per-decision: stakes, ambiguity, and whether you have enough evidence to make a confident call are what matter, not a blanket rule either way.
- **When a background implementation agent reports success, verify the actual diff before believing "no regressions."** This session caught two real, if minor, self-introduced issues this way: an `eslint --fix` that reformatted unrelated pre-existing code (reverted, redone surgically), and the missing `edit.$token.tsx` fix mentioned above. Neither would have been caught by reading a summary alone.
- **Don't assume a description of "already built" work is still accurate — verify against the live database, not just the code.** The RSVP and photo-upload features were described mid-session as "done," which was true of the code but not the full picture: the actual production feature-flag values were both `false` and the guest list was still test data. A code-only review would have missed this; a direct DB query didn't.
- **Sandbox limitations are not always permanent — re-test them rather than carrying them forward as assumed facts.** This entire session operated under the assumption that `bun install`/a real dev server were unavailable, right up until the very end, when they turned out to be fixable in about 15 seconds once a hook (added by someone else, mid-session) was actually run. If a "known limitation" from earlier context hasn't been re-verified recently, don't repeat it as fact — check.
- **`bun install`/`tsc`/`vite build` working in a sandbox does NOT mean a live dev server can reach production.** Confirmed directly (2026-07-17): this sandbox has no `RSVP_EDIT_SECRET` in its process env (only `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` are in the tracked `.env`), and a direct `curl` to the Supabase REST endpoint gets a 403 from the outbound proxy — so a real `bun run dev` here can't sign RSVP tokens or reach the live database at all. The Lovable `query_database`/`get_project` MCP tools *do* work (they're routed through Lovable's own infra, not this sandbox's direct egress), and are the reliable way to verify live data/config from here. Don't assume a browser-driven E2E test against the real RSVP flow is possible from this sandbox without re-checking both of these first.
