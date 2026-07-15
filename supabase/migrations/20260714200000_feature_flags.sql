-- Feature flags: admin-toggleable switches for guest-facing features
-- (e.g. guest photo uploads) that don't require a code deploy to flip.
-- Publicly readable (so guest-facing pages can check flag state), only
-- admins can change values. New features register a row here; the admin
-- dashboard's Features tab renders whatever rows exist with no code
-- changes needed per-flag.

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Everyone reads feature flags" ON public.feature_flags
    FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage feature flags" ON public.feature_flags
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_feature_flags_updated BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.feature_flags (key, label, description, enabled)
VALUES (
  'guest_photo_uploads',
  'Guest Photo Uploads',
  'Guests can upload photos from the homepage Photos section, and approved photos appear in the public gallery there.',
  false
)
ON CONFLICT (key) DO NOTHING;
