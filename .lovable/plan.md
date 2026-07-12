# Desktop Visual Redesign — Implementation Plan

Scope: desktop only, straight-to-`main`. Mobile/tablet is deferred — I will not touch responsive fallbacks for the new sections, and existing mobile behavior can degrade during this pass (the README explicitly permits this).

## 1. Design tokens & typography (`src/styles.css`, `src/routes/__root.tsx`)

- Replace the current ivory/plum/lavender/tan palette with the handoff palette (ivory `#F8F4EC`, ink `#2A2520`, lavender `#8779A3`, deep lavender `#4C4066`, lavender wash `#EAE3F1`, chambray tan `#A39680`, deep chambray `#6B5F49`, hairline `#E1D6C3`, warm gold `#D9C9A0`, chambray wash `#F1E8D8`, body ink `#4A4238`, soft ink `#6E6255`). Keep the existing `oklch()` format for `--background`/`--foreground`/`--primary`/`--primary-soft`/`--accent`/`--muted`/`--border`/`--ring` so shadcn components keep working; add new semantic tokens (`--ink`, `--ink-soft`, `--ink-body`, `--lavender`, `--lavender-deep`, `--lavender-wash`, `--tan`, `--tan-deep`, `--hairline`, `--gold`, `--chambray`) for redesign-specific use.
- Set `--radius` and all derived radius tokens to `0`. Circular avatars will use `rounded-full` explicitly.
- Swap the Google Fonts `<link>` in `src/routes/__root.tsx` from Fraunces+Inter to **Cormorant** (300/400/500/600 + italics) and **Work Sans** (400/500/600/700). Update `--font-serif` → Cormorant, `--font-sans` → Work Sans. Drop the `--font-script` token (unused after redesign).
- Remove/neutralize old animation utilities that don't belong in the new system: `reveal-*`, `split-text`, `animate-marquee*`, `animate-rise`, `animate-float`, `animate-shimmer`, `count-pulse`, `draw-line`, `link-underline`, `.grain`, `.editorial-heading`, custom-cursor CSS. I will delete these rather than keep dead CSS (README §Interactions calls them out as the old system and OKs removal — flagging here so you can veto before I run the diff).

## 2. Global chrome

- `**src/routes/__root.tsx**`: remove `<Cursor />` and `<ScrollProgress />` from `RootComponent`. Add the fixed 52px `<Spine />` (new). Wrap `<main>` in the required `margin-left: 52px` container. Root `<html>` background stays ivory.
- `**src/components/site/Header.tsx**`: rebuild. New monogram lockup (Cormorant italic "G", 5×5 rotated lavender square, italic "A") + 7 nav links (Our Story, The Day, Wedding Party, Getting There, Photos, Registry, FAQ) + outlined RSVP button + EN/ES toggle wired to the existing `useLang()` (keep it functional — the README calls it a stub but we already have working i18n; no reason to regress). Backdrop `rgba(248,244,236,0.94)` + `backdrop-blur(8px)` + hairline bottom border. Active nav state driven by a single `IntersectionObserver` inside `Header` observing section IDs.
- **NEW `src/components/site/Spine.tsx**`: fixed 52px dark rail; consumes the same active-section context via a lightweight `useActiveSection` hook (extracted from Header) so the numeral lights up in sync. Emits sections I–VIII: Countdown, Our Story, The Day, Wedding Party, Getting There, Photos, Registry, FAQ. Replaces (and deletes) the current `SectionRail` component.
- `**src/components/site/Footer.tsx**`: rebuild to the three-column row spec (monogram + "October · MMXXVI", "10 · 10 · 26", "Made with love by Geo · 10.10.26").

## 3. Home page (`src/routes/index.tsx`)

Rebuild top-down. Each section gets a stable `id` matching the spine. Strip all `Reveal`/`SplitText`/`Parallax`/`Magnetic` wrappers.

