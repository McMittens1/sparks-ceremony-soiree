-- Household phone-last-4 verification for the pre-invitation RSVP lookup
-- flow, plus explicit address-confirmation tracking. Every guests row must
-- carry a phone number going forward — both admin write paths (upsertGuest,
-- importGuestsCsv) now enforce this at the application layer, and this
-- migration backs that with a NOT NULL constraint (the existing row already
-- has a phone, so this is safe today).

ALTER TABLE public.guests
  ALTER COLUMN phone SET NOT NULL;

ALTER TABLE public.guests
  ADD COLUMN phone_verify_failed_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN phone_verify_locked_until    timestamptz,
  ADD COLUMN phone_verify_last_success_at timestamptz,
  ADD COLUMN address_confirmed_at         timestamptz,
  ADD COLUMN address_updated_at           timestamptz;
