<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

---

# Working agreement for AI assistants on this project

Read `ONBOARDING.md` in full before making changes. `HANDOFF.md` has the reasoning. `.lovable/plan.md` has the current roadmap. Do not skim.

## Non-negotiables

1. **Docs-are-code.** `ONBOARDING.md`, `HANDOFF.md`, and `.lovable/plan.md` are part of the deliverable. Any turn that changes routes, server functions, DB schema, feature flags, wedding data, email pipeline, MCP tools, admin surface, SEO metadata, or completes/adds a roadmap item MUST update the affected doc in the same turn and bump the "Last verified" date at the top of `ONBOARDING.md` and `HANDOFF.md`. Never leave docs describing a past state.
2. **Verify current state before asserting it.** Don't trust the doc's own claims about live data, flag values, or row counts — query the DB or read the file. If you're about to write "X is enabled" or "table Y has Z rows" and you haven't checked this session, check first.
3. **Direct to `main`, always.** No feature branches. No PRs. No `git checkout -b`. See `ONBOARDING.md` §8.
4. **Never break the single-admin invariant.** No public sign-up, no multi-admin logic, no changing the obscure admin URLs (`/portal-ga-2026`, `/portal-ga-2026/dashboard`) without an explicit ask and a real reason.
5. **Never break RLS.** Every new public table needs a `GRANT` block and RLS policies in the same migration. Admin server functions use `requireSupabaseAuth` + `ensureAdmin()` (which is backed by matching `has_role(auth.uid(),'admin')` RLS policies), NOT `supabaseAdmin` as the authorization boundary.
6. **Never introduce hardcoded colors, fonts, or domain strings.** Use the semantic tokens in `src/styles.css`, the fonts already loaded, and `SITE.siteUrl`. Prefer `-deep` variants of tan/lavender for anything functional.
7. **Preserve design decisions unless explicitly asked to change them.** The wedding-party card system, the stationery aesthetic, the section composition, the categorical-not-quantitative rarity rule — these are load-bearing. Don't refactor them into "cleaner" defaults.
8. **Small, reviewable, reversible diffs.** No broad `eslint --fix`. No wholesale reformats. If a change touches a file, `git diff` should show only lines you meant to change.
9. **Server functions gate features on both sides.** Client gate = UX. Server gate = enforcement. New flag-controlled behavior needs both.
10. **Verify before claiming done.** Run `bun run build:dev` (or the relevant test/typecheck) before saying a change is complete. For anything visual, screenshot at 440 and 1280 with Playwright — don't assume it works from reading the code.

## Work like a professional engineer on a live site

This site is going out to real wedding guests. It's not a scratch project.

- Assume every change is going straight to production the moment you push. There is no staging.
- When you don't know something, look it up — read the file, query the DB, run the build. Don't guess.
- If a "fix" doesn't have a way to be verified, it isn't a fix yet.
- If you find drift between docs and reality, correcting the docs is part of the same task, not follow-up work.
- If a request is ambiguous and the stakes are non-trivial, ask before you build. If it's ambiguous and the stakes are small, pick the reversible option and note the assumption.
