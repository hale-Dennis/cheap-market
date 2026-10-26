import { useAdminStats } from '@/hooks/useStats';
import { cn } from '@/lib/utils';

const TILES = [
  { key: 'farmers', label: 'Farmers' },
  { key: 'liveListings', label: 'Live listings' },
  { key: 'ordersInProgress', label: 'Orders in progress' },
  { key: 'openDisputes', label: 'Open disputes' },
] as const;

/** Headline counts for the admin dashboard; left out if they can't be loaded. */
export function StatTiles() {
  const { data, error } = useAdminStats();
  if (error) return null;

  return (
    <dl aria-busy={!data} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map((tile) => {
        const alert = tile.key === 'openDisputes' && (data?.openDisputes ?? 0) > 0;
        return (
          <div
            key={tile.key}
            className={cn(
              'flex flex-col gap-1.5 rounded-3xl p-5',
              alert ? 'bg-status-disputed text-status-disputed-foreground' : 'border bg-card',
            )}
          >
            <dt className={cn('text-sm font-semibold', !alert && 'text-muted-foreground')}>{tile.label}</dt>
            <dd className="font-display text-[40px] font-extrabold leading-none tracking-tight">
              {data ? data[tile.key] : <span className="text-muted-foreground">–</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
