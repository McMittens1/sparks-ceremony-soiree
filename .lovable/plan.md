## Next improvements

### 1. Clean up unused RSVP code
The old invite-code flow is dead now that we point at The Knot.
- Delete `src/lib/rsvp.functions.ts` and any imports of it.
- Remove `src/components/site/PhotoUploadModal.tsx`-adjacent RSVP form pieces if any reference the old flow (verify during build).
- Trim `_authenticated/admin.tsx` sections that manage invites / attendance (keep photo moderation).
- Drop unused i18n strings for the invite-code screen from `src/i18n/dictionaries.ts`.
- Leave DB tables alone (no destructive migration) — just stop reading/writing them.

### 2. Add RSVP call-out to the home page
So guests can RSVP in two clicks from the landing.
- New `RsvpCta` section in `src/routes/index.tsx`, placed after the hero / countdown, before existing sections.
- Content: short "RSVP by [deadline]" line, the couple's names, and the same orange "RSVP on The Knot" button that opens `SITE.rsvpUrl` in a new tab.
- Reuse the button styling from `src/routes/rsvp.tsx` so the two surfaces match.
- Header CTA still deep-links to `/rsvp` for guests who land elsewhere.

### 3. Polish the `/rsvp` landing page
- Add a hero image (reuse one of the engagement photos in `src/assets/engagement/`).
- Show a live countdown to the RSVP deadline using existing `Countdown` component.
- Add supporting links under the button: "See details", "Travel & lodging", "FAQ".
- Tighten copy, keep bilingual via `useT()`.

### 4. Live weather in the MCP `get_weather_forecast` tool
Right now it returns hard-coded climatology.
- Rewrite `src/lib/mcp/tools/weather.ts` to call the existing `/api/public/weather` route server-to-server using `getRequest()` origin (or `process.env` base URL) inside the handler.
- Fall back to the current static payload if the fetch fails, so the tool never errors.
- Re-run `app_mcp_server--extract_mcp_manifest` to refresh `.lovable/mcp/manifest.json`.

### 5. Real wedding party & registry data
Placeholders in `wedding-party.ts` and `registry.ts` (and the matching site pages) get replaced with actual entries.
- Requires the real names/roles and registry URLs from you — I'll ask once we start this step.
- Update both the MCP tool file and the corresponding route page (`src/routes/wedding-party.tsx`, `src/routes/registry.tsx`) so the site and the MCP agree.
- Re-extract the manifest after edits.

### Out of scope
- No schema changes.
- No visual redesign beyond the RSVP surfaces.
- No new MCP tools; OAuth `lookup_my_rsvp` stays skipped since RSVP is off-site now.
