## Scope

Content-only pass to get the site publish-ready. Wedding party photos and story chapter photos are deferred to post-publish (you can iterate in preview, then click "Update" to push live — no separate staging needed).

## Changes

### 1. Registry (`src/lib/wedding-data.ts`)
Replace the current `REGISTRY` array with:
- **Zola** → `https://www.zola.com/registry/addisonandgeovanni` — "Main registry — most up to date"
- **The Knot** → `https://www.theknot.com/addisonandgeovanni/registry` — "Used for the wedding shower"
- **Honeymoon fund (Zola)** → same Zola URL (or Zola's cash-fund section if you have it) — "Help send us on the honeymoon"
- **Venmo — Geo** → `https://venmo.com/u/Geo-Moreno-1` — "Fee-free alternative"
- **Venmo — Addi** → `https://venmo.com/u/addihillman` — "Fee-free alternative"
- Remove local charity entry.

### 2. Travel section (`src/lib/site.ts`, `src/i18n/dictionaries.ts`, travel section on home)
- **Address**: update `SITE.address` to `13817 108th St, Louisville, NE 68037`; update `SITE.mapEmbed` and `SITE.mapLink` to point at that exact address (pin on Sparks' Barn, not the town).
- **Show the address** in the travel section under the map title.
- **Hotels copy** rewrite (EN + ES): remove the "we've held a block" line. Replace with a short intro + curated list of nearby options grouped by area:
  - *Closest (Plattsmouth / Louisville)* — 1–2 options within ~15 min
  - *Lincoln* (~40 min west) — 2–3 well-known chains near I-80, good for guests staying in Lincoln
  - *Omaha / Airport (OMA)* — 2–3 options near the airport for fly-in guests
  - Each entry: hotel name + city + approximate drive time. I'll pick well-known chains (Hilton, Marriott, Hampton, Holiday Inn Express) near each area; you can swap any before publish.

### 3. RSVP subtitle (`src/routes/rsvp.tsx` ~line 317)
Change "A paper invite is on its way." to something like "Confirm your address below so we can keep you posted." (EN + ES).

### 4. FAQ tighten (`src/i18n/dictionaries.ts`, both `en.faq.items` and `es.faq.items`)
Keep the 6 questions; tighten answers so they match reality:
- Venue name (Sparks' Barn, Louisville NE)
- No hotel block — point at Travel page for recommendations
- Plus-ones: only if listed on your invite / RSVP page allows
- Kids: welcome, mark them as child on RSVP
- Dress code + indoor/outdoor: already accurate, minor polish
- Arrival time: 4:30 PM doors, 5:00 PM ceremony

### 5. Deferred (post-publish, no code today)
- Wedding party portraits — add `photo` field to entries in `PARTY` when you have them; layout already supports it and falls back to initials.
- Story chapter photos — map specific engagement shots to chapters in `StoryTimeline.tsx`.
- Per-section `og:image`, RSVP confirmation email (needs custom domain).

## Publish workflow (for reference)
- Frontend edits stay in preview until you click **Publish → Update**. That is your staging.
- After publish, keep editing freely; nothing goes live until you click Update again.
- No separate staging site needed.

## Order of operations
1. Registry array
2. Site address + map
3. Travel dictionary (hotels EN + ES)
4. RSVP subtitle (EN + ES)
5. FAQ answers (EN + ES)
6. Typecheck, confirm preview renders

After this pass, remaining pre-publish work is: end-to-end RSVP test + photo upload/moderation dry-run.
