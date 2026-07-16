-- Replaces the hardcoded `{false && ushers.length > 0 && ...}` conditional
-- in WeddingParty.tsx with the same feature_flags system already used for
-- guest_photo_uploads/rsvp_open, so showing the Ushers section no longer
-- requires a code change and redeploy.
-- Seeded enabled=false to preserve current behavior exactly — the section
-- was deliberately hidden, and this migration must not silently reveal it.

INSERT INTO public.feature_flags (key, label, description, enabled)
VALUES (
  'show_ushers',
  'Show Ushers Section',
  'When on, the Ushers section appears on the Wedding Party page. When off, it stays hidden (the data is preserved either way).',
  false
)
ON CONFLICT (key) DO NOTHING;
