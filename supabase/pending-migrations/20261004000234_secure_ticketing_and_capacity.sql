-- STAGED: requires the new server client and configured server secret FIRST.
-- See README.md. This replaces functions and grants only; no existing tickets
-- or reservations are modified by applying it. Future cancellations retain
-- oldest-party-that-fits promotion; valid standby tickets stay standby.
begin;

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
  standard_taken integer;
  standby_taken integer;
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

  if exists (
    select 1 from public.reservations r
    where r.event_id = event_uuid
      and lower(r.guest_email) = lower(trim(p_guest_email))
      and r.status <> 'cancelled'
  ) then
    raise exception 'already reserved';
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

  select count(*) filter (where seat_type = 'standard'),
         count(*) filter (where seat_type = 'overflow')
  into standard_taken, standby_taken
  from public.tickets where event_id = event_uuid and status = 'valid';

  select count(*) into queued from public.tickets
  where event_id = event_uuid and status in ('valid', 'waitlisted');

  for i in 1..p_quantity loop
    if standard_taken < ev.capacity_standard then
      seat := 'standard';
      standard_taken := standard_taken + 1;
    elsif standby_taken < ev.capacity_overflow then
      seat := 'overflow';
      standby_taken := standby_taken + 1;
    else
      seat := 'waitlist';
    end if;
    seats := seats || seat;
  end loop;

  res_status := case when seats <@ array['waitlist'] then 'waitlisted' else 'confirmed' end;

  insert into public.reservations (id, event_id, guest_name, guest_email, quantity, status, invite_code, cancel_token_hash)
  values (res_id, event_uuid, trim(p_guest_name), lower(trim(p_guest_email)), p_quantity, res_status, nullif(p_invite_code, ''), p_cancel_token_hash);

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

