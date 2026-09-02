// ============================================================
// BONKHOUSE SCREENINGS — the one place the public site reads event data.
//
// Source of truth: the `events` table in Supabase, edited at /admin.
// This module reads the guest-safe `public_events` view, formats rows for
// the design-canvas pages, and hands back { current, upcoming, past }.
// The view decides what is "current" (is_upcoming); this file never does.
// Nothing about a specific movie lives here.
// ============================================================

const SUPABASE_URL = "https://nwnxoqrmqsjyznegykfc.supabase.co";
const SUPABASE_KEY = "sb_publishable_FJGSI523nOCGZ6JuZSjBsg_1wnLTCma";
const LA = "America/Los_Angeles";

// Legacy logo PNGs were exported with uneven transparent padding; these crops
// keep them sized like the original design. Matched by file name, so a
// re-uploaded logo is unaffected. New logos: trim the PNG instead of adding here.
const LEGACY_LOGO_CROP = {
  "/logo_fixed_transparent.png": { w: "100%", m: "-8% 0 -9%" },
  "/uploads/Bonkhouse_ofthedead_logo.png": { w: "118%", m: "-10% 0" },
  "/uploads/Bonkhouse_Househouse_logo.png": { w: "170%", m: "-17% 0 -12%" },
  "/uploads/INFESTEDlogo.png": { w: "130%", m: "-5% 0 -8%" }
};

// Card tag colours cycle by position, like the original design.
const BADGE_COLORS = ["#1f5436", "#9d251a", "#214b73"];

function fmt(iso, opts) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("en-US", { timeZone: LA, ...opts }).format(d);
}

const time = (iso) => fmt(iso, { hour: "numeric", minute: "2-digit" });
const ms = (iso) => (iso ? new Date(iso).getTime() : null);

// Mirrors the rules in create_reservation_atomic; the database has the final say.
function rsvpState(row, now) {
  const past = { open: false, label: "Past screening", note: "This screening has already happened." };
  if (row.status !== "published" || !row.isUpcoming) return past;

  const opens = ms(row.rsvp_opens_at);
  const closes = ms(row.rsvp_closes_at) ?? ms(row.gate_closes_at) ?? ms(row.starts_at);
  if (opens && now < opens) {
    return {
      open: false,
      label: "RSVPs open soon",
      note: "RSVPs open " + fmt(row.rsvp_opens_at, { weekday: "long", month: "long", day: "numeric" }) + " at " + time(row.rsvp_opens_at) + "."
    };
  }
  if (closes && now > closes) {
    return { open: false, label: "RSVPs closed", note: "This screening is no longer taking RSVPs." };
  }
  if (row.soldOut) {
    return { open: true, label: "Waitlist only", note: "Every seat is claimed. RSVP to join the waitlist and we will email you if seats open up." };
  }
  return { open: true, label: "RSVP open", note: "" };
}

