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

## Safe to fix shortly after launch

- Sitemap only lists `/` and `/rsvp`; fine unless new pages are added.
- `guest_photo_uploads` stays off (correct pre-wedding).
- `show_ushers` stays off.
- Analytics only has test events; confirm real events land after launch.
- No automated guest-list backup; export weekly.

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
