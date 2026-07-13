# Motion & Polish Pass (Desktop)

Editorial, restrained motion — nothing bouncy. Everything respects `prefers-reduced-motion` (already gated in existing helpers like `Reveal`, `Parallax`, `Magnetic`).

## 1. Reintroduce a few legacy helpers (already in repo, currently unused)
Keep them; wire them into the new redesign selectively:
- `Reveal` (fade/blur/mask variants) — section headings, story rows, party cards, hotel cards, registry cards, FAQ items. Staggered by index (60–120ms).
- `Parallax` — hero portrait (`speed: -0.08`), Story montage photos (`0.05–0.12`), Getting There map illustration (`-0.06`). Subtle only.
- `Magnetic` — RSVP CTA in header, "Send RSVP" submit button, Registry card CTAs. Strength 0.15–0.2 (subtle).
- `SplitText` — hero couple names + section H2s: per-word mask reveal on first paint / on-enter.

## 2. New motion pieces to add
- **Spine active indicator**: animated vertical bar that morphs/slides between numerals as `useActiveSection` changes (transform + opacity, 400ms cubic-bezier).
- **Header nav underline**: shared-layout style — active underline animates horizontally between items on click/scroll (single absolutely-positioned bar driven by refs).
- **Hero portrait entrance**: image clip-path reveal (inset 100% 0 0 0 → 0) + slight scale-down from 1.04 → 1.0 over 900ms on load.
- **Countdown digits**: flip/slide when a unit changes (translateY + fade on the old/new number).
- **Story timeline connector**: SVG vertical line draws (`stroke-dashoffset`) as the section enters view; diamond markers pop in per row.
- **Gallery hover**: image scale 1.0 → 1.03 with a slow (600ms) ease, plus caption slide-up from bottom on hover.
- **Marquee band** (optional): reuse existing `Marquee` for a single ivory→ink strip between Party and Getting There with "Geovanni ✦ Addison ✦ 10.10.26 ✦ Louisville, NE".
- **Lavender-wash section transitions**: as `#day` (deep lavender bleed) enters, background color of the outer wrapper cross-fades from ivory → deep lavender via IntersectionObserver (200–400ms).
- **Diamond dividers**: rotate 45° → 90° and fade in when scrolled into view.
- **Cursor**: keep off by default. It exists but felt heavy; leave removed unless you want it back.

## 3. Micro-interactions
- Buttons/links: 150ms color transitions already present — add a 1px underline draw on nav hover (in addition to active state).
- Form fields (RSVP): label lifts / border color fades to lavender on focus (already partially there — formalize).
- FAQ `<details>`: animate chevron rotate + content height (use `interpolate-size` fallback via max-height transition).

## 4. Files touched
- `src/routes/index.tsx` — wrap headings/rows in `Reveal`, `SplitText`, `Parallax`, `Magnetic`.
- `src/components/site/Header.tsx` — animated underline bar.
- `src/components/site/Spine.tsx` — animated active indicator.
- `src/components/site/Countdown.tsx` — digit flip.
- `src/components/site/StoryTimeline.tsx` — SVG line draw.
- `src/routes/rsvp.tsx` — Magnetic submit, focus transitions.
- `src/styles.css` — keyframes for clip reveal, digit flip, chevron, marquee ivory variant; ensure reduced-motion overrides.

## 5. Guardrails
- Desktop only (existing scope).
- No layout shift; transforms + opacity only.
- All observers disconnect after first reveal.
- Reduced-motion: all animations collapse to instant opacity (existing pattern in `Reveal`).

---

# Suggested Next Work (after motion)

1. **Mobile/tablet pass** — the explicit later phase. Header collapses to hamburger + slide-in drawer; two-col sections stack; Spine hides <1024px; hero image goes above/below text.
2. **Real photos section** — wire the approved-photos server function that already exists (`src/lib/photos.functions.ts`) into a masonry grid with `Lightbox`. Currently the section is a stub.
3. **Guest photo upload flow** — modal (`PhotoUploadModal.tsx` exists) → Supabase Storage → admin approval queue in `_authenticated/admin.tsx`.
4. **RSVP polish** — success screen with couple monogram + "add to calendar" (.ics) download; email confirmation via Lovable AI Gateway/edge function.
5. **Live weather widget** on Getting There — `api/public/weather.ts` already exists; surface a small forecast card for the wedding week.
6. **SEO/OG** — generate a real og:image (hero portrait crop w/ names + date) and wire per-route metadata for `/rsvp`.
7. **Spanish translations audit** — new copy added during redesign (story entries, hotels, FAQ groups, closing) needs ES parity in `dictionaries.ts`.
8. **Print stylesheet** — one-page schedule + address card for guests who print.
9. **Analytics** — anonymous page/section view tracking to see what guests actually read.
10. **Perf**: convert engagement JPGs to responsive `<img srcset>` / AVIF; lazy-load below-fold photos.

Approve and I'll implement the motion pass first; we can queue the rest.
