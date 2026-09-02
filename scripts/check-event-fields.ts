// Minimal self-check for the admin event payload mapping.
// Run: npx tsx scripts/check-event-fields.ts
import assert from "node:assert";
import { eventPayloadToRow, resolveVenueId } from "../lib/event-fields";

const ok = eventPayloadToRow({
  title: "Test",
  slug: "test-1",
  subtitle: " SHORT ",
  badge: " Body Horror ",
  posterUrl: "/posters/a.jpg",
  posterAltUrl: "",
  startsAt: "2026-10-18T13:00:00-07:00",
  doorsAt: "2026-10-18T13:00:00-07:00",
  capacityStandard: "80",
  capacityOverflow: "20",
  maxTicketsPerRsvp: "4",
  status: "draft",
  program: "A\nB\n\nC"
});
assert(!ok.error, "valid payload should not error");
assert.equal(ok.row!.slug, "test-1");
assert.equal(ok.row!.subtitle, "SHORT");
assert.equal(ok.row!.badge, "Body Horror");
assert.equal(ok.row!.poster_alt_url, null, "empty second poster stores as null");
assert.deepEqual(ok.row!.program, ["A", "B", "C"]);
assert.equal(ok.row!.gate_closes_at, new Date("2026-10-18T13:00:00-07:00").toISOString(), "gate falls back to start");
assert(!("ticket_type" in ok.row!), "ticket_type must not be written by the form mapper");
assert(!("price_cents" in ok.row!), "price_cents must not be written by the form mapper");
assert(!("venue_id" in ok.row!), "venue is resolved separately, never from the raw payload");

assert(eventPayloadToRow({ title: "X", slug: "Bad Slug!", startsAt: "x", doorsAt: "x" }).error, "bad slug rejected");
assert(eventPayloadToRow({ title: "X", slug: "x" }).error, "missing times rejected");
assert(
  eventPayloadToRow({ title: "X", slug: "x", startsAt: "2026-01-01", doorsAt: "2026-01-01", status: "bogus" }).error,
  "bad status rejected"
);

const clamped = eventPayloadToRow({
  title: "X",
  slug: "x",
  startsAt: "2026-01-01",
  doorsAt: "2026-01-01",
  capacityStandard: "-5",
  maxTicketsPerRsvp: "99"
});
assert.equal(clamped.row!.capacity_standard, 0);
assert.equal(clamped.row!.max_tickets_per_rsvp, 10);

const garbage = eventPayloadToRow({ title: "X", slug: "x", startsAt: "not-a-date", doorsAt: "not-a-date" });
assert(garbage.error, "garbage dates rejected");

// Venue resolution: upserts by name, and never hits the database without one.
(async () => {
  const calls: unknown[] = [];
  const fakeSupabase = {
    from: () => ({
      upsert: (row: unknown, opts: unknown) => {
        calls.push([row, opts]);
        return { select: () => ({ single: async () => ({ data: { id: "venue-1" } }) }) };
      }
    })
  } as any;

  assert.equal(await resolveVenueId(fakeSupabase, "  ", "x"), null, "blank name resolves to null");
  assert.equal(calls.length, 0, "blank name must not touch the database");

  assert.equal(await resolveVenueId(fakeSupabase, " Lumiere ", ""), "venue-1");
  assert.deepEqual(calls[0], [{ name: "Lumiere" }, { onConflict: "name" }], "address omitted when blank");

  await resolveVenueId(fakeSupabase, "Lumiere", "Beverly Hills");
  assert.deepEqual(calls[1], [{ name: "Lumiere", address: "Beverly Hills" }, { onConflict: "name" }]);

  console.log("ALL ASSERTIONS PASSED");
})();
