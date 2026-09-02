-- Screenings: the events table becomes the single source of truth for
-- everything the public site shows, including the ticket-art fields that used
-- to be hand-written in public/events.js. Apply in the Supabase SQL editor
-- (or `supabase db push`) BEFORE deploying the matching site code.

-- 1. Presentation columns (additive; existing rows keep working).
alter table public.events
  add column if not exists badge text not null default '',
  add column if not exists poster_alt_url text;

-- 2. Public read model. Adds the new columns, a live seat counter (so the site
-- can say "waitlist only"), and is_upcoming: the ONE definition of a current
-- screening — published, and less than 6 hours past showtime. Everything else
-- is a past screening. Dropped and recreated because column order changes.
drop view if exists public.public_events;
create view public.public_events
with (security_invoker = off) as
select
  e.id,
  e.slug,
  e.title,
  e.subtitle,
  e.kicker,
  e.description,
  e.poster_url,
  e.poster_alt_url,
  e.logo_url,
  e.badge,
  e.starts_at,
  e.ends_at,
  e.doors_at,
  e.gate_closes_at,
  e.capacity_standard,
  e.capacity_overflow,
  e.max_tickets_per_rsvp,
  e.rsvp_opens_at,
  e.rsvp_closes_at,
  e.status,
  e.is_invite_only,
  e.program,
  e.entry_instructions,
  e.accessibility_note,
  v.name as venue_name,
  v.address as venue_address,
  v.neighborhood as venue_neighborhood,
  (select count(*) from public.tickets t where t.event_id = e.id and t.status = 'valid') as tickets_claimed,
  (e.status = 'published' and e.starts_at > now() - interval '6 hours') as is_upcoming
from public.events e
left join public.venues v on v.id = e.venue_id
where e.status in ('published', 'archived');

grant select on public.public_events to anon, authenticated;

