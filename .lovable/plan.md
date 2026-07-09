
# Bold Redesign Pass — Sequenced Workflow

You want a real reinvention across 8 sections, at max intensity, one section at a time — and the design tokens themselves (palette, typography) are on the table. Here's how I'll run this so it stays under your control and doesn't spiral.

## Phase A — Re-pin the taste (once, at the top)

Before touching any section, we lock the new visual foundation. Otherwise each section drifts and the site loses cohesion.

I'll ask three visual questions in one round:

1. **Color palette** — swatches. I'll show 4 curated options that could fit a modern editorial wedding site: a bolder version of the current ivory/plum, a moody "Noir & Gold" for a black-tie register, a nature-forward "Sage & Cream", and one deep-and-jewel "Emerald Prestige". Plus your own via "Other".
2. **Typography pair** — real type samples. Options that push away from the safe Fraunces + Inter: e.g. `cormorant-karla` (luxury), `instrument-serif-work-sans` (editorial), `dm-serif-display-fira-sans` (brand storytelling), `abril-fatface-cabin` (creative portfolio).
3. **Overall layout register** — wireframes: `magazine`, `asymmetric`, `broken-grid`, `bento-grid`. This tells me how far to break the current safe grid.

Once you pick, I write the new tokens into `src/styles.css` (`@theme`, `:root`), swap font links in `src/routes/__root.tsx`, and confirm the base still renders. That's the only edit in Phase A.

## Phase B — Redesign, one section at a time, in order

For each section below, the loop is:

1. I capture the current section from the live preview (Playwright element screenshot).
2. I call `design--create_directions` with 3 rendered directions — locked to the Phase A tokens, varying in composition, density, hierarchy, motion register.
3. I show you the 3 previews as clickable prototypes via `ask_questions` (`type: "prototype"`).
4. You pick one. I implement it exactly — matched composition, matched tokens, no drift.
5. Typecheck + preview verification. You approve, I move to the next section.

Order (I recommend this specific sequence so each downstream section can respond to the tone the earlier ones set):

1. **Hero** — sets the entire register for the site. Everything downstream keys off this.
2. **Countdown** — the site's second breath; needs to complement, not compete with, the new hero.
3. **Our Story timeline** — first content moment; storytelling voice gets defined here.
4. **The Day / Details** — the current plum-inverted section; probably the biggest opportunity for a truly bold move (immersive schedule, cinematic date lockup, asymmetric split).
5. **Wedding Party** — 26 people, big block; grid architecture matters here.
6. **Travel + hotels + map** — utility-heavy, editorial map presentation is a real opportunity.
7. **Registry** — 4 cards; a chance for something more considered than the current uniform grid.
8. **Final CTA + Footer** — the closer; small but memorable.

## What I am NOT doing during this pass

- Not changing content (schedule, party names, hotels, registry links, FAQ text, RSVP logic).
- Not redesigning the RSVP page — it's task-focused UI and works. I'll re-skin it lightly after the tokens change so it stays coherent, and that's it.
- Not touching backend, admin, MCP tools, or auth.
- Not publishing. You'll do that when you're ready.

## What I need from you between rounds

Just a pick (or "regenerate — here's what's off"). No writing required.

## Time-honest estimate

- Phase A: 1 round of 3 visual picks → ~1 message.
- Phase B: 8 sections × (screenshot → 3 directions → your pick → implement → verify) ≈ 8 rounds. Each round is ~2 messages back-and-forth. Realistically this is a multi-hour, multi-session pass — not a single-shot.

Publish will still be a one-click on your end whenever you feel ready — you can also publish mid-pass if you want a checkpoint and keep refining after (you were right that we can iterate post-publish).

---

**On approve**, I switch to build mode and immediately post Phase A's three visual questions. Nothing else changes until you answer them.
