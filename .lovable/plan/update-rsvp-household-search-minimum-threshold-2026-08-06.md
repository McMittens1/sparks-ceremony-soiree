# Update RSVP household search minimum threshold

## Goal
Change the RSVP lookup so the dropdown of matching households does not appear until the guest has typed at least 3 characters, instead of the current 2.

## Scope
- `src/routes/rsvp.tsx`: change `LOOKUP_MIN_CHARS` from `2` to `3`.
- Verify the existing `aria-expanded` and dropdown-render conditions already key off this constant, so no other logic changes are required.

## Verification
- Run `bun run build:dev`.
- Use Playwright to confirm that typing 2 characters shows no results and typing 3+ characters shows the matching list.
- Update `ONBOARDING.md` and `HANDOFF.md` "Last verified" dates.

## Out of scope
- No server-side changes; `lookupGuest` already accepts arbitrary queries and the client gate controls when it fires.
- No copy changes unless the current hint text is found to mention a specific minimum.
