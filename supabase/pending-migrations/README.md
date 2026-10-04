# Ticketing security rollout

These reviewed SQL files are deliberately outside `supabase/migrations/`. A push
to GitHub must not restrict the database before the compatible server is live.
Do not move them into automatic migrations or run `db push` to apply them.
Production application is coordinated separately with Austin's manual Netlify
publication. Keep Netlify Auto Publishing Locked.

## Changes and compatibility

`20261004000231_prepare_ticketing_counts.sql` appends
`standard_tickets_claimed` and `standby_tickets_claimed` to `public_events`.
Existing columns, row filters and grants stay intact. This additive file is safe
with both the previous and updated app. New code falls back to the old total
until the columns exist.

`20261004000234_secure_ticketing_and_capacity.sql` requires the updated server:

- `cancel_reservation(uuid,text)`: revoke EXECUTE from PUBLIC, anon and
  authenticated; grant it only to service_role (and retain owner access).
  The supplied cancellation-token hash is still checked. The server sends
  promotion emails and returns only a redirect to the browser.
- `promote_waitlist(uuid)`: remain internal, without PUBLIC/anon/authenticated
  EXECUTE. `admin_remove_reservation(uuid)` retains authenticated EXECUTE and
  its internal `is_admin()` authorization check.
- `events`: remove broad SELECT from PUBLIC/anon/authenticated and explicitly
  grant guest-safe columns to anon/authenticated. Deny `admin_notes`, `host_note`
  and `text_for_entry`, including any old column grants. RLS policies and admin
  writes remain in place. Full admin event reads use the server client only
  after `requireAdmin()` or `isAdminRequest()` succeeds.
- Reservation creation and promotion count standard and standby inventory
  separately. Cancellation and admin removal lock the event before changing
  its reservations, matching reservation creation's lock order.

Both files contain transactions and can be reapplied. Neither file updates,
deletes or bulk-promotes existing reservations or tickets. Future cancellations
keep the established oldest-waitlisted-party-that-fits policy. A valid standby
ticket remains standby; it is not silently upgraded. A promotion uses available
standard inventory first, then standby inventory, and sends the appropriate
ticket status in its email.

## Publication order

1. Configure `SUPABASE_SECRET_KEY` for the Netlify server/functions environment
   using the existing project's server secret through the approved secret UI.
   The legacy `SUPABASE_SERVICE_ROLE_KEY` variable is also supported. Do not use
   a `NEXT_PUBLIC_` variable, commit the value, or print it in logs. No credential
   creation or rotation is part of this patch.
2. Apply the additive counts SQL through the coordinated database rollout.
3. Build the updated commit with the server secret available and validate its
   Netlify preview. Austin manually publishes it to `bonkhouse.com`.
4. Confirm the production commit and server configuration, then immediately
   apply the restrictive security/capacity SQL. This cannot precede publication:
   the previous cancellation route calls the RPC as anon. Revoking anon early
   would stop cancellations; removing returned promotion credentials would
   prevent the previous server from emailing promoted guests.
5. Use read-only checks below. Do not submit real reservations, cancellations,
   check-ins or ticket emails as a production test.

The public credential exposure remains until step 4. Keep the interval between
steps 3 and 4 short. The updated server can work with the previous RPC while
waiting for step 4. Missing server credentials deliberately produce an
unavailable cancellation page and leave the reservation unchanged.

## Verification

`npm test` runs the real migration SQL against disposable PGlite PostgreSQL with
pgcrypto, plus mocked server/email regression tests. It verifies blocked public
RPC calls, column grants and RLS, authorized admin access, correct category
allocation, token hashing, promotion policy and unchanged attendee rows on
migration application. No Supabase credentials are required.

Read-only production checks:

```sql
select role_name,
  has_function_privilege(role_name, 'public.cancel_reservation(uuid,text)', 'EXECUTE') as can_cancel,
  has_function_privilege(role_name, 'public.promote_waitlist(uuid)', 'EXECUTE') as can_promote,
  has_column_privilege(role_name, 'public.events', 'admin_notes', 'SELECT') as can_read_notes
from unnest(array['anon','authenticated','service_role']) as role_name;

select slug, capacity_standard, capacity_overflow, tickets_claimed,
       standard_tickets_claimed, standby_tickets_claimed
from public.public_events where is_upcoming;
```

Expect anon/authenticated `can_cancel`, `can_promote` and `can_read_notes` all
false. Confirm anonymous public-event reads and ordinary event metadata still
succeed, private-column requests fail, the admin event form loads after real
admin sign-in, and event RSVP shortcuts stay on the event page.

After application, record the deployment and database migration history in the
coordinated rollout. Do not reapply the earlier venue rename: it was already
applied separately. Do not roll the app back to the public-role cancellation
implementation after privilege restrictions; fix forward or retain the secure
server route. Reopening public RPC access would restore the credential leak.
