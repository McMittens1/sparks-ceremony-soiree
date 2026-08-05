# Launch readiness — finish open items now that RSVPs are live

## Current state (verified this session)

- `rsvp_open` is **true** in `feature_flags` — guests can now submit.
- `guests` holds **78 real households**, **0 test rows**, **0 rows without a verification factor**.
- **37 households have an explicit `max_party_size`** (from the placeholder cleanup).
- **41 households still use the fallback limit** (`named_count + 1`).
- `show_wedding_party`, `guest_photo_uploads`, and `show_ushers` remain off.
- The placeholder cleanup, importer/editor guardrails, and accessibility fixes from the last session are in the codebase but may not be on the published deployment yet.

## Proposed work

### 1. Re-publish the site (critical)

The recent fixes — placeholder rejection in the importer, the `partyCounterHint` copy, the `is_child` default fix, and the accessibility pass — only help guests once they're deployed. Publish now so the live site matches the codebase.

### 2. Triage the 41 default-limit households (critical)

With `rsvp_open` true, wrong fallback caps are no longer theoretical. A family with three unnamed children can hit the cap too early; a single guest with no plus-one gets an uninvited extra slot.

Two options:

- **A. Quick safe default:** apply a blanket cap to the 41 remaining households based on what you know about the shape of each invitation, then tune individuals in the dashboard.
- **B. Per-household review:** go through them in `/portal-ga-2026/dashboard` → RSVPs → filter **DEFAULT LIMIT** and set real numbers.

I recommend **A for speed** if invitations are already going out, then **B as a follow-up** over the next day or two.

### 3. Run one real end-to-end RSVP smoke test (critical)

Now that `rsvp_open` is true, verify the full public path on the *published* URL:

- Find a real household via public lookup.
- Complete the correct verification factor (phone last-4 or ZIP).
- Add a guest if the cap allows, submit with and without email.
- Confirm the admin-notification email lands in `geoddison@gmail.com`.
- Delete the test RSVP so the real count stays clean.

If you don't want to touch a real household, we can create a temporary `ZZTEST` household, smoke-test it, and purge it.

### 4. Export the master CSV backup (critical)

Before any more bulk edits or imports, export the full guest list from the dashboard. This is the file to use for future imports.

### 5. Optional but worth considering before guests dig in

- **Wedding Party content:** still hidden behind `show_wedding_party = false`. If you want it live, provide copy/photos; otherwise leave it off.
- **Story-section photos:** entries 01–04 and 06 are still placeholders. Fine for launch, but guests will notice.
- **Analytics sanity check:** confirm real `rsvp_submit` events are landing once submissions start.

## Risks if we skip the critical items

- **No publish:** guests see the old build, including the instructional placeholders and the pre-fix verification behavior.
- **No cap triage:** wrong limits lead to either frustrated families or uninvited plus-ones.
- **No smoke test:** you discover a broken flow from a real guest instead of from a controlled test.
- **No backup:** a bad import after launch has no recovery path.

## Verification

- `bun run build:dev` passes.
- Playwright at 440px and 1280px on the published URL after deploy.
- Admin-notification email logged to `geoddison@gmail.com`.
- Master CSV exported and inspected.

## Suggested order for this session

1. Publish.
2. Triage default-limit households (quick blanket pass, or per-household if you prefer).
3. Smoke-test one RSVP on the published site.
4. Export master CSV.
5. Update `ONBOARDING.md` and `HANDOFF.md` "Last verified" dates and the `rsvp_open` / `max_party_size` snapshot.
