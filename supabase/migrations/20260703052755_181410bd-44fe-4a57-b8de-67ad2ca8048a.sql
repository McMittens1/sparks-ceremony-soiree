
-- Roles infrastructure
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users see their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- invites
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  party_name TEXT NOT NULL,
  max_guests INT NOT NULL DEFAULT 2 CHECK (max_guests > 0 AND max_guests <= 20),
  language TEXT NOT NULL DEFAULT 'en',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invites" ON public.invites FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_invites_updated BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- guests
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES public.invites(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  is_child BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  added_by_guest BOOLEAN NOT NULL DEFAULT false,
  attending BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guests_invite ON public.guests(invite_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage guests" ON public.guests FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_guests_updated BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- rsvp_submissions
CREATE TABLE public.rsvp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL UNIQUE REFERENCES public.invites(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvp_submissions TO authenticated;
GRANT ALL ON public.rsvp_submissions TO service_role;
ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read submissions" ON public.rsvp_submissions FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON public.rsvp_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- guest_photos
CREATE TABLE public.guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  uploader_email TEXT,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guest_photos_status ON public.guest_photos(status);
GRANT SELECT ON public.guest_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_photos TO authenticated;
GRANT ALL ON public.guest_photos TO service_role;
ALTER TABLE public.guest_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see approved photos" ON public.guest_photos FOR SELECT
  TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Admins manage photos" ON public.guest_photos FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- app_config
CREATE TABLE public.app_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rsvp_deadline DATE NOT NULL DEFAULT DATE '2026-09-15',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads config" ON public.app_config FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins update config" ON public.app_config FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_config (id, rsvp_deadline) VALUES (1, DATE '2026-09-15');
