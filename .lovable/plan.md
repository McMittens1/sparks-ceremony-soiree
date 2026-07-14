# Update onboarding docs to reflect direct-on-main workflow

## Goal

Remove all dev-branch and feature-branch instructions from the onboarding package. Document that every AI assistant — whether inside Lovable, Claude Code, Cursor, or any other editor — works directly on `main` and pushes commits straight to `main`.

## Why

The user explicitly decided against a dev-branch workflow. Keeping branch instructions in `ONBOARDING.md` and `.lovable/plan.md` would mislead future agents into creating branches and PRs, which the user does not want.

## Work to do

### 1. Rewrite `ONBOARDING.md` §8 — Git & branching workflow

Replace the current section with a short, direct policy:

- `main` is the only branch we use.
- Lovable, GitHub, and any external editor all read/write `main`.
- Every agent commits directly to `main`.
- Do not create `dev`, `feat/*`, or any other branches.
- Do not open pull requests.
- Keep `main` in a working state: run `bun run build:dev` before pushing if possible, and never rewrite published history (no force-push, rebase, amend, or squash of already-pushed commits).

### 2. Update `ONBOARDING.md` §9 — Recommended first steps for a new AI

Remove step 5 ("Run `git branch --show-current` and ensure you are on a feature branch"). Adjust the numbering of the remaining steps.

### 3. Update `ONBOARDING.md` §10 — Reusable onboarding prompt

Edit the pasted prompt block:

- Remove the instruction to check `git branch --show-current` and create a `feat/<name>` branch.
- Replace the `GIT WORKFLOW` bullets with a single direct-on-main policy:
  - Work directly on `main`.
  - Commit and push to `main`.
  - Never rewrite published git history.
- Keep the rest of the prompt intact.

### 4. Update `.lovable/plan.md`

Replace the current roadmap-expansion plan with a short plan that records the workflow decision:

- State that the project now uses a direct-on-main workflow.
- List the files to edit (`ONBOARDING.md` §8, §9, §10; `AGENTS.md` if needed).
- Note that no code changes are required.

### 5. Verify `AGENTS.md`

`AGENTS.md` only warns against rewriting published history and keeping the connected branch in a working state. That guidance remains correct for direct-on-main work, so no change is needed unless the user wants an explicit "work on `main` only" line added there too.

## Out of scope

- No code changes.
- No feature flags, environment variables, or migrations.
- No branch creation or deletion.

## Verification

- `ONBOARDING.md` no longer mentions feature branches, PRs, or a `dev` branch.
- `ONBOARDING.md` §10 reusable prompt matches the direct-on-main policy.
- `.lovable/plan.md` reflects the workflow decision.
- `bun run build:dev` still passes (documentation-only change).