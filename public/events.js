// ============================================================
// BONKHOUSE SCREENINGS
//
// Events now live in Supabase and are managed at /admin — create or edit a
// screening there and this page updates with no deploy. The list below is
// two things at once:
//   1. FALLBACK: shown if the database can't be reached.
//   2. PRESENTATION OVERRIDES: when a database event has the same slug as an
//      entry here, hand-tuned art fields (logo crop, badges, shortTitle,
//      heroBadge) are taken from this list; dates/times/venue/details come
//      from the database.
// ============================================================

export const events = [
  {
    slug: "society-videodrome-double-feature",
    title: "DEATH TO BONKHOUSE LONG LIVE THE NEW FLESH - VIDEODROME/SOCIETY DOUBLE FEATURE",
    shortTitle: "SOCIETY + VIDEODROME",
    kicker: "Join us for a very fleshy body-horror double feature Sunday.",
    desc: "This October, Bonkhouse celebrates 5 years of bonkers screenings with two of the craziest, goopiest, fleshy-ist cult movies of all time! Join us for Videodrome and Society along with a curated preshow and intermission.",
    poster: "/videodrome-poster.webp",
    logo: "public/logo_fixed_transparent.png", logoW: "100%", logoM: "-8% 0 -9%",
    startsAt: "2026-10-18T13:00:00-07:00",
    mon: "OCT", day: "18", year: "2026", no: "018",
    timeLabel: "1:00 PM to 5:00 PM",
    doorsLabel: "1:00 PM \u00b7 gate closes 1:20 PM",
    dateLong: "Sunday, October 18, 2026",
    dateLine: "Sunday, October 18 \u00b7 Doors at 1:00 PM \u00b7 Free with RSVP.",
    barLabel: "RSVP \u00b7 Free \u00b7 Sun Oct 18",
    venueShort: "Gloria Kaufman Community Center",
    venueLine: "Gloria Kaufman Community Center, Culver City, CA \u00b7 side gate",
    capacityLabel: "80 seats + 20 overflow",
    lateNote: "If the gate is closed, text the host number in your ticket email.",
    entryNote: "Enter through the side gate. Gates close when the movie begins, but late guests can text the host number posted in the confirmation email.",
    hostNote: "",
    accessNote: "The community center has step-free access. Email us if you need a reserved accessible seat.",
    heroBadge: "BODY HORROR DOUBLE FEATURE",
    program: ["Pre-show trailers", "Videodrome", "Intermission", "Society"],
    cardBadge: { label: "DOUBLE FEATURE", bg: "#9d251a" },
    archiveBadge: null,
    meta: "1:00 PM \u00b7 Gloria Kaufman Community Center"
  },
  {
    slug: "return-of-the-sunday-afternoon-bonkhouse-of-the-dead",
    title: "The Return of the Sunday Afternoon Bonkhouse of the Dead",
    desc: "Halloween returns with pre-show and a room full of the living.",
    poster: "public/posters/return-of-the-sunday-afternoon.webp",
    logo: "uploads/Bonkhouse_ofthedead_logo.png", logoW: "118%", logoM: "-10% 0",
    startsAt: "2025-10-19T13:00:00-07:00",
    mon: "OCT", day: "19", year: "2025",
    meta: "1:00 PM \u00b7 Lumiere Music Hall",
    cardBadge: { label: "SINGLE FEATURE", bg: "#1f5436" },
    archiveBadge: { label: "DISCUSSION TO FOLLOW", bg: "#1f5436" }
  },
  {
    slug: "house-house-halloween-double-feature",
    title: "Bonkhouse and House Pardee Present: House House Halloween Double Feature",
    desc: "In this house, houses are born to house the dead.",
    poster: "public/posters/house-house.webp",
    logo: "uploads/Bonkhouse_Househouse_logo.png", logoW: "170%", logoM: "-17% 0 -12%",
    startsAt: "2024-10-13T13:00:00-07:00",
    mon: "OCT", day: "13", year: "2024",
    meta: "1:00 PM \u00b7 Lumiere Music Hall",
    cardBadge: { label: "DOUBLE FEATURE", bg: "#9d251a" },
    archiveBadge: { label: "DISCUSSION TO FOLLOW", bg: "#1f5436" }
  },
  {
    slug: "infested-creature-double-feature",
    title: "Infested: A Creature Double Feature",
    desc: "This theater is just itching to have you.",
    poster: "public/posters/infested-creature-double-feature.webp",
    logo: "uploads/INFESTEDlogo.png", logoW: "130%", logoM: "-5% 0 -8%",
    startsAt: "2023-10-22T13:00:00-07:00",
    mon: "OCT", day: "22", year: "2023",
    meta: "1:00 PM \u00b7 LOOK Dine-In Cinemas Glendale",
    cardBadge: { label: "DOUBLE FEATURE", bg: "#214b73" },
    archiveBadge: null
  },
  {
    slug: "retail-rampage-prom-dance-bloodbath",
    title: "Sunday Afternoon Bonkhouse Presents 80's B-Movie Mystery Double Feature",
    desc: "Retail Rampage. Prom Dance. Bloodbath.",
    poster: "public/posters/retail-rampage-prom-dance-bloodbath.webp",
    logo: null, logoW: "100%", logoM: "0",
    startsAt: "2023-07-09T12:00:00-07:00",
    mon: "JUL", day: "9", year: "2023",
    meta: "12:00 PM \u00b7 1917 Bay St 2nd Floor",
    cardBadge: { label: "DOUBLE FEATURE", bg: "#214b73" },
    archiveBadge: null
  },
  {
    slug: "merry-axe-mas-christmas-horror-double-feature",
    title: "Merry Axe-Mas Christmas Horror Double Feature",
    desc: "Silent Night, Deadly Night 2 Redux and Dark Angel with a jolly pre-show.",
    poster: "public/posters/merry-axe-mas.jpg",
    logo: null, logoW: "100%", logoM: "0",
    startsAt: "2022-12-11T11:45:00-08:00",
    mon: "DEC", day: "11", year: "2022",
    meta: "11:45 AM \u00b7 LOOK Dine-In Cinemas Glendale",
    cardBadge: { label: "DOUBLE FEATURE", bg: "#214b73" },
    archiveBadge: null
  },
  {
    slug: "it-came-from-outer-space-horror-double-feature",
    title: "It Came From Outer Space Horror Double Feature",
    desc: "The Blob and Night of the Creeps with a spooky pre-show.",
    poster: "public/posters/it-came-from-outer-space.jpg",
    logo: null, logoW: "100%", logoM: "0",
    startsAt: "2022-10-09T11:45:00-07:00",
    mon: "OCT", day: "9", year: "2022",
    meta: "11:45 AM \u00b7 LOOK Dine-In Cinemas Glendale",
    cardBadge: { label: "DOUBLE FEATURE", bg: "#214b73" },
    archiveBadge: null
  }
];