export function mapRow(row, now = Date.now()) {
  const startT = time(row.starts_at);
  const endT = time(row.ends_at);
  const doorsT = time(row.doors_at) || startT;
  const gateT = time(row.gate_closes_at);
  const venue = row.venue_name || "";
  const capacity = (row.capacity_standard || 0) + (row.capacity_overflow || 0);
  const claimed = Number(row.tickets_claimed || 0);
  const logo = row.logo_url || "";
  const crop = Object.keys(LEGACY_LOGO_CROP).find((file) => logo.endsWith(file));
  const badge = row.badge || "";
  const isDouble = /double feature/i.test(row.title + " " + badge);
  const day = fmt(row.starts_at, { day: "numeric" });
  // is_upcoming comes from the view; the fallback only matters before the
  // 202609020001 migration has been applied.
  const isUpcoming = row.is_upcoming ?? (row.status === "published" && (ms(row.starts_at) || 0) + 6 * 3600 * 1000 > now);
  const soldOut = capacity > 0 && claimed >= capacity;

  return {
    slug: row.slug,
    href: "/events/" + row.slug,
    title: row.title,
    shortTitle: row.subtitle || row.title,
    kicker: row.kicker || "",
    desc: row.description || "",
    blurb: row.kicker || row.description || "",
    poster: row.poster_url || "",
    hasPoster: !!row.poster_url,
    posterAlt: row.poster_alt_url || "",
    hasPosterAlt: !!row.poster_alt_url,
    logo,
    hasLogo: !!logo,
    noLogo: !logo,
    logoW: crop ? LEGACY_LOGO_CROP[crop].w : "100%",
    logoM: crop ? LEGACY_LOGO_CROP[crop].m : "0",
    badge,
    hasBadge: !!badge,
    eyebrow: isDouble ? "SUNDAY AFTERNOON DOUBLE FEATURE" : "SUNDAY AFTERNOON SCREENING",
    startsAt: row.starts_at,
    isUpcoming,
    isPast: !isUpcoming,
    mon: fmt(row.starts_at, { month: "short" }).toUpperCase(),
    day,
    year: fmt(row.starts_at, { year: "numeric" }),
    no: day.padStart(3, "0"),
    timeLabel: endT ? startT + " to " + endT : startT,
    doorsLabel: gateT ? doorsT + " · gate closes " + gateT : doorsT,
    dateLong: fmt(row.starts_at, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    dateLine: fmt(row.starts_at, { weekday: "long", month: "long", day: "numeric" }) + " · Doors at " + doorsT + " · Free with RSVP.",
    barLabel: "RSVP · Free · " + fmt(row.starts_at, { weekday: "short", month: "short", day: "numeric" }),
    venueShort: venue,
    venueLine: [venue, row.venue_address].filter(Boolean).join(", "),
    capacityLabel: (row.capacity_standard || 0) + " seats + " + (row.capacity_overflow || 0) + " overflow",
    capacityStandard: row.capacity_standard || 0,
    capacityOverflow: row.capacity_overflow || 0,
    maxTickets: Math.max(1, Math.min(10, Number(row.max_tickets_per_rsvp || 4))),
    inviteOnly: !!row.is_invite_only,
    entryNote: row.entry_instructions || "",
    accessNote: row.accessibility_note || "",
    hasAccessNote: !!row.accessibility_note,
    program: (row.program || []).map((name, i) => ({ n: i + 1, name })),
    hasProgram: !!(row.program && row.program.length),
    meta: startT + (venue ? " · " + venue : ""),
    soldOut,
    seatsLeft: Math.max(0, capacity - claimed),
    rsvp: rsvpState({ ...row, isUpcoming, soldOut }, now)
  };
}

let eventsPromise = null;

// Resolves to every public screening, newest first. On a network failure it
// resolves to [] with ok = false so pages can show a calm empty state.
export function loadEvents() {
  if (!eventsPromise) {
    eventsPromise = fetch(SUPABASE_URL + "/rest/v1/public_events?select=*&order=starts_at.desc", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("events fetch failed " + res.status))))
      .then((rows) => ({ ok: true, events: (Array.isArray(rows) ? rows : []).map((row) => mapRow(row)) }))
      .catch((error) => {
        console.error("[bonkhouse] could not load screenings:", error);
        return { ok: false, events: [] };
      });
  }
  return eventsPromise;
}

// current = the soonest upcoming screening; upcoming = all of them, soonest
// first (so a second published date is never lost); past = everything else.
export async function splitEvents() {
  const { ok, events } = await loadEvents();
  const t = (e) => new Date(e.startsAt).getTime();
  const upcoming = events.filter((e) => e.isUpcoming).sort((a, b) => t(a) - t(b));
  const past = events.filter((e) => e.isPast).sort((a, b) => t(b) - t(a));
  return { ok, current: upcoming[0] || null, upcoming, past };
}

export async function getEvent(slug) {
  const { events } = await loadEvents();
  return events.find((e) => e.slug === slug) || null;
}

export function badgeColor(index) {
  return BADGE_COLORS[index % BADGE_COLORS.length];
}
