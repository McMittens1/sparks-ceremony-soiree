# Household-added guests during RSVP

## What's true today (verified this session)

- `guests.party_members` is a JSON list of `{ name, is_child }` — the people you list on the invitation.
- The RSVP form already lets a household **add** and **remove** rows freely, edit any name, and toggle adult/child. There is no visual difference between someone you invited and someone they typed in.
- The only limit is server-side and invisible: `writeRsvp` rejects a submission larger than `party_members.length + 1`. A household with 4 named members can silently bring 5; a household with 0 named members is capped at 1.
- Added people are saved into `rsvps.attendees` only. Nothing marks them as added, so the dashboard, party-size column, and CSV exports can't tell them apart.

So the capability half-exists, undocumented and unbounded in the wrong places. The work is to make it intentional.

## Recommendation

### 1. Give every invitation an explicit party limit

Add `guests.max_party_size` (integer, nullable). It is the number of people that household may bring, named or not.

- Blank means "no explicit limit set" and falls back to today's behavior (`party_members.length + 1`), so nothing breaks for households already imported.
- Admin editor shows it next to the member list with live helper text: *"3 named + 1 open slot = 4 total."*
- Set it once per invitation. This is the single knob that makes "plus-one" and "two kids we don't know the names of" work without any special-case flags.

### 2. Guest-facing flow — same card list, one honest counter

Keep the existing card list; the mental model already works. Three additions:

- A line under "Your party": *"Your invitation includes up to 4 guests. 3 are listed below — you may add 1 more."*
- The **+ Add guest** link disappears once the cap is reached, replaced by *"Your invitation is for 4 guests. If something's changed, reply to this email / contact us."*
- Rows the household adds get a small "Added by you" tag and can be removed; rows you listed can be marked not attending but **not** deleted (prevents a household quietly swapping your named guests for others). Their names stay editable — that covers a misspelling or "Maria" who now goes by "Mia".

On mobile this is unchanged structurally: one stacked card per person, pills wrap as they do now. No modal, no separate "add a plus-one" screen.

### 3. Names are required, with an honest escape hatch

A blank name can't be submitted (already true). But for the "plus-one I haven't asked yet" case, forcing a fake name is worse than allowing an explicit placeholder. So:

- The name field on an added row accepts a real name **or** the household can tap **"Name to come"**, which stores the name as `Guest of {primary_name}` and marks the row `name_pending`.
- The confirmation screen and email tell them: *"You can add their name later using the link in this email."* The existing edit-token link already supports that — no new mechanism.
- Admin dashboard shows pending names in amber so you can chase them before the final count goes to the caterer.

### 4. Labeling

Reuse the existing adult/child pills — don't invent a third "plus-one" type the guest has to reason about. The label is derived, not chosen:

- `added_by_guest` is set **server-side** by comparing the submitted name against `party_members` (never trusted from the browser).
- Admin sees a derived label: `Invited`, `Added — adult`, `Added — child`, `Added — name pending`.

### 5. No admin review queue

Adds inside the cap are accepted automatically. A review queue means every RSVP needs your attention on the couple's timeline, and the cap already does the real gatekeeping. Instead you get **notification + visibility**: the admin RSVP email says "includes 1 guest added by the household", and the dashboard flags it.

### 6. Admin portal, exports, totals

- **RSVPs tab:** party-size column becomes `4 / 5` (attending / invitation cap), with a `+1 added` chip when the household added anyone.
- **New filter:** "Has added guests" and "Name pending", alongside the existing filters.
- **Attendee detail:** each name badged `Invited` / `Added`.
- **Master CSV:** new columns `max_party_size`, `added_guests`, `names_pending` — round-trippable through the existing importer, which also learns the `max_party_size` column.
- **Summary totals:** unchanged in meaning (headcount is headcount), plus a separate "added by households" stat so the delta from your original list is visible at a glance.
- **One-click promote:** an added guest can be pushed into `party_members` so your master list converges on reality.

### 7. Edits and removals later

No new surface. The existing signed edit link reopens the same form with the same rules: added rows removable, invited rows not, cap enforced. Admin can edit or delete any attendee from the dashboard, as now.

## Technical notes

- Migration: `ALTER TABLE public.guests ADD COLUMN max_party_size integer` + a validation trigger (not a CHECK, per project convention) rejecting values below `jsonb_array_length(party_members)`. No RLS or GRANT change — existing policies cover the column.
- `AttendeeChoice` gains `added_by_guest?: boolean` and `name_pending?: boolean`. Both are **stamped in `writeRsvp`**, ignored if sent by the client.
- `writeRsvp` cap check becomes `max_party_size ?? party_members.length + 1`, and additionally rejects a submission that drops an invited member's row entirely.
- `verifyHouseholdAccess` returns `max_party_size` on `PublicGuest` so the form can render the counter — it's not sensitive.
- New copy goes in `src/i18n/dictionaries.ts` (EN + ES), never inline.
- Verification: `bun run build:dev`, then Playwright at 440 and 1280 through a `ZZTEST` household — add a guest, hit the cap, submit with a pending name, reopen the edit link and fill the name in. Confirm the row in the DB and the badges in the dashboard.
- `ONBOARDING.md`, `HANDOFF.md`, and this roadmap get updated in the same turn.

## Open question

Households already imported have no `max_party_size`. I'll leave them on the fallback and add a dashboard nudge showing how many invitations still need an explicit limit, so you can set them as you finish entering names — rather than guessing a value for you.
