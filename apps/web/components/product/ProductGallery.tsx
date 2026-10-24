import { useState, type KeyboardEvent } from 'react';

import { PLACEHOLDER_IMAGE } from '@/components/catalog/ProductCard';
import { imageSrcSet, sizedImageUrl } from '@/lib/image';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  name: string;
  imageUrls: string[];
}

/** Main photo with previous/next controls and thumbnails; a placeholder when there are no photos. */
export function ProductGallery({ name, imageUrls }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = imageUrls.length;

  if (count === 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static placeholder
      <img
        src={PLACEHOLDER_IMAGE}
        alt={`No photo of ${name}`}
        className="aspect-square w-full rounded-lg border bg-muted object-cover"
      />
    );
  }

  const show = (next: number) => setIndex((next + count) % count);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  }

  const current = imageUrls[index];

  return (
    <section aria-roledescription="carousel" aria-label={`Photos of ${name}`} onKeyDown={handleKeyDown}>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary sizing via sizedImageUrl/srcSet */}
        <img
          src={sizedImageUrl(current, 800)}
          srcSet={imageSrcSet(current, [400, 800, 1200])}
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={count > 1 ? `${name}, photo ${index + 1} of ${count}` : name}
          className="aspect-square w-full rounded-lg border bg-muted object-cover"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(index - 1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-lg shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => show(index + 1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-lg shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Choose a photo">
          {imageUrls.map((url, i) => (
            <li key={`${url}-${i}`}>
              <button
                type="button"
                onClick={() => show(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
                className={cn(
                  'block w-full overflow-hidden rounded-md border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === index ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
                <img
                  src={sizedImageUrl(url, 160)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
