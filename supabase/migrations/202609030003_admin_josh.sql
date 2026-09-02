-- Add Josh to the admin allowlist. Safe to re-run.
insert into public.admin_profiles (email, role)
values ('joshuawbarish@gmail.com', 'admin')
on conflict (email) do nothing;
