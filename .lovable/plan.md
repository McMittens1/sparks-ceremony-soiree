# Sparks' Barn Wedding Site — Updated Plan

## 1. Design system

- Palette tokens in `src/styles.css` (oklch equivalents):
  - `--background` ivory `#FAF6F0` · `--foreground` charcoal `#3A342E`
  - `--primary` deep plum-lavender `#6E5C87` · `--primary-soft` lavender `#B7A6D4`
  - `--accent` tan chambray `#C6A97C`
  - Derive `card`, `muted`, `border`, `ring` from these.
- Fonts loaded via `<link>` in `__root.tsx` head: Fraunces (headlines), Inter (body), one script (Petit Formal Script) reserved *only* for the couple's names.
- Primitives: `<SectionDivider />` (thin lavender floral sprig SVG), `<EditorialGrid />`, `<FullBleedImage />` with warm ivory overlay, `<Reveal />` (IntersectionObserver, respects `prefers-reduced-motion`), `<Footer />` with "Made with love by Geo".
- Motion via Motion for React only on hero, timeline, schedule.

## 2. Route structure

```
src/routes/
  __root.tsx            fonts, shell, Footer, LanguageProvider
  index.tsx             Home — hero + live countdown to 2026-10-10
  our-story.tsx         animated vertical timeline
  details.tsx           venue + animated day-of schedule (placeholder times)
  wedding-party.tsx     portraits grid
  travel.tsx            embedded map, hotels, parking, weather widget
  photos.tsx            approved gallery + guest upload form
  registry.tsx          outbound registry cards
  rsvp.tsx              lookup → editable party form → recap confirmation
  faq.tsx               accordion
  auth.tsx              admin sign-in (email/password)
  _authenticated/
    route.tsx           managed auth gate
    admin.tsx           RSVP dashboard + photo approval queue
  api/public/
    weather.ts          server route: cached NWS forecast/climatology
```

Each page has its own `head()` (title, description, OG). Leaf hero images wired to `og:image`.

## 3. Data model (Lovable Cloud)

```
invites
  id uuid pk
  code text unique                -- short lookup code
  party_name text
  max_guests int                  -- hard cap on party size
  language text default 'en'
  notes text                      -- admin only
  created_at timestamptz

guests
  id uuid pk
  invite_id uuid fk invites on delete cascade
  full_name text
  is_child boolean default false  -- NEW: adult/child split
  is_primary boolean default false
  added_by_guest boolean default false  -- true when created via RSVP form
  attending boolean               -- null = pending
  created_at timestamptz
  updated_at timestamptz
  -- No meal_choice, no dietary_notes.

rsvp_submissions                  -- one row per party submission
  id uuid pk
  invite_id uuid fk invites unique  -- unique → resubmissions upsert
  contact_email text
  contact_phone text
  message text
  submitted_at timestamptz default now()
  updated_at timestamptz

guest_photos
  id uuid pk
  storage_path text                -- object in 'guest-photos' bucket
  uploader_name text
  uploader_email text
  caption text
  status text default 'pending'    -- 'pending' | 'approved' | 'rejected'
  reviewed_by uuid                 -- auth.users.id
  reviewed_at timestamptz
  created_at timestamptz

app_config                          -- single-row settings
  id int pk default 1 check (id = 1)
  rsvp_deadline date default '2026-09-15'

app_role enum ('admin')
user_roles (id, user_id fk auth.users, role app_role, unique(user_id, role))
has_role(_user_id uuid, _role app_role) security definer
```

RLS:
- `invites`, `guests`, `rsvp_submissions`: no anon read/write. All guest-facing access goes through server functions (validated invite code). Admin reads gated by `has_role(auth.uid(),'admin')`.
- `guest_photos`: anon `SELECT` **only** where `status = 'approved'`; inserts via server function; admin full access via `has_role`.
- `app_config`: anon `SELECT` (deadline is public); admin `UPDATE`.
- All new public tables get explicit `GRANT`s per platform rule.

Storage: private bucket `guest-photos`; approved images served via signed URLs (or via a public path only after approval — using signed URLs keeps rejected uploads inaccessible).

## 4. RSVP flow

Server functions (`src/lib/rsvp.functions.ts`):
- `lookupInvite({ query })` — matches on code (exact) or party/guest name (case-insensitive). Returns `{ invite: {party_name, max_guests, language}, guests: [{id, full_name, is_child, attending}], deadlinePassed }`. No emails/notes.
- `submitRsvp({ inviteId, guests: [{id?, full_name, is_child, attending}], contactEmail, contactPhone, message, honeypot })` —
  - Reject if honeypot is non-empty (return generic success to not tip off bots).
  - Reject if `now() > app_config.rsvp_deadline`.
  - Zod validation (name length caps, email format, phone optional).
  - Enforce `guests.length <= invite.max_guests`; return inline field error `TOO_MANY_GUESTS` with the cap.
  - In a single transaction:
    - Delete guests belonging to this invite whose id is not in the incoming list AND were `added_by_guest = true` (preserves pre-seeded names even if unchecked).
    - For pre-seeded guests present in payload: update `attending`, `is_child`, `full_name`, `updated_at`.
    - For payload rows without id: insert with `added_by_guest = true`.
    - Upsert `rsvp_submissions` by `invite_id` (unique) — resubmission updates the same row.
  - Return the canonical recap: `{ partyName, guests: [{full_name, attending, is_child}], contactEmail }`.
  - Fire confirmation email (see §5). Email failure is logged but does not fail the submission.

