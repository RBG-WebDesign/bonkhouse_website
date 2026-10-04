// Real, disposable PostgreSQL via WASM. No network, production rows or emails.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { before, after, test } = require('node:test');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
const sql = (file) => readFileSync(path.join(__dirname, '..', 'supabase', file), 'utf8');
let db;

before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema extensions;
    create table auth.users (id uuid primary key);
    create function auth.email() returns text language sql as $$
      select current_setting('test.email', true)
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  // Reuse the actual table definitions, policies and functions, excluding seeds,
  // storage setup and unrelated data migrations.
  await db.exec(sql('migrations/202605190001_bonkhouse_schema.sql').split('insert into public.venues')[0]);
  await db.exec(sql('migrations/202609010001_event_management.sql').split('-- 2. Safe public read model')[0]);
  await db.exec(sql('migrations/202609020001_screening_source_of_truth.sql').split('-- 3. RSVPs')[0]);
  await db.exec(sql('migrations/202609030001_rsvp_hardening.sql'));
  await db.exec(`grant all on all tables in schema public to anon, authenticated, service_role;
    insert into public.admin_profiles(email) values ('admin@example.test');`);
});
after(async () => { await db?.close(); });

async function asRole(role, query, params = []) {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
  await db.exec(`set role ${role}`);
  try { return await db.query(query, params); }
  finally { await db.exec('reset role'); }
}
async function event(standard = 2, standby = 1, status = 'published') {
  return (await db.query(`insert into public.events
    (slug,title,starts_at,doors_at,gate_closes_at,capacity_standard,capacity_overflow,max_tickets_per_rsvp,status,admin_notes,host_note,text_for_entry)
    values ($1,'Local test',now()+interval '1 day',now()+interval '1 day',now()+interval '2 days',$2,$3,10,$4,'PRIVATE ADMIN','PRIVATE HOST','PRIVATE ENTRY') returning id`,
  [randomUUID(), standard, standby, status])).rows[0].id;
}
async function reserve(id, quantity = 1) {
  const cancelHash = randomUUID();
  const row = (await asRole('anon', 'select * from public.create_reservation_atomic($1,$2,$3,$4,$5,$6,$7)',
    [id, 'Test guest', randomUUID() + '@example.test', quantity, null, cancelHash, Array.from({ length: quantity }, randomUUID)])).rows[0];
  return { ...row, cancelHash };
}
async function cancel(reservation, tokenHash = reservation.cancelHash) {
  return (await asRole('service_role', 'select * from public.cancel_reservation($1,$2)', [reservation.reservation_id, tokenHash])).rows;
}

test('staged migrations preserve attendee rows and can be reapplied safely', async () => {
  const id = await event();
  await reserve(id, 2);
  await reserve(id);
  await reserve(id, 2);
  const snapshot = async () => (await db.query(`select jsonb_build_object(
    'reservations',(select jsonb_agg(r order by r.id) from reservations r),
    'tickets',(select jsonb_agg(t order by t.id) from tickets t),
    'waitlist',(select jsonb_agg(w order by w.id) from waitlist_entries w)) as data`)).rows;
  const original = await snapshot();
  for (let i = 0; i < 2; i++) {
    await db.exec(sql('pending-migrations/20261004000231_prepare_ticketing_counts.sql'));
    await db.exec(sql('pending-migrations/20261004000234_secure_ticketing_and_capacity.sql'));
    assert.deepEqual(await snapshot(), original);
  }
});

test('public roles cannot call cancellation or internal promotion functions', async () => {
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(asRole(role, 'select * from public.cancel_reservation($1,$2)', [randomUUID(), 'fake']), /permission denied/);
    await assert.rejects(asRole(role, 'select * from public.promote_waitlist($1)', [randomUUID()]), /permission denied/);
  }
});

test('private event columns are denied, guest-safe fields and admin writes still work', async () => {
  const id = await event();
  const draft = await event(2, 1, 'draft');
  for (const role of ['anon', 'authenticated']) {
    for (const column of ['admin_notes', 'host_note', 'text_for_entry', '*']) {
      await assert.rejects(asRole(role, `select ${column} from public.events where id=$1`, [id]), /permission denied/);
    }
    assert.equal((await asRole(role, 'select id,title,entry_instructions from public.events where id=$1', [id])).rows.length, 1);
    assert.equal((await asRole(role, 'select id from public.events where id=$1', [draft])).rows.length, 0);
    const publicRow = (await asRole(role, 'select * from public.public_events where id=$1', [id])).rows[0];
    assert.ok(publicRow);
    assert.ok(!('admin_notes' in publicRow) && !('host_note' in publicRow) && !('text_for_entry' in publicRow));
  }
  assert.equal((await asRole('service_role', 'select admin_notes from public.events where id=$1', [id])).rows[0].admin_notes, 'PRIVATE ADMIN');
  await db.query("select set_config('test.email','admin@example.test',false)");
  try {
    assert.equal((await asRole('authenticated', "update public.events set admin_notes='UPDATED' where id=$1 returning id", [id])).rows.length, 1);
    assert.equal((await asRole('authenticated', 'select id from public.events where id=$1', [draft])).rows.length, 1);
  } finally { await db.query("select set_config('test.email','',false)"); }
});

