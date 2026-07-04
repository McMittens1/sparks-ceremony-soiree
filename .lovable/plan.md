
# Cleanup: unused backend + duplicate content sources

## What's actually orphaned in the backend

Four database tables exist but nothing on the site reads or writes to them — leftovers from an earlier direction where RSVP was going to be handled in-app:

- `invites` — unused
- `guests` — unused
- `rsvp_submissions` — unused (this is what I falsely claimed was live last message)
- `app_config` — unused (RSVP deadline is hardcoded in the translations file instead)

Everything else is in use: `guest_photos` table, `user_roles` table, `guest-photos` storage bucket, all 5 server functions, all 10 MCP tools.

## What's duplicated in code (and how it shows up)

1. **Registry list — defined 3 times with slightly different wording**
   - Home page, `/registry` page, and MCP tool each have their own copy
   - Home page has a broken `href: "#"` on the Honeymoon Fund; other two correctly have no link
   - Honeymoon Fund note reads "after we say I do" on home, "after the barn cools down" everywhere else

2. **Wedding party — defined 2 times, same names**
   - Once in `/wedding-party` page, once in MCP tool
   - Also: the page displays real names in cards but the intro text still says "Names to be announced" — contradicts itself

3. **Photo upload form — built 2 times**
   - Modal component used on home page
   - Separate second form on `/photos` page
   - Both work, both hit the same backend, but any future change has to be made in both places

4. **RSVP button label — 3 different strings** for the same Knot link ("RSVP now", "RSVP on The Knot", "RSVP on The Knot ↗")

5. **Our Story page** — has a hardcoded headline ("From a Tuesday to forever.") and lead paragraph not in the translations file. This is where the "Tuesday" you remembered lives — it's still there on `/our-story`, just not on the home page's story section. Not a duplicate, but worth knowing.

## Proposed fixes

- **Drop the 4 unused tables** via migration (`invites`, `guests`, `rsvp_submissions`, `app_config`) so the backend matches what the site actually does
- **Single source of truth for registry** — one list imported by home page, registry page, and MCP tool; fix Honeymoon Fund link and pick one note
- **Single source of truth for wedding party** — same treatment; remove the "Names to be announced" line since real names are shown
- **Consolidate photo upload** — reuse the `PhotoUploadModal` component on the `/photos` page instead of the parallel form
- **Standardize RSVP button label** to one string across all three spots
- **Confirm Our Story copy** — decide whether the "From a Tuesday to forever" headline stays or gets replaced (I won't touch it without your OK since it's your voice)

## Out of scope

- No new features, no design changes, no visual redesign
- Not touching the Knot RSVP or Zola placeholder URLs — separate conversation
- Not touching any live/used table or function

## What I need from you before/during build

- **OK to drop the 4 unused tables?** (Nothing on the site uses them; safe to remove.)
- **Which Honeymoon Fund note wording do you want** — "after we say I do" or "after the barn cools down"?
- **Keep "From a Tuesday to forever" on the Our Story page?** Yes / rewrite / I'll send new copy
