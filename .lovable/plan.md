## MCP server improvements

Right now the server exposes only two basic read tools (`get_wedding_info`, `get_countdown`) and is unauthenticated. The site has a lot more useful content to expose, plus one authenticated surface.

### New public tools (no auth)

1. **`get_schedule`** — day-of timeline (ceremony, dinner, dancing) pulled from the details dictionary.
2. **`get_dress_code`** — attire guidance from the details page.
3. **`get_travel_info`** — venue address, map link, hotels blurb, parking blurb.
4. **`get_weather_forecast`** — proxy to the existing `/api/public/weather` route so assistants can pull the live forecast.
5. **`get_faq`** — full FAQ list (`{ question, answer }[]`) from the dictionary. Optional `search` string arg to filter.
6. **`get_wedding_party`** — bridal party roster (once we know what data lives on the wedding-party page — I'll read it during build).
7. **`get_registry_links`** — registry destinations from the registry page.
8. **`get_approved_photos`** — signed URLs for a small page of approved guest photos (`limit`, defaults small; capped in code, not schema).

### New authenticated tool (Supabase OAuth)

9. **`lookup_my_rsvp`** — returns the signed-in guest's party, guests list, and current attending status. Requires the Supabase OAuth resource-server flow.

Enabling per-user auth means:
- Activate the Supabase OAuth authorization server (`configure_oauth_server`).
- Add the consent route at `src/routes/[.]lovable.oauth.consent.tsx` (browser-only, bounces unauth users through `/auth` preserving the `next` param).
- Add `auth: auth.oauth.issuer(...)` to `defineMcp` using the direct `https://<project-ref>.supabase.co/auth/v1` issuer built from `VITE_SUPABASE_PROJECT_ID`.
- Inside `lookup_my_rsvp`, build a per-request Supabase client with `ctx.getToken()` so RLS runs as that user.

Public tools stay unauthenticated and keep working for anonymous clients.

### Polish on existing tools

- Tighten `get_wedding_info` description and add `mapLink` + `address` to the structured payload.
- Rename `get_countdown` output to include both `days` and a human string; keep `readOnlyHint: true`.

### Manifest + verify

After edits, run `app_mcp_server--extract_mcp_manifest` and confirm every tool is listed with correct titles/descriptions (that's what the connector picker shows).

### Files

- `src/lib/mcp/index.ts` — register new tools; add `auth` block.
- `src/lib/mcp/tools/*.ts` — one file per tool above.
- `src/routes/[.]lovable.oauth.consent.tsx` — new consent route (for the OAuth tool only).
- No changes to existing page routes, styles, or components.

### Out of scope

- No changes to the visible website UI.
- No new database tables — everything reads existing tables or the dictionary/site constants.

Want me to go ahead with all nine tools including the OAuth `lookup_my_rsvp`, or keep it public-only for now and skip the OAuth setup?
