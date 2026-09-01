with venue as (
  insert into public.venues (name, address, neighborhood, entry_instructions)
  values (
    'Gloria Kaufman Community Center',
    'Culver City, CA',
    'Culver City',
    'Enter through the side gate. Gates close when the movie begins. If the gate is closed, text the host number from your ticket email.'
  )
  on conflict (name) do update
  set
    address = excluded.address,
    neighborhood = excluded.neighborhood,
    entry_instructions = excluded.entry_instructions
  returning id
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
values (
  (select id from venue),
  'society-videodrome-double-feature',
  'DEATH TO BONKHOUSE LONG LIVE THE NEW FLESH - VIDEODROME/SOCIETY DOUBLE FEATURE',
  'Join us for a very fleshy body-horror double feature Sunday.',
  'This October, Bonkhouse celebrates 5 years of bonkers screenings with two of the craziest, goopiest, fleshy-ist cult movies of all time! Join us for Videodrome and Society along with a curated preshow and intermission.',
  '/videodrome-poster.webp',
  '2026-10-18 13:00:00-07',
  '2026-10-18 13:00:00-07',
  '2026-10-18 13:20:00-07',
  80,
  20,
  'published',
  false,
  array['Pre-show trailers', 'Videodrome', 'Intermission', 'Society'],
  'Enter through the side gate. Gates close when the movie begins, but late guests can text the host number posted in the confirmation email.',
  '',
  'The community center has step-free access. Email us if you need a reserved accessible seat.',
  'Sunday, October 18, 2026 at 1:00 PM'
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
  capacity_standard = excluded.capacity_standard,
  capacity_overflow = excluded.capacity_overflow,
  status = excluded.status,
  is_invite_only = excluded.is_invite_only,
  program = excluded.program,
  entry_instructions = excluded.entry_instructions,
  host_note = excluded.host_note,
  accessibility_note = excluded.accessibility_note,
  text_for_entry = excluded.text_for_entry,
  updated_at = now();