create or replace function public.promote_waitlist(event_uuid uuid)
returns table (
  reservation_id uuid,
  guest_name text,
  guest_email text,
  quantity integer,
  seat_types text[],
  tokens text[],
  cancel_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ev public.events%rowtype;
  standard_taken integer;
  standby_taken integer;
  cand record;
  tk record;
  seat text;
  tok text;
  seats text[];
  toks text[];
begin
  select * into ev from public.events e where e.id = event_uuid for update;
  if not found or ev.status <> 'published' then
    return;
  end if;

  loop
    select count(*) filter (where t.seat_type = 'standard'),
           count(*) filter (where t.seat_type = 'overflow')
    into standard_taken, standby_taken
    from public.tickets t where t.event_id = event_uuid and t.status = 'valid';

    select r.id, r.guest_name as name, r.guest_email as email, count(t.id)::integer as pending
    into cand
    from public.reservations r
    join public.tickets t on t.reservation_id = r.id and t.status = 'waitlisted'
    where r.event_id = event_uuid and r.status <> 'cancelled'
    group by r.id, r.guest_name, r.guest_email, r.created_at
    having count(t.id) <= greatest(ev.capacity_standard - standard_taken, 0) + greatest(ev.capacity_overflow - standby_taken, 0)
    order by r.created_at asc, r.id asc
    limit 1;
    exit when not found;

    seats := array[]::text[];
    toks := array[]::text[];

    for tk in
      select t.id from public.tickets t
      where t.reservation_id = cand.id and t.status = 'waitlisted'
      order by t.created_at, t.id
    loop
      seat := case when standard_taken < ev.capacity_standard then 'standard' else 'overflow' end;
      tok := translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_');
      update public.tickets t
      set seat_type = seat, status = 'valid', token_hash = encode(digest(tok, 'sha256'), 'hex')
      where t.id = tk.id;
      if seat = 'standard' then
        standard_taken := standard_taken + 1;
      else
        standby_taken := standby_taken + 1;
      end if;
      seats := seats || seat;
      toks := toks || tok;
    end loop;

    tok := translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_');
    update public.reservations r
    set status = 'confirmed', cancel_token_hash = encode(digest(tok, 'sha256'), 'hex')
    where r.id = cand.id;
    update public.waitlist_entries w set status = 'converted' where w.reservation_id = cand.id;

    reservation_id := cand.id;
    guest_name := cand.name;
    guest_email := cand.email;
    quantity := cand.pending;
    seat_types := seats;
    tokens := toks;
    cancel_token := tok;
    return next;
  end loop;
end;
$$;

create or replace function public.cancel_reservation(
  reservation_uuid uuid,
  supplied_token_hash text
)
returns table (
  kind text,
  reservation_id uuid,
  event_id uuid,
  guest_name text,
  guest_email text,
  quantity integer,
  seat_types text[],
  tokens text[],
  cancel_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  res public.reservations%rowtype;
  p record;
begin
  -- Match the reservation-creation lock order: event, then reservation.
  -- Verify the token again in the update after acquiring the event lock.
  perform 1 from public.events e
  join public.reservations r on r.event_id = e.id
  where r.id = reservation_uuid and r.cancel_token_hash = supplied_token_hash
    and r.status <> 'cancelled'
  for update of e;
  if not found then return; end if;

  update public.reservations r
  set status = 'cancelled'
  where r.id = reservation_uuid
    and r.cancel_token_hash = supplied_token_hash
    and r.status <> 'cancelled'
  returning r.* into res;

  if not found then
    return;
  end if;

  update public.tickets t set status = 'cancelled' where t.reservation_id = reservation_uuid;
  update public.waitlist_entries w set status = 'cancelled' where w.reservation_id = reservation_uuid;

  kind := 'cancelled';
  reservation_id := res.id;
  event_id := res.event_id;
  guest_name := res.guest_name;
  guest_email := res.guest_email;
  quantity := res.quantity;
  seat_types := null;
  tokens := null;
  cancel_token := null;
  return next;

  for p in select * from public.promote_waitlist(res.event_id) loop
    kind := 'promoted';
    reservation_id := p.reservation_id;
    event_id := res.event_id;
    guest_name := p.guest_name;
    guest_email := p.guest_email;
    quantity := p.quantity;
    seat_types := p.seat_types;
    tokens := p.tokens;
    cancel_token := p.cancel_token;
    return next;
  end loop;
end;
$$;

create or replace function public.admin_remove_reservation(reservation_uuid uuid)
returns table (
  kind text,
  reservation_id uuid,
  event_id uuid,
  guest_name text,
  guest_email text,
  quantity integer,
  seat_types text[],
  tokens text[],
  cancel_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  res public.reservations%rowtype;
  p record;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  -- Serialize with RSVP and guest cancellation before touching child rows.
  perform 1 from public.events e
  join public.reservations r on r.event_id = e.id
  where r.id = reservation_uuid
  for update of e;
  if not found then return; end if;

  select * into res from public.reservations r where r.id = reservation_uuid;
  if not found then
    return;
  end if;

  update public.reservations r set status = 'cancelled' where r.id = reservation_uuid;
  delete from public.checkins c where c.ticket_id in (select t.id from public.tickets t where t.reservation_id = reservation_uuid);
  delete from public.waitlist_entries w where w.reservation_id = reservation_uuid;
  delete from public.tickets t where t.reservation_id = reservation_uuid;
  delete from public.reservations r where r.id = reservation_uuid;

  kind := 'removed';
  reservation_id := res.id;
  event_id := res.event_id;
  guest_name := res.guest_name;
  guest_email := res.guest_email;
  quantity := res.quantity;
  seat_types := null;
  tokens := null;
  cancel_token := null;
  return next;

  for p in select * from public.promote_waitlist(res.event_id) loop
    kind := 'promoted';
    reservation_id := p.reservation_id;
    event_id := res.event_id;
    guest_name := p.guest_name;
    guest_email := p.guest_email;
    quantity := p.quantity;
    seat_types := p.seat_types;
    tokens := p.tokens;
    cancel_token := p.cancel_token;
    return next;
  end loop;
end;
$$;

-- Promotion credentials may only leave Postgres for the trusted server.
revoke all on function public.cancel_reservation(uuid, text) from public, anon, authenticated;
grant execute on function public.cancel_reservation(uuid, text) to service_role;
revoke all on function public.promote_waitlist(uuid) from public, anon, authenticated;
revoke all on function public.admin_remove_reservation(uuid) from public, anon;
grant execute on function public.admin_remove_reservation(uuid) to authenticated;

-- RLS still controls which rows each role sees. Column grants additionally
-- prevent published rows from exposing private host/admin notes.
revoke select on public.events from public, anon, authenticated;
revoke select (admin_notes, host_note, text_for_entry) on public.events from public, anon, authenticated;
grant select (
  id, venue_id, slug, title, kicker, description, poster_url, starts_at,
  doors_at, gate_closes_at, capacity_standard, capacity_overflow, status,
  is_invite_only, program, entry_instructions, accessibility_note,
  created_at, updated_at, subtitle, logo_url, ends_at, rsvp_opens_at,
  rsvp_closes_at, max_tickets_per_rsvp, ticket_type, price_cents, badge,
  poster_alt_url
) on public.events to anon, authenticated;
grant select on public.events to service_role;
notify pgrst, 'reload schema';

commit;
