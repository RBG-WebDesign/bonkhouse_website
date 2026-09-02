-- Seed 27 fake reservations (4 seats each) on the current screening so the
-- admin counters can be checked against known numbers. Uses the real
-- reservation function, so seats are allocated exactly as live RSVPs are.
--
-- Expected on an event with 80 standard + 20 overflow and no other RSVPs:
--   Total 108 · Standard 80 · Overflow 20 · Waitlist 8 · Checked in 12
--
-- The Google Sheet webhook is paused for the duration so the sheet stays
-- clean. No emails are sent. Undo with clear-test-rsvps.sql.

do $$
declare
  ev uuid;
  i int;
begin
  alter table public.reservations disable trigger rsvp_to_google_sheet;

  select id into ev from public.events where slug = 'society-videodrome-double-feature';

  for i in 1..27 loop
    perform public.create_reservation_atomic(
      ev,
      'TEST Guest ' || i,
      'test' || i || '@example.com',
      4,
      '',
      'test-cancel-' || i,
      array['test-' || i || '-a', 'test-' || i || '-b', 'test-' || i || '-c', 'test-' || i || '-d']
    );
  end loop;

  update public.tickets
  set checked_in_at = now()
  where id in (
    select id from public.tickets
    where token_hash like 'test-%' and seat_type = 'standard'
    order by created_at
    limit 12
  );

  alter table public.reservations enable trigger rsvp_to_google_sheet;
end $$;

-- What the counters should show:
select
  count(*) as total,
  count(*) filter (where seat_type = 'standard') as standard,
  count(*) filter (where seat_type = 'overflow') as overflow,
  count(*) filter (where seat_type = 'waitlist') as waitlist,
  count(*) filter (where checked_in_at is not null) as checked_in
from public.tickets t
join public.events e on e.id = t.event_id
where e.slug = 'society-videodrome-double-feature';
