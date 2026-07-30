## Context

Lovable and the live site share one database. Publishing ships code only; it never adds, deletes, or overwrites rows. There are no seed scripts and no data sync, so there is no path by which "test data gets published into production." The only real exposure is that test households are visible on the live domain for as long as they exist, and that deleting them leaves a few append-only audit rows behind.

## Recommended safeguards (before you load test data)

**1. Mark test data so it's trivially identifiable and removable**

Prefix every test household's `primary_name` with `ZZTEST — ` and use `invite_notes = 'test'`. Nothing in the schema needs to change. Then cleanup is one query, and a stray survivor is obvious in the admin list rather than looking like a real guest.

**2. Use non-deliverable test emails**

Use `something+test@yourdomain` style addresses you control, or leave email blank. This keeps real inboxes clean and prevents a test address from landing in `suppressed_emails` (which would block mail to it later).

**3. Keep the RSVP feature flag off while testing, or accept live visibility**

Verify the `rsvp_open` flag's real value before you start. With it off, guests can see the page but can't submit — that's the current server-side gate. Any test household you create is still findable by name on the live site while it exists.

**4. Add an admin "test data" filter + purge action**

Small addition to the dashboard: a filter for households matching the test prefix, and a bulk-delete that clears them plus their cascaded RSVPs in one action. This is the safeguard that actually prevents leftovers, because it removes the "did I get them all?" question.

**5. One pre-launch cleanup checklist item**

Before invitations go out: confirm `guests` contains only real households, `rsvps` count is zero, `guest_photos` and the storage bucket are empty, and no real address sits in `suppressed_emails`. Run it as queries, not from memory.

**6. Delete the current test row**

`Test Invitation - The Big Cock Guy & Family` is live in the database right now. It should go before or during this work.

## Ongoing safe workflow

- Schema changes go through migrations, which are additive and reviewed — they never wipe rows. Avoid `DROP COLUMN`/`TRUNCATE` on `guests` or `rsvps` once real data is in.
- Real guest import happens once, through the admin CSV importer, after test data is purged.
- Publishing after that point is always safe: it moves code, not records.

## On the project-knowledge text

Don't paste that block into Lovable project knowledge. It already exists nearly verbatim in `AGENTS.md` and in project memory, and a third copy means three things to keep in sync — which is exactly the drift the rule is trying to prevent.

Better: keep project knowledge to a short pointer that can't go stale, and let `AGENTS.md` stay the single source:

```text
Read AGENTS.md before any work on this repo and follow it exactly.
It defines the docs-are-code rule, the verify-before-asserting rule,
the single-admin invariant, and the definition of done.
```

If a rule changes, it changes in one file.

## Technical notes

- `rsvps.guest_id` is `UNIQUE ... ON DELETE CASCADE`, so household deletion removes the RSVP automatically. No orphans there.
- `guest_photos` has no FK to `guests`; photo deletes already remove the storage object.
- `email_send_log`, `analytics_events`, `suppressed_emails`, and `email_unsubscribe_tokens` have no FK to `guests` and are append-only by policy. They survive household deletion by design. Only `suppressed_emails` has behavioral consequences.
- RSVP edit/verify tokens are HMAC-derived from `RSVP_EDIT_SECRET`, not stored — deleted households leave no token rows.
- Docs (`ONBOARDING.md`, `HANDOFF.md`, `.lovable/plan.md`) get updated in the same turn if the dashboard filter/purge ships.
