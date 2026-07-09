## Pre-publish review

The site is content-complete and structurally solid. Highest-impact items before publishing:

1. **Tone** — remove invitation/save-the-date framing sitewide (biggest issue you flagged).
2. **Hero** — redesign around your favorite engagement photo, not just swap it in.
3. **Metadata** — homepage `<title>` and description should describe the site, not invite anyone.
4. **A few small polish items** worth catching in the same pass.

Deferring per your earlier direction: wedding-party portraits, per-chapter story photos, per-section `og:image`, RSVP confirmation email.

---

## 1. Copy rewrite — remove invitation language

Search-and-replace across `src/i18n/dictionaries.ts` (EN + ES) and `src/lib/site.ts`. Every string below currently frames the site as the invitation itself.

**Home (`home.*`)**

- `kicker`: "Save the date" → "The Wedding of" (ES: "La boda de")
- `title`: "You are invited to" → remove entirely; replace the small caps label above the date with "The Big Day" / "El gran día"
- `intro`: rewrite from "One evening under string lights…" to a welcoming site-intro line: *"Welcome to our wedding website. This is where you'll find everything you need for the celebration — schedule, travel, and how to RSVP."* (ES equivalent)
- `rsvpCta`: keep "RSVP now" (that's the site's action, not the invite)

**Details (`details.lead`)** — currently fine, no change.

**RSVP (`rsvp.deadlineLine`)** — keep "Please respond by…" (site action).

**FAQ** — no invitation phrasing; leave.

**Footer (`footer.made`)** — "Made with love — 10.10.26" is fine; no invite wording.

`**SITE` (`src/lib/site.ts`)** — no user-facing invite copy; leave.

I'll do one final grep for "invited", "save the date", "invitation" (EN + ES equivalents) to catch anything missed.

---

## 2. Homepage metadata (`src/routes/__root.tsx` / `src/routes/index.tsx`)

- Title: `Geovanni & Addison — October 10, 2026` (currently likely "You are invited…" style)
- Description: `The wedding website for Geovanni Moreno and Addison Hillman. Schedule, travel, registry, and RSVP for October 10, 2026 at Sparks' Barn, Louisville, NE.`
- `og:title` / `og:description` match.
- No `og:image` change (deferred until you approve a share image).

---

## 3. Hero redesign

### Evaluation of the photo

The favorite is a warm, close-cropped horizontal portrait — you two facing each other, soft neutral limestone columns behind, natural light from screen-left. Strengths: intimate eye-line, warm skin tones against cool stone, negative space above your heads on the left side of the frame. Weaknesses for the *current* hero: it's horizontal, and the current hero is a tall 4:5/5:6 vertical crop on the left with type on the right — that layout would force a hard crop that loses either Geo's face or Addi's hair. The photo deserves a layout built for it.

### Concepts considered

1. **Full-bleed cinematic** — image fills viewport, overlaid serif type. Rejected: heavy-handed, hides the photo's intimacy behind text, hurts LCP.
2. **Editorial split with vertical crop** — what we have today. Rejected: crops the photo badly.
3. **Wide framed portrait with typographic overlay (chosen)** — image sits as a wide, generously matted "gallery print" centered under a large editorial headline. Names overlap the top edge of the image (the "&" tucks into the negative space between your faces). Meta info (date, venue, RSVP) sits in a refined 3-column caption bar *below* the image, like a museum plate. Feels premium, magazine-grade, and is built around this exact composition.

### Chosen design — details

Layout (desktop ≥1024):

```
        ┌─────────────────────────────────────────────┐
        │        GEOVANNI                             │   ← editorial serif, huge
        │                &                            │
        │                     ADDISON                 │
        │  ┌───────────────────────────────────────┐  │
        │  │                                       │  │
        │  │        [engagement photo 16:10]       │  │
        │  │                                       │  │
        │  └───────────────────────────────────────┘  │
        │  ── 10 · 10 · 26 ─ SPARKS' BARN ─ RSVP →    │
        └─────────────────────────────────────────────┘
```

