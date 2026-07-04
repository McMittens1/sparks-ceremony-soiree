# Custom RSVP in Lovable Cloud + Text My Wedding

Everything lives on your site. Text My Wedding sends the blast → link points to `/rsvp` → guests fill out the form → responses land in your admin dashboard.

## What guests see on `/rsvp`

Keep the current hero, countdown, and deadline. Replace the "RSVP on The Knot" button with an inline form:

1. **Find your invite** — guest types their name (or last name). We look them up in the guest list. If multiple matches, show a small picker ("Is this you?"). If no match, show a friendly "We can't find you — text Addi at [number]" fallback.
2. **Confirm your party** — shows everyone on their invite (e.g. "Jane Doe + guest", or "The Smith family: John, Sara, kids"). They check who's coming, mark anyone as not attending, and can edit names of "+1" placeholders.
3. **Confirm mailing address** — pre-filled if we have it, editable. Note above: "A paper invite is coming — please confirm your address."
4. **Song request + notes** — Song request, optional message to the couple.
5. **Submit** — thank-you screen with the event details and a "Edit my RSVP" link (they can come back and change it using the same name lookup until the deadline).

## What you see in `/admin`

New "RSVPs" tab next to the existing Photos tab:

- **Summary bar**: attending / not attending / no response / total, plus meal counts.
- **Guest list table**: name, party size, status, address confirmed y/n, meal choices, notes, submitted date. Filter by status, search by name. Export to CSV for the caterer + Text My Wedding reminder lists.
- **Add / edit guests**: paste a CSV or add rows manually (name, party members, phone, address, email). This is your master list — Text My Wedding also uses it.
- **Per-guest detail**: see everything they submitted, edit on their behalf if they call/text you instead.

## How it connects to Text My Wedding

TMW is separate — you upload your guest list there and it sends the texts. The site doesn't send SMS. The link in every text message is just `https://yourdomain.com/rsvp?g=<slug>` where `<slug>` pre-selects that guest so they skip the name lookup. If the link is missed, the name lookup still works from a paper invite.

## Technical details

New tables (all with RLS, admin-only write, public read scoped to a single guest via slug):

- `guests` — id, slug (short random), primary_name, party_members (jsonb array of {name, is_child}), phone, email, address fields, invite_notes, created_at.
- `rsvps` — id, guest_id (fk), status (attending / not_attending / partial), attendees (jsonb: which party members are coming), address_confirmed, address (jsonb, if edited), song_request, message, submitted_at, updated_at.
- One RSVP per guest — upsert on resubmit so guests can edit.

Server functions in `src/lib/rsvp.functions.ts`:

- `lookupGuest({ query })` — public, name search, returns minimal match info.
- `getGuestBySlug({ slug })` — public, returns guest + existing RSVP if any.
- `submitRsvp({ slug, payload })` — public, validates with zod, upserts into `rsvps`.
- `listRsvps()`, `upsertGuest()`, `deleteGuest()`, `importGuestsCsv()`, `exportRsvpsCsv()` — admin only, gated by `has_role(uid, 'admin')`.

Site changes:

- `src/routes/rsvp.tsx` — replace the Knot button with the multi-step form (small component per step, one `useState` state machine, no external form lib needed).
- `src/routes/_authenticated/admin.tsx` — add RSVPs tab alongside Photos.
- `src/lib/site.ts` — remove `rsvpUrl` (The Knot); RSVP is now internal.
- `src/routes/index.tsx` and any other CTA — point "RSVP" at `/rsvp` (already does via router link on most spots; verify).
- i18n strings added to `src/i18n/dictionaries.ts` (EN + ES).

## Out of scope (for this build)

- No SMS sending from the site. TMW handles that.
- No payments, no plus-one approval workflow, no seating chart.
- No changes to any other page — home, story, party, registry, photos, travel all stay exactly as they are.

## What I'll need from you before/during build

1. Skip meal selection.
2. **Deadline enforcement** — hard cutoff (form closes 9/15/26) or soft (still accepts but shows late warning)?
3. **Fallback contact** for guests who can't find their name (phone number or email to show).
4. **Guest list** — you can add it later through the admin; I don't need it to build.