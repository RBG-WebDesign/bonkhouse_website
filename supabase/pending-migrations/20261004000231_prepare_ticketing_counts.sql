-- STAGED: apply explicitly during the rollout in README.md. No attendee writes.
-- Append counters without changing existing view column order or grants.
begin;

create or replace view public.public_events
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
  (e.status = 'published' and e.starts_at > now() - interval '6 hours') as is_upcoming,
  (select count(*) from public.tickets t where t.event_id = e.id and t.status = 'valid' and t.seat_type = 'standard') as standard_tickets_claimed,
  (select count(*) from public.tickets t where t.event_id = e.id and t.status = 'valid' and t.seat_type = 'overflow') as standby_tickets_claimed
from public.events e
left join public.venues v on v.id = e.venue_id
where e.status in ('published', 'archived');

grant select on public.public_events to anon, authenticated;


commit;
