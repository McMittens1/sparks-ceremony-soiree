# Wedding Party preview + toggle verification

## Problem

The Wedding Party section is currently hidden behind the `show_wedding_party` feature flag (`false` in production). There is no way to view or edit it without flipping the flag live, which would expose an unfinished section to guests who are already RSVPing.

## What gets built

### 1. Safe preview mode (no DB change required)

Add a URL query-parameter override so the couple can preview the Wedding Party section privately without changing the production flag.

- `/?preview_party=1` forces `showParty` to `true` for that browser tab only.
- The override also reveals the "Party" nav link and the correct roman numeral (IV when Portraits is on, V when Portraits is off).
- Other visitors loading `/` normally still see the section hidden.
- The override is read from `URLSearchParams` in `useSectionOrder` and is never persisted to the DB.

Implementation touches:
- `src/hooks/use-section-order.ts`: accept an optional `previewParty` boolean; return `showParty || previewParty`.
- `src/routes/index.tsx`: pass `previewParty` from `location.search` into `useSectionOrder`.
- `src/components/site/Header.tsx`: same — derive `previewParty` from the URL so the nav link appears.

### 2. Verify the section before it goes live

Run a full visual + functional check with the preview flag forced on:

- Screenshot the homepage at 440px and 1280px with `?preview_party=1`.
- Confirm the Wedding Party section renders as Section IV (since Portraits is currently on → III is Portraits, IV is Party).
- Confirm the left Spine updates in sync: it shows the same visible section IDs and roman numerals as the page body, and the active numeral highlights lavender on scroll.
- Confirm the desktop nav and mobile drawer show the "Party" link.
- Confirm the mobile drawer closes when Party is tapped and scrolls to `#party`.
- Confirm Groomsman cards flip on tap/click and show placeholder copy where fields are empty.
- Confirm Magazine covers render for Maid of Honor and Bridesmaids.
- Confirm Flower Girl / Ring Bearer avatars expand when tapped.
- Confirm `show_ushers` flag still gates the Ushers block independently.
- Confirm no console errors and no hydration mismatch.
- Confirm that without the query param the section is still hidden.
- Confirm that toggling `show_portraits` off and `show_wedding_party` on renumbers correctly (Wedding Party becomes Section III, Portraits disappears, spine and nav stay in sync).

### 3. Optional: same preview for `show_ushers`

Add `?preview_ushers=1` alongside `?preview_party=1` so the Ushers block can also be reviewed before the flag is enabled.

## Out of scope

- No changes to the actual Wedding Party data in `wedding-data.ts`.
- No changes to card/cover components unless a bug is found during verification.
- No change to the default feature-flag value.

## Docs

Update `ONBOARDING.md` and `HANDOFF.md` with the preview query params and the verification checklist result.
