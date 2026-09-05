"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicAsset } from "@/lib/utils";
import type { Photo } from "@/types/bonkhouse";

const batchSize = 36;

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const captionId = useId();
  const visiblePhotos = useMemo(() => photos.slice(0, visibleCount), [photos, visibleCount]);
  const hasMore = visibleCount < photos.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selectedPhoto || !dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [selectedPhoto]);

  return (
    <>
      {photos.length === 0 ? (
        <div className="bh-state mt-10" role="status">
          <h2 className="bh-section-title">Photos coming soon</h2>
          <p>Photos from our screenings will appear here.</p>
        </div>
      ) : null}
      <div className="photo-masonry mt-10">
        {visiblePhotos.map((photo) => (
          <article className="club-card photo-gallery-card mb-5 break-inside-avoid p-4" key={photo.id}>
            <button
              aria-label={`Enlarge ${photo.caption}`}
              className="focus-ring group block w-full overflow-hidden rounded-sm text-left"
              disabled={!photo.imageUrl}
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
          <Button className="bh-button" onClick={() => setVisibleCount((count) => count + batchSize)} type="button">
            Load more photos
          </Button>
        </div>
      ) : null}

      {selectedPhoto ? (
        <dialog
          ref={dialogRef}
          aria-label="Expanded photo viewer"
          aria-describedby={captionId}
          className="photo-lightbox"
          onClick={() => setSelectedPhoto(null)}
          onCancel={() => setSelectedPhoto(null)}
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
            <figcaption id={captionId} className="photo-lightbox__caption">
              <span>{selectedPhoto.caption}</span>
              <span>{selectedPhoto.eventTitle}</span>
            </figcaption>
          </figure>
        </dialog>
      ) : null}
    </>
  );
}
