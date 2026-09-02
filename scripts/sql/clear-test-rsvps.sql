-- Remove everything created by seed-test-rsvps.sql (and nothing else).
-- Test rows are recognisable by their example.com emails and test- tokens.

do $$
begin
  alter table public.reservations disable trigger rsvp_to_google_sheet;

  delete from public.checkins where ticket_id in (select id from public.tickets where token_hash like 'test-%');
  delete from public.waitlist_entries where guest_email like 'test%@example.com';
  delete from public.tickets where token_hash like 'test-%';
  delete from public.reservations where guest_email like 'test%@example.com' and guest_name like 'TEST Guest %';

  alter table public.reservations enable trigger rsvp_to_google_sheet;
end $$;

select count(*) as remaining_test_reservations
from public.reservations
where guest_email like 'test%@example.com';
