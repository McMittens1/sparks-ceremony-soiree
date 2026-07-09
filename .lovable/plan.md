## Pre-launch polish pass

A focused, high-impact review before publishing. Scope stays on presentation and copy — no business/data changes. Grouped by impact, with a "why" for each.

### 1. Fix content inconsistencies (highest impact)

- **Section numbering.** Sections currently jump from unnumbered Countdown to `02 / Our Story` and end at `08 / FAQ`. Renumber sequentially: Countdown → `01`, Our Story → `02`, Details → `03`, Party → `04`, Travel → `05`, Photos → `06`, Registry → `07`, FAQ → `08`.
- **Countdown label.** Dictionary still reads "Until we say I do" / "Para el gran día" and renders in a giant editorial style below "Countdown". Replace with a single, warmer line: EN "Until we say I do" is fine tonally but reads awkward at 9rem; use "Counting down" / "En cuenta regresiva" instead so the big type is short and elegant.
- **Placeholder timeline.** `story.timeline` is generic templated copy (2019 karaoke, 2021 snowstorm, 2024 kitchen proposal). Replace the copy with a soft, real-agnostic version ("2019 · We met.", "2021 · Made it official.", "2024 · The yes.", "2026 · Forever.") so it doesn't ship as obvious placeholder while G+A supply real dates later.
- **Photos section framing.** Pre-wedding the section says "add your own — we'll post them after the wedding" and shows a "Share a photo +" button, but the empty state right below says "Photos will appear here after the wedding." The upload CTA can confuse guests now. Hide the upload button + change lead to "A shared gallery, coming after the wedding. We'll open uploads closer to the day." (EN + ES). Keep the upload modal wiring intact so we can flip it back on later.

### 2. Hero refinements

The framed portrait layout stays. Refinements only:

- **Add `og:image`** on the home route's `head()` pointing to the absolute CDN URL of `Favorite.jpg` so link previews show the couple, not nothing. (Root `og:image` intentionally omitted per instructions.)
- **Preload the hero** by adding a `{ rel: "preload", as: "image", href: favorite.url }` link on the `/` route head — improves LCP.
- **Mobile hero (<640): reduce `text-[16vw]` to `text-[14vw]`** on the two name lines so `Geovanni` / `Addison` don't crowd the 440px viewport edges. `&` stays at `14vw` → drop to `12vw`.
- **Museum caption bar.** Center column reads `Sparks' Barn · Louisville, NE` — link it to the map (`SITE.mapLink`) with `link-underline` so it's a real tap target.
- **Cursor parallax** currently mutates `transform` directly on mousemove, competing with the `animate-rise` entrance animation. Gate the parallax listener behind a `setTimeout(..., 900)` so the entrance completes first.

### 3. Accessibility + semantic polish

- Add `lang` sync on `<html>` from the LanguageProvider so screen readers switch pronunciation when the user toggles ES.
- Ensure the icon-only mobile "Menu / Close" button and any icon-only lightbox controls have `aria-label`s (spot-audit).
- `min-h-screen` → `min-h-dvh` where used, so mobile browsers don't over-scroll under the URL bar.
- Add `alt=""` on the decorative Final CTA background image (currently already empty — verify) and confirm every engagement-strip image has a meaningful alt (currently all say "Geovanni and Addison" — good).

### 4. UI consistency

- **Buttons.** RSVP primary CTA appears in three places (header, hero, final CTA) with three different sizes and paddings. Standardize on the hero size (`px-7 py-3.5 text-[10px] tracking-[0.3em]`) everywhere except the Final CTA hero button (which stays larger by design).
- **Section headings.** All h2s except Countdown use `SplitText`. Wrap the Countdown h2 in `SplitText` too so scroll-in motion is consistent.
- **FAQ.** Two-column grid at `lg:` splits items row-major; that's correct. Add a soft closing line after the last FAQ ("Still have a question? Text us." + a `mailto:` or the `SITE.rsvpFallbackContact` line) so guests have an out.
- **Registry cards.** All four items have hrefs, so the "Details coming soon" branch is dead. Remove the branch and simplify to `<a>` only — reduces render logic and prevents future accidental blanks.

### 5. Performance / craft

- Add `loading="lazy"` + `decoding="async"` on the party portraits and any engagement-strip image after the first two.
- Iframe map: keep `loading="lazy"`; also add `referrerPolicy="no-referrer-when-downgrade"` to satisfy Google Maps in some browsers.
- Preload the Fraunces italic 400 subset via `<link rel="preload" as="font" ...>` — this is what the entire site's editorial-heading uses, and it's the biggest FOUT contributor.

### 6. What we deliberately are NOT touching

- RSVP flow (already reviewed in the earlier pass — leave for post-launch iteration if issues surface).
- Admin route.
- Backend / schema / migrations.
- Adding new sections (livestream, gift-giving legal copy, dress-code visuals, etc.) — post-launch.

### Files touched

- `src/i18n/dictionaries.ts` — countdownLabel, story.timeline, photos.lead + hide upload copy, EN + ES.
- `src/routes/index.tsx` — section number kickers, hero mobile type scale, hero caption bar link, hide upload button, remove registry dead branch, Countdown SplitText, small button consistency, FAQ closing line, parallax timing.
- `src/routes/__root.tsx` — Fraunces preload link, dynamic `<html lang>` via provider.
- `src/routes/rsvp.tsx` — only if the RSVP CTA styles diverge from the shared token.
- `src/components/site/Header.tsx` — button size token alignment; `aria-label` audit.
- `src/i18n/context.tsx` — sync `document.documentElement.lang` on language change.

### Verification

After edits: build check, then a Playwright pass at 440×800 and 1440×900 taking screenshots of hero, countdown, story, details, party, travel, photos (empty), registry, faq, final CTA — attach for review before pressing publish.
