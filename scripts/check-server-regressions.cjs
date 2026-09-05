// Run with: node --test scripts/check-server-regressions.cjs
// Route dependencies are replaced locally; these tests never contact a service.
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const { NextResponse } = require("next/server");

function loadTs(relativePath, dependencies = {}, globals = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URL,
    console,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unmocked dependency: ${name}`);
      return dependencies[name];
    },
    ...globals
  }, { filename });
  return exports;
}

function ticketDatabase({ concurrentReads = 1, lookupError, updateError, logError, beforeClaim } = {}) {
  const ticket = {
    id: "ticket-1",
    token_hash: "hashed-token",
    event_id: "event-1",
    status: "valid",
    seat_type: "standard",
    checked_in_at: null,
    events: { title: "Test screening" },
    reservations: { guest_name: "Test guest" }
  };
  const logs = [];
  const readers = [];
  return {
    ticket,
    logs,
    from(table) {
      assert.ok(table === "tickets" || table === "checkins");
      let update;
      const filters = [];
      const query = {
        select() { return query; },
        eq(column, value) { filters.push((row) => row[column] === value); return query; },
        neq(column, value) { filters.push((row) => row[column] !== value); return query; },
        is(column, value) { filters.push((row) => row[column] === value); return query; },
        update(values) { update = values; return query; },
        async insert(row) {
          assert.equal(table, "checkins");
          if (logError) return { error: logError };
          logs.push(row);
          return { error: null };
        },
        async maybeSingle() {
          assert.equal(table, "tickets");
          if (update) {
            if (updateError) return { data: null, error: updateError };
            beforeClaim?.(ticket);
            if (!filters.every((matches) => matches(ticket))) return { data: null, error: null };
            Object.assign(ticket, update);
            return { data: { id: ticket.id }, error: null };
          }
          if (lookupError) return { data: null, error: lookupError };
          const data = filters.every((matches) => matches(ticket)) ? { ...ticket } : null;
          // Make concurrent scans read the same unused ticket before either writes.
          if (concurrentReads > 1) {
            await new Promise((resolve) => {
              readers.push(resolve);
              if (readers.length === concurrentReads) readers.forEach((release) => release());
            });
          }
          return { data, error: null };
        }
      };
      return query;
    }
  };
}

function checkInRoute(supabase) {
  return loadTs("app/api/tickets/validate/route.ts", {
    "next/server": { NextResponse },
    "@/lib/admin": { isAdminRequest: async () => ({ ok: true, supabase }) },
    "@/lib/tickets": { hashTicketToken: async () => "hashed-token" }
  }).POST;
}

function scanRequest() {
  return new Request("https://bonkhouse.test/api/tickets/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "test-token" })
  });
}

test("simultaneous scans admit a ticket once and create one check-in log", async () => {
  const database = ticketDatabase({ concurrentReads: 2 });
  const post = checkInRoute(database);
  const responses = await Promise.all([post(scanRequest()), post(scanRequest())]);
  const results = await Promise.all(responses.map((response) => response.json()));
  assert.equal(results.filter((result) => result.status === "Good").length, 1);
  assert.equal(responses.filter((response) => response.status === 409).length, 1);
  assert.equal(database.logs.length, 1);
  assert.ok(database.ticket.checked_in_at);
});

test("a cancellation between lookup and claim cannot admit the ticket", async () => {
  const database = ticketDatabase({ beforeClaim: (ticket) => { ticket.status = "cancelled"; } });
  const response = await checkInRoute(database)(scanRequest());
  assert.equal(response.status, 409);
  assert.notEqual((await response.json()).status, "Good");
  assert.equal(database.ticket.checked_in_at, null);
  assert.equal(database.logs.length, 0);
});

for (const failure of ["lookupError", "updateError", "logError"]) {
  test(`${failure} never reports successful admission`, async () => {
    const database = ticketDatabase({ [failure]: { message: "Unavailable" } });
    const response = await checkInRoute(database)(scanRequest());
    const result = await response.json();
    assert.equal(response.status, 500);
    assert.notEqual(result.status, "Good");
    assert.equal(database.logs.length, 0);
    if (failure === "logError") {
      assert.ok(database.ticket.checked_in_at);
      assert.match(result.message, /marked as checked in/);
    } else {
      assert.equal(database.ticket.checked_in_at, null);
    }
  });
}

const callback = loadTs("app/api/auth/callback/route.ts", {
  "next/server": { NextResponse },
  "@/lib/supabase/server": {
    createClient: async () => ({ auth: {
      verifyOtp: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: null })
    } })
  },
  "@/lib/utils": { requestOrigin: () => "https://bonkhouse.test" }
}).GET;

for (const next of ["/\\example.org", "//example.org", "https://example.org", "//[invalid-host"]) {
  test(`callback rejects an external or malformed destination: ${next}`, async () => {
    const url = new URL("https://bonkhouse.test/api/auth/callback?code=test-code");
    url.searchParams.set("next", next);
    const response = await callback(new Request(url));
    assert.equal(response.headers.get("location"), "https://bonkhouse.test/admin");
  });
}

test("callback preserves a local destination and query for magic-link sign-in", async () => {
  const url = new URL("https://bonkhouse.test/api/auth/callback?token_hash=test-hash&type=magiclink");
  url.searchParams.set("next", "/admin/check-in?token=example#ticket");
  const response = await callback(new Request(url));
  assert.equal(response.headers.get("location"), "https://bonkhouse.test/admin/check-in?token=example#ticket");
});

const templates = loadTs("lib/email-templates.ts");

async function capturedTicketEmail(seatTypes) {
  let sent;
  const email = loadTs("lib/email.ts", {
    "@/lib/email-templates": templates,
    "@/lib/utils": { emailSiteUrl: () => "https://bonkhouse.test" }
  }, {
    process: { env: { RESEND_API_KEY: "test-only" } },
    fetch: async (_url, options) => {
      sent = JSON.parse(options.body);
      return { ok: true };
    }
  });
  await email.sendTicketEmail({
    to: "guest@example.test",
    guestName: "Test guest",
    eventTitle: "Test screening",
    eventDate: "Sunday",
    venue: "Test venue",
    cancelUrl: "https://bonkhouse.test/cancel",
    arrivalInstructions: "Arrive on time.",
    confirmationCode: "BONK-TEST",
    tickets: seatTypes.map((seatType, index) => ({
      label: `Ticket ${index + 1}`,
      seatType,
      qrUrl: `https://bonkhouse.test/api/ticket-qr?token=test-${index}`
    }))
  });
  return sent;
}

test("fully waitlisted reservations get waitlist copy and no admission QR codes", async () => {
  const sent = await capturedTicketEmail(["waitlist", "waitlist"]);
  assert.match(sent.subject, /waitlist/);
  assert.match(sent.html, /WAITLIST RECEIVED/);
  assert.doesNotMatch(sent.html, /YOUR SEATS ARE IN THE BAG|Ticket QR code/);
});

test("confirmed reservations retain confirmation copy and their QR codes", async () => {
  const sent = await capturedTicketEmail(["standard", "overflow"]);
  assert.match(sent.subject, /tickets for Test screening/);
  assert.match(sent.html, /RSVP CONFIRMED/);
  assert.equal((sent.html.match(/alt="Ticket QR code"/g) || []).length, 2);
});
