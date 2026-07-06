
## Still open (in priority order)

**1. Wedding party names** — `src/lib/wedding-data.ts` still has seeded fakes (Maria S., Jordan T., Ashley R., Sam L., Priya N., Diego M.). The `#party` section on home renders these. Need real names + roles, or set to "to be announced" on both surfaces.

**2. Registry links** — `wedding-data.ts`:
- Zola link is generic `https://zola.com` — need your real Zola URL
- Honeymoon Fund: no link, renders "Details coming soon"
- Local charity: no link, renders "Details coming soon"
- Send actual URLs, or tell me to drop the two placeholders.

**3. Story chapter photos** — `StoryTimeline.tsx` cycles the same 8 engagement shots for every chapter via `pick(i, count)`. Chapters like "Odin comes around" / "Copper meets Odin" need real chapter-specific images. Send photos mapped to chapters when you have them.

**4. Hotel / travel copy** — `dictionaries.ts` still says "We've held a small block at hotels in Plattsmouth and south Omaha…" Need real hotel name(s) + booking link(s), or a rewrite if there's no block.

**5. RSVP address subtitle** — `rsvp.tsx` line ~317 currently says "A paper invite is on its way." Should probably be "Please confirm your address so future updates reach you." (or similar) since paper invites are going out separately.

**6. FAQ re-read** — 6 generic Q&As in `dictionaries.ts` `faq.items`. Especially plus-ones and kids policy — worth confirming they match your actual answers.

**7. Spanish mirror** — every EN edit above needs the matching ES string updated in `dictionaries.ts`.

## Then: pre-publish verification

- End-to-end RSVP test: create a fake invite in admin → submit as guest → confirm it lands.
- Photo upload + admin moderation dry-run.
- Quick pass on `#details` values (date `2026-10-10 17:00`, venue "Sparks' Barn, Louisville, NE", deadline `2026-09-15`, dress code colors).

## Nice-to-have (can wait for after publish)

- Per-route (well, per-section) `og:image` using the hero
- RSVP confirmation email (needs custom domain first)
- 404 copy polish

## My suggestion

Fastest path to publish: **send me items 1, 2, 4, 5 as text and I'll knock them out in one pass**, then mirror ES, then run the RSVP/photo test. Story photos (#3) can slot in whenever you're ready — they don't block launch, they just make the timeline stronger.

Which do you want to start with?
