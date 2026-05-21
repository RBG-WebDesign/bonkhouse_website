import { PhotoGallery } from "@/components/photo-gallery";
import { getPhotos } from "@/lib/data";

export default async function PhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="club-container py-10">
      <div className="max-w-3xl">
        <p className="eyebrow">Photos</p>
        <h1 className="font-display text-6xl uppercase leading-none tracking-[-0.06em] text-white">
          Proof of life <span className="photo-gallery-aside">(photo gallery)</span>
        </h1>
        <p className="mt-4 text-lg leading-8 text-white/68">
          Uploads from past screenings and events with our friends.
        </p>
      </div>
      <PhotoGallery photos={photos} />
    </div>
  );
}
