# Update onboarding package with Git branching workflow

## Answers to your questions

1. **Will Claude Code changes sync back to Lovable?**
   Yes. Lovable has two-way GitHub sync on the connected branch (currently `main`). If Claude Code commits to a feature branch, opens a PR into `main`, and you merge it, the merged changes appear in Lovable automatically.

2. **Should you wait for the dev branch before I recreate the plan?**
   No. The branch creation is a one-time setup step you perform outside Lovable (I cannot run stateful git commands). The onboarding package should document that setup so any future AI knows the workflow before touching code.

## Recommended branching model

- Keep Lovable connected to `main`.
- Treat `main` as the published/canonical branch.
- Do all Claude Code / external-AI work on short-lived feature branches (`feat/<name>`) that merge into `main` via GitHub PR.
- Small edits made directly inside Lovable can still go straight to `main`; Lovable’s version history covers rollback for those.
- Never force-push, rebase, amend, or squash commits already on `main`. Use normal merge or squash-on-merge via the GitHub PR UI only.

## Work to do

1. **Add a Git & Branching Workflow section to `ONBOARDING.md`**
   - Explain the one-branch sync limitation.
   - Document the `feat/<name>` → PR → `main` → Lovable sync flow.
   - Include the one-time setup commands:
     ```text
     git checkout main
     git pull
     git checkout -b dev
     git push -u origin dev
     ```
   - Clarify that `dev` is optional; feature branches off `main` are enough. If the user wants a persistent `dev` branch, document how to keep it in sync.
   - Add guardrails: no force-push to `main`, no rewriting published history.

2. **Update the reusable onboarding prompt**
   - Instruct the AI to verify which branch it is on before editing.
   - Tell it to create a feature branch for any non-trivial change and open a PR into `main` rather than committing directly to `main`.
   - Remind it that Lovable syncs from `main`, so only merged work appears in the editor.

3. **Add a one-time setup checklist**
   - A short ordered list the user can follow once to prepare the repo for Claude Code work.
   - Include a note that the setup must be done by the user because the assistant cannot run `git checkout/push` commands in this environment.

4. **Review `ONBOARDING.md` for consistency**
   - Ensure the new section links cleanly to the existing project overview, current state, and remaining work sections.
   - Keep the tone and format consistent with the rest of the document.

## Out of scope

- Actually creating the Git branch or opening a PR (requires user action in their GitHub/local environment).
- Changing the Lovable Git sync connection or branch.
- Any application code changes.

## Verification

- `ONBOARDING.md` renders correctly and contains the new §8 Git & Branching Workflow.
- The reusable prompt includes branch-related instructions.
- No broken internal links or duplicated content.