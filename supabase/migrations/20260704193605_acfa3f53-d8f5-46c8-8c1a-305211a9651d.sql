
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.guests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  primary_name text NOT NULL,
  party_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  invite_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT ALL ON public.guests TO service_role;

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage guests" ON public.guests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX guests_primary_name_trgm ON public.guests USING gin (lower(primary_name) gin_trgm_ops);
CREATE INDEX guests_slug_idx ON public.guests (slug);

CREATE TRIGGER guests_set_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id uuid NOT NULL UNIQUE REFERENCES public.guests(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('attending','not_attending','partial')),
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  address_confirmed boolean NOT NULL DEFAULT false,
  address jsonb,
  song_request text,
  message text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rsvps" ON public.rsvps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER rsvps_set_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