// ---- Live data from Supabase (public read-only view) ---------------------
// The view exposes only published/archived events and only guest-safe columns.
const SUPABASE_URL = "https://nwnxoqrmqsjyznegykfc.supabase.co";
const SUPABASE_KEY = "sb_publishable_FJGSI523nOCGZ6JuZSjBsg_1wnLTCma";
const LA = "America/Los_Angeles";

function fmtLA(iso, opts) {
  return new Intl.DateTimeFormat("en-US", { timeZone: LA, ...opts }).format(new Date(iso));
}

function timeLA(iso) {
  return fmtLA(iso, { hour: "numeric", minute: "2-digit" });
}

function mapRow(row, index, p) {
  p = p || {};
  const startT = timeLA(row.starts_at);
  const endT = row.ends_at ? timeLA(row.ends_at) : "";
  const doorsT = row.doors_at ? timeLA(row.doors_at) : startT;
  const gateT = row.gate_closes_at ? timeLA(row.gate_closes_at) : "";
  const venueName = row.venue_name || "";

  return {
    slug: row.slug,
    title: row.title,
    shortTitle: p.shortTitle || row.subtitle || row.title,
    kicker: row.kicker || "",
    desc: row.description || "",
    poster: row.poster_url || p.poster || "",
    logo: row.logo_url || p.logo || null,
    logoW: p.logoW || "100%",
    logoM: p.logoM || "0",
    startsAt: row.starts_at,
    mon: fmtLA(row.starts_at, { month: "short" }).toUpperCase(),
    day: fmtLA(row.starts_at, { day: "numeric" }),
    year: fmtLA(row.starts_at, { year: "numeric" }),
    no: p.no || String(index + 1).padStart(3, "0"),
    timeLabel: endT ? startT + " to " + endT : startT,
    doorsLabel: gateT ? doorsT + " · gate closes " + gateT : doorsT,
    dateLong: fmtLA(row.starts_at, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    dateLine: fmtLA(row.starts_at, { weekday: "long", month: "long", day: "numeric" }) + " · Doors at " + doorsT + " · Free with RSVP.",
    barLabel: "RSVP · Free · " + fmtLA(row.starts_at, { weekday: "short", month: "short", day: "numeric" }),
    venueShort: venueName,
    venueLine: [venueName, row.venue_address].filter(Boolean).join(", "),
    capacityLabel: row.capacity_standard + " seats + " + row.capacity_overflow + " overflow",
    lateNote: p.lateNote || "If the gate is closed, text the host number in your ticket email.",
    entryNote: row.entry_instructions || "",
    hostNote: p.hostNote || "",
    accessNote: row.accessibility_note || "",
    heroBadge: p.heroBadge || (row.subtitle || "").toUpperCase(),
    program: row.program || [],
    cardBadge: p.cardBadge || { label: "SCREENING", bg: "#9d251a" },
    archiveBadge: p.archiveBadge || null,
    meta: startT + (venueName ? " · " + venueName : "")
  };
}

let liveEventsPromise = null;

export function loadEvents() {
  if (!liveEventsPromise) {
    liveEventsPromise = fetch(
      SUPABASE_URL + "/rest/v1/public_events?select=*&order=starts_at.desc",
      { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("events fetch failed"))))
      .then((rows) => {
        if (!Array.isArray(rows) || !rows.length) return events;
        const overrides = new Map(events.map((e) => [e.slug, e]));
        const dbSlugs = new Set(rows.map((r) => r.slug));
        const mapped = rows.map((row, i) => mapRow(row, i, overrides.get(row.slug)));
        // Keep hand-written events the database doesn't know about (old history).
        return mapped.concat(events.filter((e) => !dbSlugs.has(e.slug)));
      })
      .catch(() => events);
  }
  return liveEventsPromise;
}

// Soonest upcoming screening = current; everything already played = past.
// Async now: resolves from the database, falling back to the list above.
export async function splitEvents(now = Date.now()) {
  const all = await loadEvents();
  const t = (e) => new Date(e.startsAt).getTime();
  const grace = 6 * 3600 * 1000; // stays "current" until 6h after showtime
  const future = all.filter((e) => t(e) + grace >= now).sort((a, b) => t(a) - t(b));
  const past = all.filter((e) => t(e) + grace < now).sort((a, b) => t(b) - t(a));
  return { current: future[0] || null, upcoming: future, past };
}
