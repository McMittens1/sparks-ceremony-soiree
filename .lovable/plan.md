# Use direct-on-main workflow for all edits

## Goal

Document that this project does **not** use feature branches or pull requests. Every AI assistant — whether working inside Lovable, Claude Code, Cursor, or any other editor — works directly on `main` and pushes commits straight to `main`.

## Why

The user explicitly decided against setting up a dev branch or feature-branch workflow. The onboarding package previously recommended short-lived `feat/*` branches and GitHub PRs, which would mislead future agents. This plan removes those instructions and replaces them with a direct-on-main policy.

## Work to do

### 1. Rewrite `ONBOARDING.md` §8 — Git & branching workflow

Replace the existing section with a concise direct-on-main policy:

- `main` is the only branch.
- Lovable, GitHub, and external editors all read/write `main`.
- Every agent commits and pushes directly to `main`.
- Do not create `dev`, `feat/*`, or any other branch.
- Do not open pull requests.
- Keep `main` in a working state and never rewrite published history.

### 2. Update `ONBOARDING.md` §9 — Recommended first steps for a new AI

Remove the step telling the AI to check `git branch --show-current` and create a feature branch. Renumber the remaining steps and add a note pointing to §8.

### 3. Update `ONBOARDING.md` §10 — Reusable onboarding prompt

Edit the pasted prompt block so that:

- Step 5 no longer tells the AI to create a `feat/<short-description>` branch.
- The `GIT WORKFLOW` bullets state the direct-on-main policy.

### 4. Keep `AGENTS.md` unchanged

`AGENTS.md` already warns against rewriting published history and keeping the connected branch in a working state. That guidance is fully compatible with direct-on-main work, so no edit is needed.

## Out of scope

- No code changes.
- No feature flags, environment variables, or migrations.
- No branch creation or deletion.

## Verification

- `ONBOARDING.md` §8 states the direct-on-main policy and no longer mentions feature branches, PRs, or a `dev` branch.
- `ONBOARDING.md` §9 no longer instructs the AI to create a feature branch.
- `ONBOARDING.md` §10 reusable prompt matches the direct-on-main policy.
- `bun run build:dev` still passes (documentation-only change).
