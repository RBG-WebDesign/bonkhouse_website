-- Harden create_reservation_atomic: the function is callable with the public
-- anon key, so every guest-facing rule must live inside it, not just in the
-- API route. Also fixes null-quantity handling and duplicate waitlist
-- position hints.
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
  if ev.rsvp_closes_at is not null and now() > ev.rsvp_closes_at then
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

  -- waitlist positions continue from everyone already holding or queuing
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
