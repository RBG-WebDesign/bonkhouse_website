drop policy if exists "public cancel own reservations by token" on public.reservations;

create or replace function public.cancel_reservation(
  reservation_uuid uuid,
  supplied_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cancelled_count integer;
begin
  update public.reservations
  set status = 'cancelled'
  where id = reservation_uuid
    and cancel_token_hash = supplied_token_hash
    and status <> 'cancelled';

  get diagnostics cancelled_count = row_count;

  if cancelled_count = 0 then
    return false;
  end if;

  update public.tickets
  set status = 'cancelled'
  where reservation_id = reservation_uuid;

  update public.waitlist_entries
  set status = 'cancelled'
  where reservation_id = reservation_uuid;

  return true;
end;
$$;

revoke all on function public.cancel_reservation(uuid, text) from public;
grant execute on function public.cancel_reservation(uuid, text) to anon, authenticated;
