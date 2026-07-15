-- Bring RSVP under the same feature_flags system as guest_photo_uploads,
-- replacing the hardcoded RSVP_OPEN constant in src/routes/rsvp.tsx.
-- Seeded enabled=true: RSVP has been live since it was opened in an
-- earlier sprint, and this migration must not silently close it.

INSERT INTO public.feature_flags (key, label, description, enabled)
VALUES (
  'rsvp_open',
  'RSVP Submissions',
  'When on, guests can look up their invitation and submit or edit their RSVP. When off, the RSVP page stays visible with a "not open yet" message and the form disabled.',
  true
)
ON CONFLICT (key) DO NOTHING;
