// Minimal self-check for the admin event payload mapping.
// Run: npx tsx scripts/check-event-fields.ts
import assert from "node:assert";
import { eventPayloadToRow } from "../lib/event-fields";

const ok = eventPayloadToRow({
  title: "Test",
  slug: "test-1",
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
assert.deepEqual(ok.row!.program, ["A", "B", "C"]);
assert.equal(ok.row!.gate_closes_at, new Date("2026-10-18T13:00:00-07:00").toISOString(), "gate falls back to start");
assert(!("ticket_type" in ok.row!), "ticket_type must not be written by the form mapper");
assert(!("price_cents" in ok.row!), "price_cents must not be written by the form mapper");

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

console.log("ALL ASSERTIONS PASSED");
