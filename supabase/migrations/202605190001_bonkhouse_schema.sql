create extension if not exists "pgcrypto";

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text not null default '',
  neighborhood text not null default 'Culver City',
  entry_instructions text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete set null,
  slug text not null unique,
  title text not null,
  kicker text not null default '',
  description text not null default '',
  poster_url text,
  starts_at timestamptz not null,
  doors_at timestamptz not null,
  gate_closes_at timestamptz not null,
  capacity_standard integer not null default 100 check (capacity_standard >= 0),
  capacity_overflow integer not null default 20 check (capacity_overflow >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_invite_only boolean not null default false,
  program text[] not null default array[]::text[],
  entry_instructions text not null default '',
  host_note text not null default '',
  accessibility_note text not null default '',
  text_for_entry text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  quantity integer not null default 1 check (quantity between 1 and 4),
  status text not null default 'confirmed' check (status in ('confirmed', 'waitlisted', 'cancelled')),
  invite_code text,
  cancel_token_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  token_hash text not null unique,
  seat_type text not null check (seat_type in ('standard', 'overflow', 'waitlist')),
  status text not null default 'valid' check (status in ('valid', 'waitlisted', 'cancelled')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, code)
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  staff_user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  party_size integer not null default 1,
  position_hint integer not null default 0,
  status text not null default 'waiting' check (status in ('waiting', 'offered', 'converted', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  event_title text not null default '',
  caption text not null default '',
  image_url text not null default '',
  shot_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.merch_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_label text not null default 'Coming soon',
  image_url text,
  status text not null default 'coming_soon' check (status in ('available', 'coming_soon', 'sold_out')),
  created_at timestamptz not null default now()
);

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  tags text[] not null default array[]::text[],
  subscribed_at timestamptz not null default now()
);

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'door')),
  created_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists reservations_event_id_idx on public.reservations(event_id);
create index if not exists tickets_event_id_idx on public.tickets(event_id);
create index if not exists tickets_reservation_id_idx on public.tickets(reservation_id);
create index if not exists tickets_checked_in_at_idx on public.tickets(checked_in_at);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where lower(email) = lower(auth.email())
  );
$$;

create or replace function public.get_event_ticket_counts(event_uuid uuid)
returns table (
  confirmed_count bigint,
  standard_count bigint,
  overflow_count bigint,
  waitlist_count bigint,
  checked_in_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where status = 'valid') as confirmed_count,
    count(*) filter (where status = 'valid' and seat_type = 'standard') as standard_count,
    count(*) filter (where status = 'valid' and seat_type = 'overflow') as overflow_count,
    count(*) filter (where status = 'waitlisted' or seat_type = 'waitlist') as waitlist_count,
    count(*) filter (where checked_in_at is not null) as checked_in_count
  from public.tickets
  where event_id = event_uuid;
$$;

create or replace function public.increment_invite_code_use(event_uuid uuid, invite_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.invite_codes
  set used_count = used_count + 1
  where event_id = event_uuid
    and code = upper(invite_code)
    and is_active = true
    and used_count < max_uses;
$$;

create or replace function public.archive_past_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer;
begin
  update public.events
  set status = 'archived', updated_at = now()
  where status = 'published'
    and starts_at < now() - interval '6 hours';

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.reservations enable row level security;
alter table public.tickets enable row level security;
alter table public.invite_codes enable row level security;
alter table public.checkins enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.photos enable row level security;
alter table public.merch_products enable row level security;
alter table public.email_subscribers enable row level security;
alter table public.admin_profiles enable row level security;

create policy "public read venues" on public.venues for select using (true);
create policy "public read published events" on public.events for select using (status in ('published', 'archived') or public.is_admin());
create policy "public read photos" on public.photos for select using (true);
create policy "public read merch" on public.merch_products for select using (true);

create policy "public create reservations" on public.reservations for insert with check (true);
create policy "public cancel own reservations by token" on public.reservations for update using (true) with check (status = 'cancelled');
create policy "public create tickets" on public.tickets for insert with check (true);
create policy "public create waitlist" on public.waitlist_entries for insert with check (true);
create policy "public join mailing list" on public.email_subscribers for insert with check (true);
create policy "public update mailing list" on public.email_subscribers for update using (true) with check (true);

create policy "admins manage venues" on public.venues for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage events" on public.events for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage reservations" on public.reservations for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage tickets" on public.tickets for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage invite codes" on public.invite_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage checkins" on public.checkins for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage waitlist" on public.waitlist_entries for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage photos" on public.photos for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage merch" on public.merch_products for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage subscribers" on public.email_subscribers for all using (public.is_admin()) with check (public.is_admin());
create policy "admins read admin profiles" on public.admin_profiles for select using (lower(email) = lower(auth.email()) or public.is_admin());
create policy "admins manage admin profiles" on public.admin_profiles for all using (public.is_admin()) with check (public.is_admin());

insert into public.venues (name, address, neighborhood, entry_instructions)
values (
  'Gloria Kaufman Community Center',
  'Culver City, CA',
  'Culver City',
  'Enter through the side gate. Gates close when the movie begins. If the gate is closed, text the host number from your ticket email.'
)
on conflict (name) do update
set entry_instructions = excluded.entry_instructions;

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true), ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

create policy "public read event poster files"
on storage.objects for select
using (bucket_id in ('event-posters', 'event-photos'));

create policy "admins upload event files"
on storage.objects for insert
with check (bucket_id in ('event-posters', 'event-photos') and public.is_admin());

create policy "admins update event files"
on storage.objects for update
using (bucket_id in ('event-posters', 'event-photos') and public.is_admin())
with check (bucket_id in ('event-posters', 'event-photos') and public.is_admin());