1. **Hero** — two-column flex inside a `container-type: size` wrapper, `calc(100vh - 78px)` height, min 560px. Left: eyebrow + stacked Cormorant names (`&` in lavender italic) + date/venue line + solid-ink RSVP button + lavender "See details" text link. Right: full-height portrait (reuse `favorite.jpg`), `object-fit: cover`. All sizing via `cqh`/`clamp()` per README §3.
2. **Countdown** (`#countdown`) — center-aligned, eyebrow "I · Counting Down", four Cormorant number blocks with lavender middots, live ticker to 2026-10-10 17:00 America/Chicago. Rewrite `Countdown.tsx` in place (existing component is close enough to reuse the timer logic).
3. **Our Story** (`#story`) — rebuild `StoryTimeline.tsx`. Data source: new `STORY_ENTRIES` array in `src/lib/wedding-data.ts` seeded from `Wedding Site.dc.html`'s `storyEntries` (dated + montage kinds, per-entry photo lists, pull-quote, index numeral). Copy already-in-repo engagement photos into the entries as placeholders where the prototype used `couple-0*.jpg`. Two layout variants (dated stage: 640px hero + filmstrip + 88px vertical pull-quote gutter, alternating LTR/RTL; montage: centered text + auto-fill photo grid). Giant `aria-hidden` roman numeral watermark behind dated entries.
4. **The Day** (`#details`) — `#4C4066` full-bleed. Eyebrow gold, headline ivory, 10/10/26 lockup (Cormorant + hairline middots + Sat/Oct/MMXXVI captions), two-column schedule/notes. Schedule + dress code + venue copy stays from `t.details`.
5. **Wedding Party** (`#party`) — rebuild inline (or extract to `src/components/site/WeddingParty.tsx`). Featured MoH + Best Man (128px avatars) → Bridesmaids grid → Groomsmen grid → Down the aisle first (flower girl + ring bearer) → Ushers text row. Click / Enter / Space toggles a single `expandedPartyId` inline note. Requires `wedding-data.ts` additions (below).
6. **Getting There** (`#travel`) — NEW section. Address block + dashed-border map placeholder (README explicitly leaves the map unresolved — I'll leave the placeholder rather than invent an embed). Below: three hotel groups (Plattsmouth/Lincoln/Omaha) sourced from a new `HOTELS` array. Bottom: Parking / What to pack paragraphs. New copy lives in `t.travel`.
7. **Photos** (`#photos`) — two-column: message on the left, stubbed upload form on the right (name / email / caption / dashed drop area / Upload button). Keep the existing `PhotoUploadModal`/gallery code paths available but not mounted here — the redesign wants a static gallery-opens-later stance. Flagging: this hides the currently-working approved-photos gallery from the homepage. Confirm before I remove the live gallery grid entirely, otherwise I'll tuck it below the upload form as a "so far" strip.
8. **Registry** (`#registry`) — 4-card grid from existing `REGISTRY` array. Zola card gets lavender-wash bg + solid CTA; The Knot + both Venmos get ivory bg + text-link CTA.
9. **FAQ** (`#faq`) — two-column native `<details>` accordion (Logistics / Attire & guests). Copy pulled from `Wedding Site.dc.html`'s `faqLogistics` and `faqGuests` arrays into `t.faq.logistics` and `t.faq.guests`. Existing `t.faq.items` retired.
10. **Closing CTA** — full-width `#EAE3F1` band, "See you soon" eyebrow, "Won't be the same without you." headline, RSVP button, response deadline caption.

## 4. RSVP page (`src/routes/rsvp.tsx`)

Reskin only — this route already runs a real Supabase-backed lookup/submit flow with per-attendee choices, address confirmation, song request, and message. The prototype's simpler 3-state party-form is a design fidelity target, not a functional spec.

- Chrome: strip the spine on this route (already off `<main>`, but I'll adjust the layout margin), keep the minimal monogram + "← Back to the site" bar per prototype.
- Recreate the card frame (`640px`, ivory, `#E1D6C3` border, `0 50px 90px -50px rgba(42,37,32,0.28)` shadow) and restyle the lookup input, attendee pills (`aria-pressed` on toggle), address block, and confirm/recap states.
- Do NOT rip out the existing server-fn calls (`lookupGuest` / `getGuestBySlug` / `submitRsvp`) or the extra fields the real flow needs. If a field in the prototype doesn't map (e.g. free-form "+ Add guest"), I'll leave it out and note it in the file rather than fabricate a stub that pretends to write.

## 5. Data & copy

- `src/lib/wedding-data.ts`: add `featured: boolean` on `PartyMember` (default false; MoH + Best Man true). Add `PartyMember.note?: string`. Add `STORY_ENTRIES` array (id, kind: 'dated'|'montage', index, date, location, title, body, photos[], pullQuote?) seeded from the prototype — real photo files use the existing engagement imports. Add `HOTELS: { group, city, name }[]` seeded from the prototype's hotel list. Add `PARKING` / `PACKING` copy or route those through i18n.
- `src/i18n/dictionaries.ts`: add `t.travel.*` (hotels intro, parking, packing), `t.faq.logistics[]` + `t.faq.guests[]` (replacing the flat `items`), `t.closing.*`, `t.story.entries[*].*` if we want ES copy for entries (initial pass: EN only for story bodies to avoid making up translations — Spanish speakers still get EN body while headings/labels stay bilingual). Update countdown label + hero eyebrow to match the new copy.
- All copy pulled verbatim from `Wedding Site.dc.html` where the prototype provides it. I will NOT invent bios for wedding-party notes (README calls those placeholders); they'll show the "(add note)" affordance only when a `note` string is present on the member, otherwise the click just no-ops or the note area is hidden.

## 6. Components to delete after redesign lands

`SectionRail.tsx`, `Cursor.tsx`, `ScrollProgress.tsx`, `Marquee.tsx`, `SplitText.tsx`, `Reveal.tsx`, `Magnetic.tsx`, `Parallax.tsx`, `SectionDivider.tsx`. Plus corresponding CSS blocks in `styles.css`. Flagging so you can veto keeping any of them alive for future use.

## Open decisions I need you to confirm before I start

1. **Old animation CSS + component files** (`Reveal`, `SplitText`, `Cursor`, `ScrollProgress`, `Marquee`, `Magnetic`, `Parallax`, `SectionDivider`, `SectionRail`) — delete outright, or leave the files unused? Default: Leave the files unused   
Question to lovable AI: Should we leave them unused in case we want to reuse them?
2. **Photos section** — the redesign turns the homepage gallery into "coming after the wedding" copy + a stub upload form. Do you want me to keep the currently-live approved-photos grid visible as a small "so far" strip, or fully hide it per the prototype?   
Question to lovable AI: I didn't think we had a live photos grid for this section yet. If you end up keeping them, ensure they match the new design.
3. **RSVP** — confirm reskin over the existing backend, keeping current fields (address confirm, song request, message). The prototype's "+ Add guest" affordance stays out unless you want a plus-one intake wired through the real submit path.   
Answer from user: I thought we did have the plus0one intake wired already? Are you checking most recent shit?
4. **EN/ES toggle** — keep functional (current behavior) even though the prototype treats it as a stub? Default: keep functional.