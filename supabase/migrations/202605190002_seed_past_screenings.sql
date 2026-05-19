insert into public.venues (name, address, neighborhood, entry_instructions)
values
  ('Lumiere Music Hall', 'Beverly Hills, CA', 'Lumiere Music Hall', 'Archived screening.'),
  ('LOOK Dine-In Cinemas Glendale', '128 Artsakh Ave, Glendale, CA', 'Glendale', 'Archived private screening.'),
  ('1917 Bay St 2nd floor', '1917 Bay St 2nd floor', 'Bay Street', 'Archived private screening.')
on conflict (name) do update
set
  address = excluded.address,
  neighborhood = excluded.neighborhood,
  entry_instructions = excluded.entry_instructions;

with venue_ids as (
  select id, name
  from public.venues
  where name in (
    'Lumiere Music Hall',
    'LOOK Dine-In Cinemas Glendale',
    '1917 Bay St 2nd floor'
  )
)
insert into public.events (
  venue_id,
  slug,
  title,
  kicker,
  description,
  poster_url,
  starts_at,
  doors_at,
  gate_closes_at,
  capacity_standard,
  capacity_overflow,
  status,
  is_invite_only,
  program,
  entry_instructions,
  host_note,
  accessibility_note,
  text_for_entry
)
values
  (
    (select id from venue_ids where name = 'Lumiere Music Hall'),
    'return-of-the-sunday-afternoon-bonkhouse-of-the-dead',
    'The Return of the Sunday Afternoon BONKHOUSE of the Dead',
    'Halloween returns with pre-show and a room full of the living.',
    'The Return of the Sunday Afternoon BONKHOUSE of the Dead, a Halloween-leaning Bonkhouse screening at Lumiere Music Hall.',
    '/posters/return-of-the-sunday-afternoon.webp',
    '2025-10-19 13:00:00-07',
    '2025-10-19 12:15:00-07',
    '2025-10-19 13:10:00-07',
    100,
    20,
    'archived',
    false,
    array['Pre-show', 'Feature one', 'Intermission', 'Feature two'],
    'Archived screening.',
    'Archived past screening.',
    'Archived event.',
    'Archived event.'
  ),
  (
    (select id from venue_ids where name = 'Lumiere Music Hall'),
    'house-house-halloween-double-feature',
    'Bonkhouse and House Pardee Present: HOUSE HOUSE Halloween Double Feature',
    'In this house, houses are born to house the dead.',
    'Bonkhouse and House Pardee presented a Halloween double feature with pre-show at Lumiere Music Hall.',
    '/posters/house-house.webp',
    '2024-10-13 13:00:00-07',
    '2024-10-13 12:15:00-07',
    '2024-10-13 13:10:00-07',
    100,
    20,
    'archived',
    false,
    array['Pre-show', 'Feature one', 'Intermission', 'Feature two'],
    'Archived screening.',
    'Archived past screening.',
    'Archived event.',
    'Archived event.'
  ),
  (
    (select id from venue_ids where name = 'LOOK Dine-In Cinemas Glendale'),
    'infested-creature-double-feature',
    'Sunday Afternoon Bonkhouse Creature Double Feature',
    'This theater is just itching to have you.',
    'A private creature double feature at LOOK Dine-In Cinemas Glendale.',
    '/posters/infested-creature-double-feature.webp',
    '2023-10-22 13:00:00-07',
    '2023-10-22 12:15:00-07',
    '2023-10-22 13:10:00-07',
    100,
    20,
    'archived',
    true,
    array['Pre-show', 'Feature one', 'Intermission', 'Feature two'],
    'Archived private screening.',
    'Archived private screening.',
    'Archived private event.',
    'Archived event.'
  ),
  (
    (select id from venue_ids where name = '1917 Bay St 2nd floor'),
    'retail-rampage-prom-dance-bloodbath',
    'Sunday Afternoon BonkHouse Presents 80''s B-Movie Mystery Double Feature',
    'Retail Rampage. Prom Dance. Bloodbath.',
    'An 80''s B-movie mystery double feature with special pre-show and intermission.',
    '/posters/retail-rampage-prom-dance-bloodbath.webp',
    '2023-07-09 12:00:00-07',
    '2023-07-09 11:15:00-07',
    '2023-07-09 12:10:00-07',
    100,
    20,
    'archived',
    true,
    array['Special pre-show', 'Feature one', 'Intermission', 'Feature two'],
    'Archived private screening.',
    'Archived private screening.',
    'Archived private event.',
    'Archived event.'
  )
on conflict (slug) do update
set
  venue_id = excluded.venue_id,
  title = excluded.title,
  kicker = excluded.kicker,
  description = excluded.description,
  poster_url = excluded.poster_url,
  starts_at = excluded.starts_at,
  doors_at = excluded.doors_at,
  gate_closes_at = excluded.gate_closes_at,
  status = excluded.status,
  is_invite_only = excluded.is_invite_only,
  program = excluded.program,
  entry_instructions = excluded.entry_instructions,
  host_note = excluded.host_note,
  accessibility_note = excluded.accessibility_note,
  text_for_entry = excluded.text_for_entry;
