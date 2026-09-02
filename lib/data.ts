import { sampleMerch, samplePhotos } from "@/lib/sample-data";
import type { MerchProduct, Photo } from "@/types/bonkhouse";

// Screening data for the public site lives in Supabase (events table, read
// through the public_events view). The static pages read it client-side via
// public/events.js; the one server-side consumer is the React header's RSVP
// button, which asks the view for the current screening.
export async function getCurrentScreening(): Promise<{ slug: string; title: string } | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return null;

  try {
    const response = await fetch(
      `${base}/rest/v1/public_events?select=slug,title&is_upcoming=eq.true&order=starts_at.asc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<{ slug: string; title: string }>;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function getPhotos(): Promise<Photo[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("shot_at", { ascending: false });

    if (error || !data?.length) {
      return sortPhotos(samplePhotos);
    }

    const databasePhotos = data.map((photo) => ({
      id: photo.id,
      eventTitle: photo.event_title,
      caption: photo.caption,
      imageUrl: photo.image_url,
      shotAt: photo.shot_at
    }));

    return sortPhotos([...samplePhotos, ...databasePhotos]);
  } catch {
    return sortPhotos(samplePhotos);
  }
}

export async function getMerch(): Promise<MerchProduct[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
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

function sortPhotos(photos: Photo[]) {
  const seen = new Set<string>();

  return photos
    .filter((photo) => {
      if (seen.has(photo.id)) {
        return false;
      }

      seen.add(photo.id);
      return Boolean(photo.imageUrl);
    })
    .sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }

      if ((a.sortOrder ?? 9999) !== (b.sortOrder ?? 9999)) {
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      }

      return new Date(b.shotAt).getTime() - new Date(a.shotAt).getTime();
    });
}
