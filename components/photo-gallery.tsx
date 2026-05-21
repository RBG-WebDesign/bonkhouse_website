"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicAsset } from "@/lib/utils";
import type { Photo } from "@/types/bonkhouse";

const batchSize = 36;

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const visiblePhotos = useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount]);
  const hasMore = visibleCount < photos.length;

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  return (
    <>
      <div className="photo-masonry mt-10">
        {visiblePhotos.map((photo) => (
          <article className="club-card photo-gallery-card mb-5 break-inside-avoid p-4" key={photo.id}>
            <button
              aria-label={`Enlarge ${photo.caption}`}
              className="focus-ring group block w-full overflow-hidden rounded-sm text-left"
              onClick={() => setSelectedPhoto(photo)}
              type="button"
            >
              <div className="photo-frame min-h-48 bg-black">
                {photo.imageUrl ? (
                  <img
                    alt={photo.caption}
                    className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.025] group-hover:grayscale-0"
                    decoding="async"
                    loading="lazy"
                    src={publicAsset(photo.imageUrl)}
                  />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center">
                    <Camera className="relative z-10 text-butter" size={46} />
                  </div>
                )}
              </div>
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{photo.eventTitle}</Badge>
              <Badge>{photo.shotAt}</Badge>
            </div>
            <p className="mt-3 font-bold text-white">{photo.caption}</p>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => setVisibleCount((count) => count + batchSize)} type="button">
            Load more photos
          </Button>
        </div>
      ) : null}

      {selectedPhoto ? (
        <div
          aria-label="Expanded photo viewer"
          aria-modal="true"
          className="photo-lightbox"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
        >
          <button
            aria-label="Close photo viewer"
            className="photo-lightbox__close"
            onClick={() => setSelectedPhoto(null)}
            type="button"
          >
            X
          </button>
          <figure className="photo-lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <img
              alt={selectedPhoto.caption}
              className="photo-lightbox__image"
              decoding="async"
              src={publicAsset(selectedPhoto.imageUrl)}
            />
            <figcaption className="photo-lightbox__caption">
              <span>{selectedPhoto.caption}</span>
              <span>{selectedPhoto.eventTitle}</span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
