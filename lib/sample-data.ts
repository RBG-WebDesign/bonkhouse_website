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
    slug: "sunday-double-feature",
    title: "Sunday Double Feature",
    kicker: "Trailers, commercials, first feature, intermission, second feature.",
    description:
      "A neighborhood movie afternoon with a pre-show, two features, and enough lobby chatter to make leaving immediately feel rude.",
    posterUrl: null,
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    doorsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 - 1000 * 60 * 45).toISOString(),
    gateClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 10).toISOString(),
    venue: sampleVenue,
    capacityStandard: 100,
    capacityOverflow: 20,
    status: "published",
    isInviteOnly: false,
    program: ["Pre-show trailers", "Feature one", "Intermission ads", "Feature two"],
    hostNote:
      "Bring a friend, bring patience for folding chairs, and arrive before the gate closes.",
    accessibilityNote:
      "The community center has step-free access. Email us if you need a reserved accessible seat.",
    textForEntry: "If the gate is closed, text the host number in your ticket email."
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
    imageUrl: "",
    shotAt: "2026-04-12"
  },
  {
    id: "chairs",
    eventTitle: "First Bonkhouse Afternoon",
    caption: "The overflow chair math begins.",
    imageUrl: "",
    shotAt: "2026-03-03"
  },
  {
    id: "trailers",
    eventTitle: "Sunday Double Feature",
    caption: "Pre-show trailer reel warming up.",
    imageUrl: "",
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
