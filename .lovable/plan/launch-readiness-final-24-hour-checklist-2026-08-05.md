# Launch readiness — final 24-hour checklist

Last updated: 2026-08-05. Supersedes the registry-update plan; that work is shipped and verified.

## Where we are

- Registry: Zola removed, The Knot promoted to lead, Amazon added. Verified rendered at 440px and 1280px; no `zola.com` or "Zola" text remains in the live page.
- Wedding Party: hidden behind `show_wedding_party = false`. Section and nav numerals stay contiguous (I–VII).
- Admin notifications: `ADMIN_NOTIFICATION_EMAILS` now points to `geoddison@gmail.com` (takes effect on next deploy).
- Guest list: 86 real households, 0 `ZZTEST` rows, 0 RSVPs. Every household has a verification factor (phone or ZIP).
- `rsvp_open` is still `false`.
- `max_party_size` is unset on all 86 households, so every invitation currently uses the fallback limit: everyone named + one open slot.

## What we still need to do before RSVPs open

1. **Set explicit `max_party_size` for households that need it.**
   - The fallback (`named_count + 1`) is correct for most households, but wrong for families with two+ unnamed kids and wrong for single guests who should not have a plus-one.
   - This is data entry in `/portal-ga-2026/dashboard`, not code. The RSVPs tab has a "Default limit" filter and badge to spot rows that still use the fallback.
   - Risk if skipped: guests either cannot RSVP their whole family, or they can add uninvited plus-ones.

2. **Publish the site.**
   - Publishing deploys the code that already has the new `ADMIN_NOTIFICATION_EMAILS` value. Until you publish, admin alerts still route to the old mailbox.
   - Risk if skipped: when `rsvp_open` flips on, you won't receive RSVP notifications at `geoddison@gmail.com`.

3. **Flip `rsvp_open` to true in the admin Features tab.**
   - No code change needed. The flag is in `/portal-ga-2026/dashboard` → Features.
   - Risk if skipped: guests see "RSVPs open soon" and cannot submit.

4. **Smoke-test one real RSVP end-to-end.**
   - Lookup by name, complete the correct verification factor, add a guest if the cap allows, submit with and without an email, then re-open the edit link from the confirmation email.
   - Check 440px and 1280px.
   - Verify the admin-notification email lands in `geoddison@gmail.com`.
   - Delete the test RSVP afterward so the real count stays at 0 when invitations go out.

5. **Export the master CSV as a backup.**
   - The dashboard has an export. Save it before invitations mail.

## Adding households after launch

You can add households at any time, even after guests start RSVPing. The public lookup sees new rows immediately, so plan for these guardrails:

1. **Always export the guest CSV before bulk imports.**
   - Once real RSVPs exist, a bad import is the fastest way to lose responses or break edit links. Save a dated backup first.

2. **Verify the importer is upsert-only and RSVP-safe.**
   - The dashboard CSV import should match on `slug` (or generate one) and update only the household fields (`primary_name`, `party_members`, `phone`, `postal_code`, `address`, `max_party_size`, etc.) without touching `rsvps` rows.
   - It must not drop existing RSVPs, reset verification lockouts, or regenerate slugs for existing households — that would invalidate emailed edit links.
   - If the importer does a full replace instead of an upsert, we need to fix it before you import after launch.

3. **Every new household needs a verification factor before it goes live.**
   - The DB constraint `guests_has_verify_factor` blocks rows with neither phone nor ZIP, but the UI/import should warn you at entry time so you don't create an unverifiable household.
   - Phone last-4 is preferred where you have it; ZIP is the fallback.

4. **Set `max_party_size` at creation time when you know it.**
   - Otherwise the new household falls back to `named + 1` like everyone else.
   - For families with unnamed kids, set the cap to the real total; for single guests with no plus-one, set it to 1.

5. **Slugs must stay unique and stable.**
   - The importer should generate slugs deterministically or validate uniqueness. A collision on a new row will fail the insert; a changed slug on an existing row breaks the edit link in the guest's confirmation email.

6. **Don't reuse the `ZZTEST` prefix for real households.**
   - `ZZTEST` is the purge-able test marker. Real last-minute additions should use normal primary names.

7. **Smoke-test the first post-launch addition.**
   - Add one household, verify it appears in public lookup, complete its verification factor, submit a test RSVP, then delete the test RSVP. This confirms the import → lookup → verify → submit pipeline still works with real RSVPs in the table.

## Safe to fix shortly after launch

- Sitemap only lists `/` and `/rsvp`; fine unless new pages are added.
- `guest_photo_uploads` stays off (correct pre-wedding).
- `show_ushers` stays off.
- Analytics only has test events; confirm real events land after launch.
- No automated guest-list backup; export before every import and weekly otherwise.

## Optional improvements (behind flags, no launch blocker)

- Wedding Party personalization copy and photos (`show_wedding_party` stays off until ready).
- Real per-entry Story-section photos.
- Additional per-household party caps as more headcounts become known.

## Proposed order for this session

1. Publish (so notification email takes effect).
2. Set `max_party_size` for the households you know about now.
3. Flip `rsvp_open` on.
4. Run the end-to-end smoke test and confirm the alert reaches `geoddison@gmail.com`.
5. Export the master CSV.
6. Update `ONBOARDING.md` and `HANDOFF.md` "Last verified" dates and the `rsvp_open` / `max_party_size` snapshot.
7. (If time) Verify the CSV importer is upsert-only and document the post-launch import checklist in `ONBOARDING.md`.
