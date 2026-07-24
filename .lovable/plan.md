# Plan: Reconcile Onboarding Docs with Reality + Standing Instruction for Future Sessions

## Goal
Make `ONBOARDING.md` and `HANDOFF.md` an accurate mirror of the live project as of today, then install a standing rule so every future session keeps them accurate as part of normal work — not as a separate chore.

---

## Part 1 — Deep verification pass (read-only, before any edits)

I'll verify every factual claim in `ONBOARDING.md` and `HANDOFF.md` against the actual codebase and live DB, not just the ones I've already checked. Categories:

1. **Live DB state** — re-query row counts for `guests`, `rsvps`, `guest_photos`, `user_roles`, `feature_flags`, `app_config`, and any table the docs reference. Confirm current flag values.
2. **Routes & auth** — walk `src/routes/` and confirm every route the docs mention still exists at the claimed path, and every route that exists is either documented or intentionally omitted.
3. **Server functions & gating** — verify each `*.functions.ts` gating claim (RSVP open, photo uploads, admin checks) by reading the actual handler.
4. **Email pipeline** — confirm sender domain, templates registered, masthead usage, unsubscribe route, and queue processor endpoint match docs.
5. **MCP tools** — list actual tools under `src/lib/mcp/tools/`, confirm each is auth-gated per the current `src/lib/mcp/index.ts`.
6. **Site constants** — `src/lib/site.ts` (URL, dates, deadline) vs. docs.
7. **Wedding data** — role counts (bridesmaids, groomsmen, ushers, kids), which members have real card copy vs. placeholders, `DAY_SCHEDULE` row count and contents.
8. **Feature flags** — every flag defined vs. every flag consumed (client + server); flag values in DB vs. docs.
9. **Build & lint state** — one `bun run build:dev` to confirm green.
10. **Roadmap accuracy** — cross-check the "remaining work" / sprint sections against what has actually shipped so completed items get moved out of the backlog.

Findings will be a delta list: for each doc claim, `MATCHES`, `STALE (correct to X)`, or `MISSING (add X)`.

## Part 2 — Rewrite the docs to match

Update `ONBOARDING.md` and `HANDOFF.md` in place with:

- Corrected live-data section (guests=0, rsvps=0, photos=0 today, with a note that this reflects pre-import state).
- Corrected `DAY_SCHEDULE` row count (6, not 7) and any other numeric drift found in Part 1.
- Roadmap trimmed of anything already shipped; anything discovered mid-refactor added.
- New timestamp + short "last verified against" note at the top of each doc so future sessions can tell at a glance whether the doc is fresh.

I will **not** touch design, features, or behavior in this pass. Docs only.

## Part 3 — Standing instruction for future sessions

Add a short, load-bearing rule to `AGENTS.md` (already loaded automatically by Claude Code / Cursor / this assistant on session start) that reads roughly:

> **Docs-are-code rule.** `ONBOARDING.md`, `HANDOFF.md`, and `.lovable/plan.md` are part of the deliverable. At the end of any turn that changes routes, server functions, DB schema, feature flags, wedding data, email pipeline, MCP tools, or completes a roadmap item, update the affected doc in the same turn. Never leave the docs describing a past state. If you can't tell whether a doc is stale, re-verify against the codebase/DB before asserting current state — do not trust the doc's own claims. Treat "the docs still say X" the same as "the code still does X": a bug.

Plus a shorter mirror in `.claude/settings.json` `session-start.sh` output so it's surfaced on every Claude Code session, and a one-liner reminder in the reusable onboarding prompt block already inside `ONBOARDING.md`.

I'll also give you a **paste-ready prompt** you can drop into any assistant's custom-instructions box that enforces the same rule plus the "work like a professional engineer on a live site" expectations:

- Verify current state before asserting it.
- Never ship changes to `main` without a build check.
- Never break RLS or the single-admin invariant.
- Preserve design decisions unless explicitly asked to change them.
- Keep docs in sync in the same turn as the code change.
- Small, reviewable, reversible changes.

## Part 4 — Story section note (holding, not part of this plan)

You floated either removing story photos or swapping them for generic engagement pics unless backgrounds are removed. I'll leave that decision open and address it in a separate follow-up once you've decided — it's a design change, not a doc-accuracy issue, and I don't want to bundle it with a verification pass.

---

## Out of scope for this plan

- Any code, design, or behavior change.
- Re-importing the 52 households (that's its own decision — needs your source data or confirmation you'll import via the admin CSV importer).
- Wedding-party copy, Spanish proofread, email deliverability test, mobile QA — all remain on the roadmap for later sprints.

## Deliverables

1. Updated `ONBOARDING.md` (accurate, timestamped).
2. Updated `HANDOFF.md` (accurate, timestamped).
3. Updated `.lovable/plan.md` roadmap (shipped items removed, current state reflected).
4. New "docs-are-code" rule appended to `AGENTS.md`.
5. Paste-ready custom-instructions prompt returned in chat for you to reuse in Claude Code / Cursor / ChatGPT / here.
6. Short summary of what was stale and what was corrected.