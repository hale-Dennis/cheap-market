import { regionName, type FarmerSummary } from '@cheap-market/shared-types';

/** Five stars, filled to the nearest half; decorative (the text alongside carries the meaning). */
function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span aria-hidden="true" className="relative inline-block text-lg leading-none tracking-tight">
      <span className="text-border">★★★★★</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-amber-600"
        style={{ width: `${(rounded / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

export function FarmerInfo({ farmer }: { farmer: FarmerSummary }) {
  const count = farmer.ratingCount ?? 0;
  const rated = count > 0 && farmer.averageRating !== null;

  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sold by</p>
      <p className="mt-1 font-semibold">{farmer.fullName}</p>
      <p className="text-sm text-muted-foreground">{regionName(farmer.region)} region</p>
      <div className="mt-2 flex items-center gap-2 text-sm">
        {rated ? (
          <>
            <Stars rating={farmer.averageRating!} />
            <span>
              <span className="font-medium">{farmer.averageRating!.toFixed(1)}</span>
              <span className="sr-only"> out of 5</span>{' '}
              <span className="text-muted-foreground">
                ({count} {count === 1 ? 'rating' : 'ratings'})
              </span>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No ratings yet</span>
        )}
      </div>
    </div>
  );
}
