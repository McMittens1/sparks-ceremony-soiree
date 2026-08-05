# Registry update — remove Zola, add Amazon

Last updated: 2026-08-05. Supersedes the launch-day plan (archived under
`.lovable/plan/`); the launch checklist items still stand and are restated at
the end.

## What changes

The registry becomes two entries plus the two Venmo options:

1. **The Knot** — promoted to the lead card (lavender-wash, larger type, filled
   button). Note copy rewritten so it no longer references Zola or reads as a
   secondary option.
2. **Amazon** — new secondary card linking to
   `https://www.amazon.com/wedding/guest-view/1YLU6E2G4SSFK`.
3. **Venmo · Geo** and **Venmo · Addi** — unchanged, still secondary cards.

Zola is deleted, not hidden.

## Files touched

- `src/lib/wedding-data.ts` — the only source of registry content. Remove the
  Zola entry, move `lead: true` to The Knot, add the Amazon entry, and reword
  The Knot's note. Also fix the stale `/** True for the lead (Zola) card */`
  comment on `RegistryItem.lead`.
- `HANDOFF.md` — one line in the analytics section cites a verified
  `registry_click` row with `{"name": "Zola"}` as evidence. Reword to describe
  the event without naming a removed registry.
- `ONBOARDING.md` — bump "Last verified" and note the registry change.

No other code needs editing. `RegistrySection.tsx`, the MCP
`get_registry_links` tool, the analytics `registry_click` event, the header/nav,
and the admin portal all read from `REGISTRY` and update automatically. The
admin portal has no registry surface. Nothing in the email templates or the
database references a registry provider.

## Design consistency

The existing card component already handles lead vs. secondary treatment, so
The Knot inherits the lavender-wash lead styling and Amazon inherits the plain
ivory card with the underlined lavender link. Layout is a responsive stack that
already handles four cards — no grid or spacing changes needed. CTA labels stay
in the existing voice: "Visit registry" for both registries, "Open Venmo" for
the Venmo cards.

## Verification

1. `bun run build:dev`.
2. Playwright screenshots of the registry section at 440px and 1280px,
   confirming The Knot reads as primary and Amazon renders as a peer of the
   Venmo cards.
3. Assert in the rendered DOM that no `zola.com` href and no "Zola" text exist
   anywhere on the page, and that all registry links carry
   `target="_blank" rel="noopener"`.
4. HTTP-check the Amazon guest-view URL resolves (Amazon may bot-block a raw
   fetch; if so, confirm the URL shape against the pattern Amazon uses and note
   that a human click-through is the final check).
5. Repo-wide `rg -i zola` returns nothing outside archived plan files.

## Still outstanding for launch

Unchanged from the launch-day checklist: publish, set `max_party_size` where
known, flip `rsvp_open` on, smoke-test RSVP at 440/1280, confirm the admin
alert lands in `geoddison@gmail.com`, export the master CSV.
