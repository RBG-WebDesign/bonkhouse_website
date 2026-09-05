import { PhotoGallery } from "@/components/photo-gallery";
import { getPhotos } from "@/lib/data";

export default async function PhotosPage() {
  const photos = await getPhotos();

  return (
    <div className="bh-container bh-page">
      <div className="max-w-3xl">
        <p className="bh-eyebrow">Photos</p>
        <h1 className="bh-page-title">
          Proof of life <span className="photo-gallery-aside">(photo gallery)</span>
        </h1>
        <p className="bh-intro">
          Uploads from past screenings and events with our friends.
        </p>
      </div>
      <PhotoGallery photos={photos} />
    </div>
  );
}
