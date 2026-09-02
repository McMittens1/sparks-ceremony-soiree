# Roadmap — after the attendee report (2026-09-02)

## Done recently

- **Chase the non-responders.** Admin RSVPs tab: reachable-by filter, "Still to chase" panel, Text/Mail-call presets, EN/ES reminder copy, chase CSV export.
- **Docs refresh.** `ONBOARDING.md` and `HANDOFF.md` re-verified and re-dated 2026-09-02.
- **Image delivery.** Build-time WebP derivatives (480/800/1200/1600), `ResponsiveImg` srcset/sizes, `fetchPriority` preload fix. ~259 KB at 440px, ~424 KB at 1280px.
- **All Possible Attendees report.** Admin-only `/portal-ga-2026/attendees`, linked from the dashboard headcount panel: 261 total named, 261 max named-only, 483 max possible, 68 confirmed attending, 222 unnamed slots. Household roster, full RSVP table, print/save-as-PDF, CSV export, test households excluded by default. Verified signed-in at 1280/440/print against the live database.

## Open

1. **Wedding Party content** — 27 real names are in `PARTY` but card stats, abilities, and cover headlines are still placeholders, which is why `show_wedding_party` and `show_ushers` are off. Review privately at `/?preview_party=1&preview_ushers=1`.
2. **Guest photo uploads** — built, tested, zero photos, flag off. One toggle plus a moderation-queue QA pass whenever you want it live.
3. **UI/UX + speed recommendations** — reported in chat 2026-09-02; nothing implemented without approval.

## Not worth doing

- ZIP audit against an external geocoder: 0 unverifiable households and 0 recorded failed verification attempts. Revisit only if a guest reports being unable to get in.
