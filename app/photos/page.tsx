import { Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPhotos } from "@/lib/data";

export default async function PhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="club-container py-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Photos</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          Evidence of a room
        </h1>
        <p className="mt-4 text-lg leading-8 text-white/68">
          Uploads from past screenings, lobby tables, borrowed chairs, and whatever the pre-show looked like before the lights went down.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <article className="club-card p-4" key={photo.id}>
            <div className="photo-frame grid aspect-[4/3] place-items-center">
              {photo.imageUrl ? (
                <img alt={photo.caption} className="h-full w-full object-cover" src={photo.imageUrl} />
              ) : (
                <Camera className="relative z-10 text-butter" size={46} />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{photo.eventTitle}</Badge>
              <Badge>{photo.shotAt}</Badge>
            </div>
            <p className="mt-3 font-bold text-white">{photo.caption}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
