delete from public.rsvps where guest_id in (select id from public.guests where slug like 'ZZT%');
delete from public.guests where slug like 'ZZT%';
update public.feature_flags set enabled = false where key = 'rsvp_open';