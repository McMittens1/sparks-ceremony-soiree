ALTER TABLE public.guests ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_has_verify_factor CHECK (
    nullif(btrim(coalesce(phone, '')), '') IS NOT NULL
    OR nullif(btrim(coalesce(postal_code, '')), '') IS NOT NULL
  );