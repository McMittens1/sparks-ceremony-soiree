# Accessibility polish before RSVPs open

Audit of the live front end (header/drawer, RSVP flow, root layout, global styles). The baseline is already good: skip link, `<main>` landmark, `:focus-visible` rings, `aria-live` regions on RSVP errors and counters, labelled inputs, combobox roles on the lookup, reduced-motion handling. Four real defects remain. All are frontend-only.

## Worth fixing

### 1. Closed mobile drawer stays in the tab order (critical)
`.mobile-menu-panel` is only translated off-screen, and the panel itself carries no `aria-hidden`/`inert` (only the backdrop does). On a phone, a keyboard or screen-reader user tabbing through the page walks into seven invisible nav links, an RSVP link, and a language button before reaching the hero.

Fix: mark the panel `inert` + `aria-hidden` while closed.

### 2. No focus trap or focus restore in the drawer (critical)
Opening the menu leaves focus on the hamburger behind the backdrop; Tab escapes into the page underneath. Closing does not return focus anywhere predictable.

Fix: move focus to the drawer's close button on open, cycle Tab/Shift+Tab within the panel, and restore focus to the hamburger on close. Escape and backdrop-click already close it.

### 3. `<html lang="en">` is hardcoded while the site ships a Spanish toggle (warning)
In `src/routes/__root.tsx` the document language never changes when a guest switches to Spanish, so screen readers pronounce Spanish content with English phonetics.

Fix: keep `lang="en"` for SSR, then sync `document.documentElement.lang` to the active language from the i18n context.

### 4. Tap targets under 44px on the RSVP form (warning)
Several small controls in the party list (remove-guest control, "name to come" toggle, child checkbox) render below the 44x44 minimum, which is the exact surface older guests will use on a phone.

Fix: raise the hit area with padding/min-size without changing the visual weight of the marks.

## Checked and already correct

- Skip link, single `<main>`, single `<h1>` per route, heading order.
- Focus rings on all interactive elements, mouse clicks stay ring-free.
- `aria-expanded` / `aria-controls` on the hamburger, lookup combobox, and party accordions.
- `role="alert"` + `aria-live` on RSVP verification and submit errors.
- Alt text present on rendered images; decorative marks are `aria-hidden`.
- `prefers-reduced-motion` handled globally.

## Technical notes

Files touched: `src/components/site/Header.tsx` (inert + focus trap + restore), `src/routes/__root.tsx` (lang sync), `src/routes/rsvp.tsx` and `src/routes/rsvp/edit.$token.tsx` (tap targets), `src/styles.css` only if a hit-area utility is cleaner than inline classes.

Verification: `bun run build:dev`, then Playwright at 440px and 1280px — tab from page load with the drawer closed (must not enter the panel), open the drawer and confirm focus cycles inside it and returns to the hamburger on Escape, and screenshot the RSVP party list to confirm no visual regression.

Docs: bump "Last verified" in `ONBOARDING.md` and `HANDOFF.md` and note the drawer focus contract.
