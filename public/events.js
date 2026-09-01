// ============================================================
// BONKHOUSE SCREENINGS — single source of truth for the site.
//
// TO ADD A NEW SCREENING:
// 1. Copy the top event object and paste the copy ABOVE it.
// 2. Set startsAt + the date/label fields, and the two graphics:
//    poster (required) and logo (required — set null only until the
//    artwork exists; cards then fall back to the title text).
//    logoW / logoM crop the logo's transparent padding (width %, margins).
// 3. Done. The soonest upcoming screening automatically becomes
//    "Now Screening" on every page; anything whose date has passed
//    is archived into Past Screenings automatically.
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

// Soonest upcoming screening = current; everything already played = past.
export function splitEvents(now = Date.now()) {
  const t = (e) => new Date(e.startsAt).getTime();
  const grace = 6 * 3600 * 1000; // stays "current" until 6h after showtime
  const future = events.filter((e) => t(e) + grace >= now).sort((a, b) => t(a) - t(b));
  const past = events.filter((e) => t(e) + grace < now).sort((a, b) => t(b) - t(a));
  return { current: future[0] || null, upcoming: future, past };
}
