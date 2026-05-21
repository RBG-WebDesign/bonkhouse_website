export type SeatType = "standard" | "overflow" | "waitlist";
export type EventStatus = "draft" | "published" | "archived";

export type Venue = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  entryInstructions: string;
};

export type BonkhouseEvent = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  description: string;
  posterUrl: string | null;
  startsAt: string;
  endsAt?: string;
  doorsAt: string;
  gateClosesAt: string;
  venue: Venue;
  capacityStandard: number;
  capacityOverflow: number;
  status: EventStatus;
  isInviteOnly: boolean;
  program: string[];
  hostNote: string;
  accessibilityNote: string;
  textForEntry: string;
};

export type Photo = {
  id: string;
  eventTitle: string;
  caption: string;
  imageUrl: string;
  shotAt: string;
  featured?: boolean;
  sortOrder?: number;
};

export type MerchProduct = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  imageUrl: string | null;
  status: "available" | "coming_soon" | "sold_out";
};