- Container: `max-w-[1400px]`, generous top padding, subtle textured background (existing `bg-background`).
- Names: split across three lines, `Geovanni` left-aligned, `&` centered italic in `text-primary-soft`, `Addison` right-aligned. Type overlaps the photo's top edge by ~40px so the frame breaks the baseline — a classic editorial move.
- Photo: 16:10 aspect on desktop, 4:3 on tablet, 5:4 on mobile (all crops center-safe for this photo — verified against the composition). Wrapped in a thin `border border-accent/30` with a soft `shadow-2xl` and a `~24px` inset white/paper mat that reads as a printed plate.
- Caption bar: three columns beneath the photo — `10 · 10 · 26` (left, tracking), venue + city (center, italic serif), RSVP link + countdown link (right). Divided by hairline dots. Small caps, `text-[10px] tracking-[0.35em]`.
- Kicker "The Wedding of" sits above the name block, small caps, `text-accent`.

Mobile (< 640):

- Kicker → names stacked centered (`Geovanni / & / Addison`, still editorial).
- Photo becomes 5:4, full width edge-to-edge with 24px page gutters.
- Caption bar collapses to a vertical stack, still 3 items.
- No overlap on names/photo (breaks readability at small widths).

Tablet (640–1024): 4:3 photo, names stacked but larger, caption bar horizontal.

Motion & polish:

- Names animate in on load with staggered `rise` (already in the codebase) — Geovanni → & → Addison, 120ms stagger.
- Photo reveals with a subtle `clip-path: inset(0 0 100% 0)` → `inset(0)` wipe over 900ms, easing `[0.22, 1, 0.36, 1]`.
- Existing cursor-parallax on the photo container stays (subtle, 8px max on this larger frame instead of 14px so it feels premium not bouncy).
- Respect `prefers-reduced-motion`: skip clip-path wipe and parallax, just fade in.

Accessibility:

- `<h1>` remains "Geovanni & Addison" (single accessible name; visual line-break with `<br>` + `aria-label` on the h1 so screen readers read it as one phrase).
- `alt` on photo: "Geovanni Moreno and Addison Hillman."
- Names use `text-primary` / `text-primary-soft` — contrast already verified against `bg-background`.
- No text sits on top of the photo, so contrast concerns are eliminated.

Performance:

- Photo served from CDN via existing `.asset.json` pipeline.
- Add `loading="eager"` + `fetchpriority="high"` + explicit `width`/`height` attrs to avoid CLS.
- Preload the hero image in `head().links` of `/` route (`rel: "preload", as: "image"`).

Files changed:

- `src/lib/wedding-data.ts` — no change (hero is route-local).
- Upload `Favorite.jpg` via `lovable-assets` to `src/assets/engagement/Favorite.jpg.asset.json`.
- `src/routes/index.tsx` — replace the entire hero `<section>` block (lines ~91–144) with the new layout, keeping the cursor-parallax hook (retuned) and imports.
- `src/styles.css` — add one `@keyframes` for the clip-path reveal + `.animate-reveal` utility.
- `src/routes/index.tsx` `head()` — add hero image preload.

If you look at this and don't love it, we can adjust before I build — but I do think this photo is strong enough to justify a purpose-built hero over the current column layout.

---

## 4. Small polish (same pass)

- **Section 01/Countdown** kicker still says "01 / Countdown" — the numbering pattern isn't used elsewhere; drop the "01 /" prefix to match the rest of the site.
- **Footer**: Change to "Made with love by Geo — 10.10.26" ; but confirm the couple mark `G & A` is the intended footer identity (it is, per `SITE.coupleShort`).
- **Countdown** uses hardcoded English "Until we say / I do" in `index.tsx` instead of `t.home.countdownLabel` — wire it through the dictionary so Spanish works.
- **Router title fallback** currently shows "Lovable App" briefly on cold load — set root `title` fallback to "Geovanni & Addison — 10.10.26".

---

## Order of operations

1. Upload `Favorite.jpg` → asset pointer.
2. Copy rewrite in EN + ES dictionaries + grep verification.
3. Root + index `head()` metadata.
4. Rebuild hero section.
5. Small polish (countdown i18n, section number, root title).
6. Typecheck, view preview at desktop/tablet/mobile, confirm reduced-motion.

I will not publish — you'll click **Publish → Update** yourself when you're happy.