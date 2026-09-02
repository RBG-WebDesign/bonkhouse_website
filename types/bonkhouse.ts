// Screening records live in Supabase (events table / public_events view);
// see public/events.js for the shape the public site renders.

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
