import type { BonkhouseEvent, MerchProduct, Photo } from "@/types/bonkhouse";

export const sampleVenue = {
  id: "gloria-kaufman",
  name: "Gloria Kaufman Community Center",
  address: "Culver City, CA",
  neighborhood: "Culver City",
  entryInstructions:
    "Enter through the side gate. Gates close when the movie begins, but late guests can text the host number posted in the confirmation email.",
};

const lumiereMusicHall = {
  id: "lumiere-music-hall",
  name: "Lumiere Music Hall",
  address: "Beverly Hills, CA",
  neighborhood: "Lumiere Music Hall",
  entryInstructions: "Archived screening."
};

const lookGlendale = {
  id: "look-glendale",
  name: "LOOK Dine-In Cinemas Glendale",
  address: "128 Artsakh Ave, Glendale, CA",
  neighborhood: "Glendale",
  entryInstructions: "Archived private screening."
};

const bayStreet = {
  id: "bay-street",
  name: "1917 Bay St 2nd floor",
  address: "1917 Bay St 2nd floor",
  neighborhood: "Bay Street",
  entryInstructions: "Archived private screening."
};

export const sampleEvents: BonkhouseEvent[] = [
  {
    id: "sample-next-screening",
    slug: "society-videodrome-double-feature",
    title: "Society / Videodrome Double Feature",
    kicker: "Bryan Yuzna's Society meets Videodrome for a body-horror Sunday.",
    description:
      "A neighborhood body-horror movie afternoon with a pre-show, Society, intermission, Videodrome, and enough lobby chatter to make leaving immediately feel rude.",
    posterUrl: "/posters/society-videodrome-double-feature.svg",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    doorsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 - 1000 * 60 * 45).toISOString(),
    gateClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 10).toISOString(),
    venue: sampleVenue,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "published",
    isInviteOnly: false,
    program: ["Pre-show trailers", "Society", "Intermission ads", "Videodrome"],
    hostNote:
      "Bring a friend, bring patience for folding chairs, and arrive before the gate closes. Your Sundays belong to us.",
    accessibilityNote:
      "The community center has step-free access. Email us if you need a reserved accessible seat.",
    textForEntry: "If the gate is closed, text the host number in your ticket email."
  },
  {
    id: "it-came-from-outer-space-horror-double-feature",
    slug: "it-came-from-outer-space-horror-double-feature",
    title: "It Came From Outer Space Horror Double Feature",
    kicker: "The Blob and Night of the Creeps with a spooky pre-show.",
    description:
      "The first Sunday Afternoon Bonkhouse screening, a private horror double feature with The Blob, Night of the Creeps, and a spooky pre-show by your hosts.",
    posterUrl: "/posters/it-came-from-outer-space.jpg",
    startsAt: "2022-10-09T11:45:00-07:00",
    doorsAt: "2022-10-09T11:00:00-07:00",
    gateClosesAt: "2022-10-09T11:55:00-07:00",
    venue: lookGlendale,
    capacityStandard: 40,
    capacityOverflow: 0,
    status: "archived",
    isInviteOnly: true,
    program: ["Spooky pre-show", "The Blob", "Intermission", "Night of the Creeps"],
    hostNote: "Archived first screening.",
    accessibilityNote: "Archived private event.",
    textForEntry: "Archived event."
  },
  {
    id: "merry-axe-mas-christmas-horror-double-feature",
    slug: "merry-axe-mas-christmas-horror-double-feature",
    title: "Merry Axe-Mas Christmas Horror Double Feature",
    kicker: "Silent Night, Deadly Night 2 Redux and Dark Angel with a jolly pre-show.",
    description:
      "The second Sunday Afternoon Bonkhouse screening, a private Christmas horror double feature with Silent Night, Deadly Night 2 Redux, Dark Angel, and a jolly pre-show by your hosts.",
    posterUrl: "/posters/merry-axe-mas.jpg",
    startsAt: "2022-12-11T11:45:00-08:00",
    doorsAt: "2022-12-11T11:00:00-08:00",
    gateClosesAt: "2022-12-11T11:55:00-08:00",
    venue: lookGlendale,
    capacityStandard: 40,
    capacityOverflow: 0,
    status: "archived",
    isInviteOnly: true,
    program: ["Jolly pre-show", "Silent Night, Deadly Night 2 Redux", "Intermission", "Dark Angel"],
    hostNote: "Archived second screening.",
    accessibilityNote: "Archived private event.",
    textForEntry: "Archived event."
  },
  {
    id: "return-of-the-sunday-afternoon-bonkhouse-of-the-dead",
    slug: "return-of-the-sunday-afternoon-bonkhouse-of-the-dead",
    title: "The Return of the Sunday Afternoon BONKHOUSE of the Dead",
    kicker: "Halloween returns with pre-show and a room full of the living.",
    description:
      "The Return of the Sunday Afternoon BONKHOUSE of the Dead, a Halloween-leaning Bonkhouse screening at Lumiere Music Hall.",
    posterUrl: "/posters/return-of-the-sunday-afternoon.webp",
    startsAt: "2025-10-19T13:00:00-07:00",
    doorsAt: "2025-10-19T12:15:00-07:00",
    gateClosesAt: "2025-10-19T13:10:00-07:00",
    venue: lumiereMusicHall,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "archived",
    isInviteOnly: false,
    program: ["Pre-show", "Feature one", "Intermission", "Feature two"],
    hostNote: "Archived past screening.",
    accessibilityNote: "Archived event.",
    textForEntry: "Archived event."
  },
  {
    id: "house-house-halloween-double-feature",
    slug: "house-house-halloween-double-feature",
    title: "Bonkhouse and House Pardee Present: HOUSE HOUSE Halloween Double Feature",
    kicker: "In this house, houses are born to house the dead.",
    description:
      "Bonkhouse and House Pardee presented a Halloween double feature with pre-show at Lumiere Music Hall.",
    posterUrl: "/posters/house-house.webp",
    startsAt: "2024-10-13T13:00:00-07:00",
    doorsAt: "2024-10-13T12:15:00-07:00",
    gateClosesAt: "2024-10-13T13:10:00-07:00",
    venue: lumiereMusicHall,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "archived",
    isInviteOnly: false,
    program: ["Pre-show", "Feature one", "Intermission", "Feature two"],
    hostNote: "Archived past screening.",
    accessibilityNote: "Archived event.",
    textForEntry: "Archived event."
  },
  {
    id: "infested-creature-double-feature",
    slug: "infested-creature-double-feature",
    title: "Sunday Afternoon Bonkhouse Creature Double Feature",
    kicker: "This theater is just itching to have you.",
    description:
      "A private creature double feature at LOOK Dine-In Cinemas Glendale.",
    posterUrl: "/posters/infested-creature-double-feature.webp",
    startsAt: "2023-10-22T13:00:00-07:00",
    doorsAt: "2023-10-22T12:15:00-07:00",
    gateClosesAt: "2023-10-22T13:10:00-07:00",
    venue: lookGlendale,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "archived",
    isInviteOnly: true,
    program: ["Pre-show", "Feature one", "Intermission", "Feature two"],
    hostNote: "Archived private screening.",
    accessibilityNote: "Archived private event.",
    textForEntry: "Archived event."
  },
  {
    id: "retail-rampage-prom-dance-bloodbath",
    slug: "retail-rampage-prom-dance-bloodbath",
    title: "Sunday Afternoon BonkHouse Presents 80's B-Movie Mystery Double Feature",
    kicker: "Retail Rampage. Prom Dance. Bloodbath.",
    description:
      "An 80's B-movie mystery double feature with special pre-show and intermission.",
    posterUrl: "/posters/retail-rampage-prom-dance-bloodbath.webp",
    startsAt: "2023-07-09T12:00:00-07:00",
    doorsAt: "2023-07-09T11:15:00-07:00",
    gateClosesAt: "2023-07-09T12:10:00-07:00",
    venue: bayStreet,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "archived",
    isInviteOnly: true,
    program: ["Special pre-show", "Feature one", "Intermission", "Feature two"],
    hostNote: "Archived private screening.",
    accessibilityNote: "Archived private event.",
    textForEntry: "Archived event."
  }
];

