-- RSVP hardening: every write goes through a database function, one active
-- reservation per email per screening, and cancellations (guest or admin)
-- promote the waitlist. Apply in the Supabase SQL editor after 202609020001.

-- 1. Nobody writes tickets directly any more. create_reservation_atomic and
-- the cancellation functions run with their own privileges.
drop policy if exists "public create reservations" on public.reservations;
drop policy if exists "public create tickets" on public.tickets;
drop policy if exists "public create waitlist" on public.waitlist_entries;

-- 2. One live reservation per email per screening. Cancelled ones don't count,
-- so a guest can release seats and reserve again.
create unique index if not exists reservations_one_active_per_email
  on public.reservations (event_id, lower(guest_email))
  where status <> 'cancelled';

-- 3. Reservation function: same as 202609020001 plus the duplicate check.
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

-- 4. Waitlist promotion. Internal only: called by the two cancellation
-- functions below while they hold the event lock. Seats freed by a
-- cancellation go to the oldest reservation whose pending party fits, in
-- order, until nothing fits. Fresh ticket and cancel tokens are minted here
-- and returned in plain text so the server can email them; only their SHA-256
-- hashes are stored, exactly like a normal RSVP.
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
  taken integer;
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
    select count(*) into taken from public.tickets t
    where t.event_id = event_uuid and t.status = 'valid';

    select r.id, r.guest_name as name, r.guest_email as email, count(t.id)::integer as pending
    into cand
    from public.reservations r
    join public.tickets t on t.reservation_id = r.id and t.status = 'waitlisted'
    where r.event_id = event_uuid and r.status <> 'cancelled'
    group by r.id, r.guest_name, r.guest_email, r.created_at
    having count(t.id) <= ev.capacity_standard + ev.capacity_overflow - taken
    order by r.created_at asc
    limit 1;
    exit when not found;

    seats := array[]::text[];
    toks := array[]::text[];

    for tk in
      select t.id from public.tickets t
      where t.reservation_id = cand.id and t.status = 'waitlisted'
      order by t.created_at, t.id
    loop
      seat := case when taken < ev.capacity_standard then 'standard' else 'overflow' end;
      tok := translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_');
      update public.tickets t
      set seat_type = seat, status = 'valid', token_hash = encode(digest(tok, 'sha256'), 'hex')
      where t.id = tk.id;
      taken := taken + 1;
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

revoke all on function public.promote_waitlist(uuid) from public, anon, authenticated;

-- 5. Guest cancellation. Returns the cancelled reservation (kind = 'cancelled')
-- followed by any promotions (kind = 'promoted') so the server can send both
-- kinds of email. Signature unchanged; return type changed, hence the drop.
drop function if exists public.cancel_reservation(uuid, text);

create function public.cancel_reservation(
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

revoke all on function public.cancel_reservation(uuid, text) from public;
grant execute on function public.cancel_reservation(uuid, text) to anon, authenticated;

-- 6. Admin removal. Flips the row to cancelled first (so the reservations
-- webhook tells the Google Sheet), then deletes it, then promotes the waitlist.
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

revoke all on function public.admin_remove_reservation(uuid) from public, anon;
grant execute on function public.admin_remove_reservation(uuid) to authenticated;
