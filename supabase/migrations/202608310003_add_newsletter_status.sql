alter table public.email_subscribers
add column if not exists status text not null default 'active'
check (status in ('active', 'unsubscribed'));