`/rsvp` UI:
1. Deadline check on load → if passed, render "RSVP period has closed" panel; no form.
2. Single lookup input (name or code).
3. Party editor: list existing guests with attending toggle + adult/child selector + editable name; "+ Add guest" button up to `max_guests`; inline error when exceeded.
4. Contact email (required), phone (optional), short note (optional).
5. Hidden `<input name="website">` honeypot (visually hidden, `tabIndex={-1}`, `autocomplete="off"`).
6. Submit → server function → recap screen listing each guest name + attending/declined status and a "Change your response" link that re-opens the editor (server upserts, no duplicates).

## 5. Confirmation email

- Brevo connector via the Lovable connector gateway (server-side only).
- Sent from `sendRsvpConfirmation` invoked inside `submitRsvp`.
- Content (EN/ES per `invite.language`): thank-you line, party name, itemized list of who is attending / not attending (no meal info), event date + venue, link back to the site to update before the deadline.
- Idempotency: keyed on `rsvp_submissions.id` + `updated_at` so a resubmit sends an updated confirmation once.

## 6. Admin dashboard (`/_authenticated/admin`)

Two sections, gated by `has_role(auth.uid(),'admin')` inside the loader server fn:

**RSVPs**
- Top cards: Attending / Declined / Pending party counts, plus headcount totals split **adults vs. children** (attending only).
- Table of invites → expandable to guests, showing attending status, adult/child, submitted_at, contact.
- CSV export of the full guest list.

**Guest photo queue**
- Grid of pending uploads with uploader name/email, caption, timestamp, and Approve / Reject buttons.
- Approve → sets `status='approved'`; Reject → sets `status='rejected'` (row kept for audit; object stays in private bucket, no public exposure).
- Tab to view already-approved and rejected items.

## 7. Photos page

- Public gallery reads only `guest_photos` where `status = 'approved'`, ordered by `reviewed_at`. Signed URLs generated server-side, cached briefly.
- Upload form (below gallery): name, optional email, optional caption, file input (images only, ≤10 MB, max 5 per submission). Client-side type/size guards + Zod on the server. Uploads write to the private bucket via a server function using `supabaseAdmin` after validating input; inserts `guest_photos` rows with `status='pending'`. Success message states photos will appear after approval. Honeypot field here too.

## 8. Travel page weather widget

- Server route `/api/public/weather` returns typical early-October conditions for Louisville, NE (climatology averages: high/low, precip probability, sunset time on Oct 10) plus, if within 10 days of the event, the live NWS forecast from `api.weather.gov` (no key required). Response cached in-memory per worker for 1h.
- Widget displays: expected high/low, chance of rain, sunset time, and a short "what to pack" line (layers, light jacket for the barn evening). Client component with `Reveal`.

## 9. Internationalization (EN/ES)

- Lightweight custom i18n: `src/i18n/{en,es}.ts` dictionaries, `LanguageProvider` in `__root.tsx`, `useT()` hook, header toggle persisted to `localStorage` and mirrored to `<html lang>`.
- All static copy authored in both languages; RSVP validation messages, deadline-closed panel, upload states, weather labels, and confirmation email all translated. Language defaults to invite's `language` on the RSVP page.

## 10. Connectors & prerequisites (before code)

1. **Lovable Cloud** — enable (auth + Postgres + storage + server functions).
2. **Brevo connector** — link via standard connectors; `BREVO_API_KEY` becomes server env var.
3. Google Maps embed uses a plain `<iframe>` URL — no API key needed.
4. Weather uses NWS public API — no key.

## 11. Build order

1. Enable Cloud, link Brevo, create `guest-photos` private bucket.
2. Design tokens, fonts, layout primitives, Footer, LanguageProvider.
3. Static pages: Home, Our Story, Details, Wedding Party, Registry, FAQ.
4. Migrations: enum, tables, `app_config` seed (`2026-09-15`), GRANTs, RLS, `has_role`, sample invites.
5. RSVP server functions + `/rsvp` UI (lookup, editable party, deadline, honeypot, recap) + Brevo confirmation email.
6. Travel page + weather server route + widget.
7. Photos page + upload server function + admin approval queue.
8. Auth page + admin dashboard (RSVP summary with adult/child totals + photo queue) + admin role seed.
9. EN/ES pass across all copy + email templates.
10. Polish: scroll reveals, hover states, SEO metadata per route, OG images.

## Technical notes

- All RSVP mutations go through `createServerFn`; no client-side Supabase writes to invite/guest tables.
- `submitRsvp` uses `supabaseAdmin` loaded inside the handler after honeypot + deadline + Zod checks pass.
- Admin queries use `requireSupabaseAuth` + `has_role` check, then `supabaseAdmin` for aggregates.
- Countdown uses `useSyncExternalStore` on a 1s interval; SSR fallback shows the date only.
- Storage: private bucket + signed URLs so rejected uploads are never publicly reachable.
- No meal or dietary fields exist anywhere in schema, forms, emails, or admin views.
