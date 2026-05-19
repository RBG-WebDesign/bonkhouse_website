import { createClient } from "@/lib/supabase/server";
import { sampleEvents, sampleMerch, samplePhotos } from "@/lib/sample-data";
import type { BonkhouseEvent, MerchProduct, Photo } from "@/types/bonkhouse";

export async function getEvents() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*, venues(*)")
      .order("starts_at", { ascending: true });

    if (error || !data?.length) {
      return sampleEvents;
    }

    return data.map(mapEvent);
  } catch {
    return sampleEvents;
  }
}

export async function getEventBySlug(slug: string) {
  const events = await getEvents();
  return events.find((event) => event.slug === slug) || null;
}

export async function getPhotos(): Promise<Photo[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("shot_at", { ascending: false });

    if (error || !data?.length) {
      return samplePhotos;
    }

    return data.map((photo) => ({
      id: photo.id,
      eventTitle: photo.event_title,
      caption: photo.caption,
      imageUrl: photo.image_url,
      shotAt: photo.shot_at
    }));
  } catch {
    return samplePhotos;
  }
}

export async function getMerch(): Promise<MerchProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("merch_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data?.length) {
      return sampleMerch;
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      priceLabel: item.price_label,
      imageUrl: item.image_url,
      status: item.status
    }));
  } catch {
    return sampleMerch;
  }
}

function mapEvent(row: any): BonkhouseEvent {
  const venue = row.venues || {};

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kicker: row.kicker || "",
    description: row.description || "",
    posterUrl: row.poster_url,
    startsAt: row.starts_at,
    doorsAt: row.doors_at,
    gateClosesAt: row.gate_closes_at,
    venue: {
      id: venue.id || "",
      name: venue.name || "Gloria Kaufman Community Center",
      address: venue.address || "Culver City, CA",
      neighborhood: venue.neighborhood || "Culver City",
      entryInstructions: venue.entry_instructions || row.entry_instructions || ""
    },
    capacityStandard: row.capacity_standard || 100,
    capacityOverflow: row.capacity_overflow || 20,
    status: row.status,
    isInviteOnly: row.is_invite_only || false,
    program: row.program || [],
    hostNote: row.host_note || "",
    accessibilityNote: row.accessibility_note || "",
    textForEntry: row.text_for_entry || ""
  };
}
