
CREATE POLICY "Admins read guest-photos objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'guest-photos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage guest-photos objects" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'guest-photos' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'guest-photos' AND public.has_role(auth.uid(),'admin'));
