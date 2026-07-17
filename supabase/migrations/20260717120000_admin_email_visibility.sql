-- Admin visibility into email delivery. email_send_log, suppressed_emails,
-- and email_send_state today only grant access to service_role (see
-- 20260714030005_email_infra.sql) — there is no admin-facing read path at
-- all. This adds a read-only admin policy for each, following the same
-- has_role(auth.uid(), 'admin') pattern already used on guests/rsvps/
-- feature_flags. SELECT-only: admins observe delivery status, they don't
-- mutate queue/log state — suppressed_emails stays append-only by its
-- existing design, and email_send_state writes remain a service_role
-- concern owned by the queue processor.
--
-- A GRANT is required in addition to the RLS policy: these tables were
-- created with `GRANT ALL ... TO service_role` only, no
-- `GRANT ... TO authenticated` at all, so without this the authenticated
-- role is denied before RLS is even evaluated.

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT SELECT ON public.suppressed_emails TO authenticated;
GRANT SELECT ON public.email_send_state TO authenticated;

DO $$ BEGIN
  CREATE POLICY "Admins can read email send log" ON public.email_send_log
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read suppressed emails" ON public.suppressed_emails
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read email send state" ON public.email_send_state
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
