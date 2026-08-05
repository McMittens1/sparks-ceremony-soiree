update public.feature_flags set enabled = true where key = 'rsvp_open';
insert into public.guests (slug, primary_name, party_members, phone, postal_code, max_party_size)
values ('zzt-smoke-launch','ZZTEST Smoke Launch','[{"name":"Smoke Tester"}]'::jsonb,'5551230099','60614',3)
on conflict (slug) do update set primary_name = excluded.primary_name;