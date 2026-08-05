DELETE FROM rsvps WHERE guest_id IN (SELECT id FROM guests WHERE slug = 'zztsmoke-2026-08-05');
DELETE FROM guests WHERE slug = 'zztsmoke-2026-08-05';