export const samplePhotos: Photo[] = [
  {
    id: "lobby",
    eventTitle: "Sunday Double Feature",
    caption: "Lobby table before doors.",
    imageUrl: "https://images.pexels.com/photos/7991312/pexels-photo-7991312.jpeg?auto=compress&cs=tinysrgb&w=1200",
    shotAt: "2026-04-12"
  },
  {
    id: "chairs",
    eventTitle: "First Bonkhouse Afternoon",
    caption: "The overflow chair math begins.",
    imageUrl: "https://images.pexels.com/photos/7991567/pexels-photo-7991567.jpeg?auto=compress&cs=tinysrgb&w=1200",
    shotAt: "2026-03-03"
  },
  {
    id: "trailers",
    eventTitle: "Sunday Double Feature",
    caption: "Pre-show trailer reel warming up.",
    imageUrl: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=1200",
    shotAt: "2026-04-12"
  }
];

export const sampleMerch: MerchProduct[] = [
  {
    id: "shirt",
    name: "Bonkhouse House Shirt",
    description: "Soft black club tee for people who clap when the projector starts.",
    priceLabel: "Coming soon",
    imageUrl: null,
    status: "coming_soon"
  },
  {
    id: "zine",
    name: "Sunday Notes Zine",
    description: "Program notes, strange ads, and tiny essays from the screening room.",
    priceLabel: "Coming soon",
    imageUrl: null,
    status: "coming_soon"
  },
  {
    id: "poster",
    name: "Screening Poster Prints",
    description: "Small-run posters from past double features.",
    priceLabel: "Coming soon",
    imageUrl: null,
    status: "coming_soon"
  }
];
