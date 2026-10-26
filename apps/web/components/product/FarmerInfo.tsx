import { regionName, type FarmerSummary } from '@cheap-market/shared-types';

import { Stars } from '@/components/ratings/Stars';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function FarmerInfo({ farmer }: { farmer: FarmerSummary }) {
  const count = farmer.ratingCount ?? 0;
  const rated = count > 0 && farmer.averageRating !== null;

  return (
    <section aria-label="Farmer" className="flex flex-wrap items-center gap-4 rounded-3xl border bg-card p-5">
      <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold">
        {initials(farmer.fullName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted-foreground">Sold by</p>
        <p className="text-[17px] font-bold">{farmer.fullName}</p>
        <p className="text-sm text-muted-foreground">{regionName(farmer.region)} region</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
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
    </section>
  );
}
