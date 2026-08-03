ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS max_party_size integer;

CREATE OR REPLACE FUNCTION public.validate_guest_max_party_size()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  named integer;
BEGIN
  IF NEW.max_party_size IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.max_party_size < 1 THEN
    RAISE EXCEPTION 'max_party_size must be at least 1';
  END IF;
  named := COALESCE(jsonb_array_length(NEW.party_members), 0);
  IF NEW.max_party_size < named THEN
    RAISE EXCEPTION 'max_party_size (%) cannot be less than the % people already listed', NEW.max_party_size, named;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_guest_max_party_size ON public.guests;
CREATE TRIGGER validate_guest_max_party_size
BEFORE INSERT OR UPDATE ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.validate_guest_max_party_size();