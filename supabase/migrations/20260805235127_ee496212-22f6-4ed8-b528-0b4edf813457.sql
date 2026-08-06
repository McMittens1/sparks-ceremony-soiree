INSERT INTO guests (
  slug,
  primary_name,
  party_members,
  phone,
  postal_code,
  max_party_size,
  email,
  address_line1,
  city,
  state,
  country
) VALUES (
  'zztsmoke-2026-08-05',
  'ZZTEST Smoke Household',
  '[{"name":"ZZ Smoke Guest","is_child":false}]'::jsonb,
  '402-555-0199',
  '68522',
  3,
  'geoddison+zztsmoke@gmail.com',
  '123 Test Lane',
  'Louisville',
  'NE',
  'USA'
)
RETURNING id, slug, primary_name, phone, max_party_size;