test('standard cancellation leaves standby valid and a new RSVP takes the standard vacancy', async () => {
  const id = await event(2, 2);
  const first = await reserve(id);
  await reserve(id);
  const standby = await reserve(id);
  const ticketBefore = (await db.query('select * from public.tickets where reservation_id=$1', [standby.reservation_id])).rows;
  assert.equal((await cancel(first)).length, 1);
  const counts = (await asRole('anon', 'select standard_tickets_claimed,standby_tickets_claimed from public.public_events where id=$1', [id])).rows[0];
  assert.deepEqual(counts, { standard_tickets_claimed: 1, standby_tickets_claimed: 1 });
  assert.deepEqual((await reserve(id)).seat_types, ['standard']);
  assert.deepEqual((await db.query('select * from public.tickets where reservation_id=$1', [standby.reservation_id])).rows, ticketBefore);
});

test('mixed reservation allocation fills each inventory without overselling', async () => {
  const id = await event(2, 2);
  await reserve(id);
  assert.deepEqual((await reserve(id, 4)).seat_types, ['standard', 'overflow', 'overflow', 'waitlist']);
  assert.deepEqual((await reserve(id)).seat_types, ['waitlist']);
});

test('cancellation promotes oldest party that fits, using standard vacancies first', async () => {
  const id = await event();
  const standard = await reserve(id, 2);
  const standby = await reserve(id);
  const largeParty = await reserve(id, 3);
  const smallParty = await reserve(id);
  await db.query("update reservations set created_at=now()-interval '1 hour' where id=$1", [largeParty.reservation_id]);
  const before = (await db.query('select * from tickets where reservation_id=$1', [standby.reservation_id])).rows;
  const outcome = await cancel(standard);
  assert.equal(outcome.length, 2);
  assert.equal(outcome[1].reservation_id, smallParty.reservation_id);
  assert.deepEqual(outcome[1].seat_types, ['standard']);
  assert.equal(outcome[1].tokens.length, 1);
  const hashes = (await db.query(`select t.token_hash=encode(digest($2,'sha256'),'hex') as ticket_ok,
    r.cancel_token_hash=encode(digest($3,'sha256'),'hex') as cancel_ok
    from tickets t join reservations r on r.id=t.reservation_id where r.id=$1`,
  [smallParty.reservation_id, outcome[1].tokens[0], outcome[1].cancel_token])).rows[0];
  assert.deepEqual(hashes, { ticket_ok: true, cancel_ok: true });
  assert.deepEqual((await db.query('select * from tickets where reservation_id=$1', [standby.reservation_id])).rows, before);
  assert.deepEqual((await cancel(standard)), []);
});

test('standby cancellation promotes a waitlisted guest to standby when standard is full', async () => {
  const id = await event();
  await reserve(id, 2);
  const standby = await reserve(id);
  const waiting = await reserve(id);
  const outcome = await cancel(standby);
  assert.equal(outcome[1].reservation_id, waiting.reservation_id);
  assert.deepEqual(outcome[1].seat_types, ['overflow']);
});

test('invalid cancellation token and non-admin removal leave reservations intact', async () => {
  const id = await event();
  const standard = await reserve(id, 2);
  assert.deepEqual(await cancel(standard, 'wrong-token'), []);
  await assert.rejects(asRole('authenticated', 'select * from public.admin_remove_reservation($1)', [standard.reservation_id]), /admin only/);
  assert.equal((await db.query('select status from reservations where id=$1', [standard.reservation_id])).rows[0].status, 'confirmed');
});

test('authorized admin removal uses the same promotion policy', async () => {
  const id = await event(1, 0);
  const standard = await reserve(id);
  const waiting = await reserve(id);
  await db.query("select set_config('test.email','admin@example.test',false)");
  try {
    const rows = (await asRole('authenticated', 'select * from public.admin_remove_reservation($1)', [standard.reservation_id])).rows;
    assert.equal(rows[0].kind, 'removed');
    assert.equal(rows[1].reservation_id, waiting.reservation_id);
    assert.deepEqual(rows[1].seat_types, ['standard']);
  } finally { await db.query("select set_config('test.email','',false)"); }
});
