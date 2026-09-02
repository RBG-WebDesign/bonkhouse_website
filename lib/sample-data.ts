import type { MerchProduct, Photo } from "@/types/bonkhouse";

// Fallback photos and merch for when Supabase is unreachable. Screenings are
// never sampled here: the events table is their only source.

export const samplePhotos: Photo[] = [
  {
    id: "house-house-screening-room",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "The room filling up before the lights went down.",
    imageUrl: "/photos/house-house-2024/mg-1639.jpg",
    shotAt: "2024-10-13",
    featured: true,
    sortOrder: 1
  },
  {
    id: "house-house-lobby-posters",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "Lobby chatter under the poster wall.",
    imageUrl: "/photos/house-house-2024/mg-1633.jpg",
    shotAt: "2024-10-13",
    featured: true,
    sortOrder: 2
  },
  {
    id: "house-house-audience-laughing",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "Audience laughter between reels.",
    imageUrl: "/photos/house-house-2024/img-0937.jpg",
    shotAt: "2024-10-13",
    featured: true,
    sortOrder: 3
  },
  {
    id: "house-house-screen-and-lobby",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "The pre-show running while people drifted in.",
    imageUrl: "/photos/house-house-2024/mg-1638.jpg",
    shotAt: "2024-10-13",
    sortOrder: 4
  },
  {
    id: "house-house-lobby-wide",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "A wide room full of pre-show arrivals.",
    imageUrl: "/photos/house-house-2024/mg-1634.jpg",
    shotAt: "2024-10-13",
    sortOrder: 5
  },
  {
    id: "house-house-screen-subtitle",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "A very useful warning from the screen.",
    imageUrl: "/photos/house-house-2024/mg-1646.jpg",
    shotAt: "2024-10-13",
    sortOrder: 6
  },
  {
    id: "house-house-costume-portrait",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "Friends in full creature-feature form.",
    imageUrl: "/photos/house-house-2024/img-0901.jpg",
    shotAt: "2024-10-13",
    sortOrder: 7
  },
  {
    id: "house-house-cat-guest",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "A lobby conversation with excellent eyewear.",
    imageUrl: "/photos/house-house-2024/img-0915.jpg",
    shotAt: "2024-10-13",
    sortOrder: 8
  },
  {
    id: "house-house-popcorn-line",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "Popcorn, costumes, and the pre-show crowd.",
    imageUrl: "/photos/house-house-2024/img-0919.jpg",
    shotAt: "2024-10-13",
    sortOrder: 9
  },
  {
    id: "house-house-post-show",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "Post-show arguments, theories, and bits.",
    imageUrl: "/photos/house-house-2024/img-0939.jpg",
    shotAt: "2024-10-13",
    sortOrder: 10
  },
  {
    id: "house-house-theater-ad",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "The custom pre-show taking over the theater.",
    imageUrl: "/photos/house-house-2024/img-5960.jpg",
    shotAt: "2024-10-13",
    sortOrder: 11
  },
  {
    id: "house-house-theater-cartoon",
    eventTitle: "HOUSE HOUSE Halloween Double Feature",
    caption: "A quiet room watching something deeply normal.",
    imageUrl: "/photos/house-house-2024/img-5961.jpg",
    shotAt: "2024-10-13",
    sortOrder: 12
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
