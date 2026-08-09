CREATE TABLE public.guest_import_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'csv_import',
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  guest_count integer NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  restored_at timestamp with time zone
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_import_snapshots TO authenticated;
GRANT ALL ON public.guest_import_snapshots TO service_role;

ALTER TABLE public.guest_import_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage import snapshots"
ON public.guest_import_snapshots
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX guest_import_snapshots_created_at_idx
  ON public.guest_import_snapshots (created_at DESC);