-- 3. RSVPs close when the gate closes unless an explicit close time is set
-- (what the admin form has always promised). Only that one line changed.
create or replace function public.create_reservation_atomic(
  event_uuid uuid,
  p_guest_name text,
  p_guest_email text,
  p_quantity integer,
  p_invite_code text,
  p_cancel_token_hash text,
  p_token_hashes text[]
)
returns table (reservation_id uuid, seat_types text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.events%rowtype;
  taken integer;
  queued integer;
  seats text[] := array[]::text[];
  seat text;
  res_id uuid := gen_random_uuid();
  res_status text;
  i integer;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 10
     or p_token_hashes is null
     or array_length(p_token_hashes, 1) is distinct from p_quantity
     or coalesce(trim(p_guest_name), '') = ''
     or coalesce(trim(p_guest_email), '') = '' then
    raise exception 'invalid reservation request';
  end if;

  select * into ev from public.events where id = event_uuid for update;
  if not found or ev.status <> 'published' then
    raise exception 'event not open';
  end if;

  if ev.rsvp_opens_at is not null and now() < ev.rsvp_opens_at then
    raise exception 'rsvp not open yet';
  end if;
  if now() > coalesce(ev.rsvp_closes_at, ev.gate_closes_at) then
    raise exception 'rsvp closed';
  end if;
  if p_quantity > coalesce(ev.max_tickets_per_rsvp, 4) then
    raise exception 'over ticket limit';
  end if;

  if ev.is_invite_only then
    perform 1 from public.invite_codes
    where event_id = event_uuid
      and code = upper(coalesce(p_invite_code, ''))
      and is_active = true
      and used_count < max_uses;
    if not found then
      raise exception 'invite code required';
    end if;
  end if;

  select count(*) into taken from public.tickets
  where event_id = event_uuid and status = 'valid';

  select count(*) into queued from public.tickets
  where event_id = event_uuid and status in ('valid', 'waitlisted');

  for i in 1..p_quantity loop
    if taken + i - 1 < ev.capacity_standard then
      seat := 'standard';
    elsif taken + i - 1 < ev.capacity_standard + ev.capacity_overflow then
      seat := 'overflow';
    else
      seat := 'waitlist';
    end if;
    seats := seats || seat;
  end loop;

  res_status := case when seats <@ array['waitlist'] then 'waitlisted' else 'confirmed' end;

  insert into public.reservations (id, event_id, guest_name, guest_email, quantity, status, invite_code, cancel_token_hash)
  values (res_id, event_uuid, p_guest_name, p_guest_email, p_quantity, res_status, nullif(p_invite_code, ''), p_cancel_token_hash);

  for i in 1..p_quantity loop
    insert into public.tickets (event_id, reservation_id, token_hash, seat_type, status)
    values (event_uuid, res_id, p_token_hashes[i], seats[i], case when seats[i] = 'waitlist' then 'waitlisted' else 'valid' end);

    if seats[i] = 'waitlist' then
      insert into public.waitlist_entries (event_id, reservation_id, guest_name, guest_email, party_size, position_hint)
      values (event_uuid, res_id, p_guest_name, p_guest_email, p_quantity, queued + i);
    end if;
  end loop;

  return query select res_id, seats;
end;
$$;

-- 4. Move the ticket-art values that lived in public/events.js into the rows
-- they belong to. Guarded on badge = '' so re-running never clobbers edits
-- made in /admin.
update public.events set
  subtitle = 'SOCIETY + VIDEODROME',
  badge = 'BODY HORROR DOUBLE FEATURE',
  logo_url = coalesce(logo_url, '/logo_fixed_transparent.png'),
  poster_alt_url = coalesce(poster_alt_url, '/society-poster.jpg'),
  updated_at = now()
where slug = 'society-videodrome-double-feature' and badge = '';

update public.events set
  badge = 'SINGLE FEATURE',
  logo_url = coalesce(logo_url, '/uploads/Bonkhouse_ofthedead_logo.png'),
  updated_at = now()
where slug = 'return-of-the-sunday-afternoon-bonkhouse-of-the-dead' and badge = '';

update public.events set
  badge = 'DOUBLE FEATURE',
  logo_url = coalesce(logo_url, '/uploads/Bonkhouse_Househouse_logo.png'),
  updated_at = now()
where slug = 'house-house-halloween-double-feature' and badge = '';

update public.events set
  badge = 'DOUBLE FEATURE',
  logo_url = coalesce(logo_url, '/uploads/INFESTEDlogo.png'),
  updated_at = now()
where slug = 'infested-creature-double-feature' and badge = '';

update public.events set
  badge = 'DOUBLE FEATURE',
  updated_at = now()
where slug = 'retail-rampage-prom-dance-bloodbath' and badge = '';

-- 5. Copy fixes. The venue is the Glorya Kaufman Community Center at the
-- Wende Museum (10858 Culver Blvd); earlier seeds misspelled it.
update public.venues set
  name = 'Glorya Kaufman Community Center',
  address = '10858 Culver Blvd, Culver City, CA'
where name = 'Gloria Kaufman Community Center';

-- Archive copy: name the actual films instead of placeholder text.
update public.events set
  kicker = 'The dead return with pre-show and a room full of the living.',
  description = 'Return of the Living Dead, with a pre-show, at Lumiere Music Hall.',
  program = array['Pre-show', 'Return of the Living Dead'],
  updated_at = now()
where slug = 'return-of-the-sunday-afternoon-bonkhouse-of-the-dead';

update public.events set
  description = 'Bonkhouse and House Pardee presented a Halloween double feature: House (1977) and House (1985), with a pre-show, at Lumiere Music Hall.',
  program = array['Pre-show', 'House (1977)', 'Intermission', 'House (1985)'],
  updated_at = now()
where slug = 'house-house-halloween-double-feature';

update public.events set
  description = 'A creature double feature: Ticks and Demons, with a pre-show and intermission, at LOOK Dine-In Cinemas Glendale.',
  program = array['Pre-show', 'Ticks', 'Intermission', 'Demons'],
  updated_at = now()
where slug = 'infested-creature-double-feature';

update public.events set
  description = 'An 80''s B-movie double feature: Chopping Mall and Hello Mary Lou: Prom Night II, with a special pre-show and intermission.',
  program = array['Special pre-show', 'Chopping Mall', 'Intermission', 'Hello Mary Lou: Prom Night II'],
  updated_at = now()
where slug = 'retail-rampage-prom-dance-bloodbath';

-- 6. The two earliest screenings only existed in the JS fallback list.
insert into public.events (
  venue_id, slug, title, kicker, description, poster_url,
  starts_at, doors_at, gate_closes_at, capacity_standard, capacity_overflow,
  status, is_invite_only, program, badge,
  entry_instructions, host_note, accessibility_note, text_for_entry
)
values
  (
    (select id from public.venues where name = 'LOOK Dine-In Cinemas Glendale'),
    'merry-axe-mas-christmas-horror-double-feature',
    'Merry Axe-Mas Christmas Horror Double Feature',
    'Silent Night, Deadly Night 2 Redux and Dark Angel with a jolly pre-show.',
    'The second Sunday Afternoon Bonkhouse screening: a private Christmas horror double feature with Silent Night, Deadly Night 2 Redux, Dark Angel, and a jolly pre-show by your hosts.',
    '/posters/merry-axe-mas.jpg',
    '2022-12-11 11:45:00-08', '2022-12-11 11:00:00-08', '2022-12-11 11:55:00-08', 40, 0,
    'archived', true,
    array['Jolly pre-show', 'Silent Night, Deadly Night 2 Redux', 'Intermission', 'Dark Angel'],
    'DOUBLE FEATURE',
    '', '', '', ''
  ),
  (
    (select id from public.venues where name = 'LOOK Dine-In Cinemas Glendale'),
    'it-came-from-outer-space-horror-double-feature',
    'It Came From Outer Space Horror Double Feature',
    'The Blob and Night of the Creeps with a spooky pre-show.',
    'The first Sunday Afternoon Bonkhouse screening: a private horror double feature with The Blob, Night of the Creeps, and a spooky pre-show by your hosts.',
    '/posters/it-came-from-outer-space.jpg',
    '2022-10-09 11:45:00-07', '2022-10-09 11:00:00-07', '2022-10-09 11:55:00-07', 40, 0,
    'archived', true,
    array['Spooky pre-show', 'The Blob', 'Intermission', 'Night of the Creeps'],
    'DOUBLE FEATURE',
    '', '', '', ''
  )
on conflict (slug) do nothing;
