UPDATE guests
SET max_party_size = 6, updated_at = now()
WHERE max_party_size IS NULL
  AND primary_name ILIKE '%& Family%'
  AND primary_name NOT LIKE 'ZZTEST%'
  AND primary_name NOT LIKE 'ZZT%';