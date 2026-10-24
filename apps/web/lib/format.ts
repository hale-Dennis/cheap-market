const CEDIS = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 185000 → "GH₵ 1,850.00". Uses a fixed locale so server and browser render the same text. */
export function formatCedis(pesewas: number): string {
  return `GH₵ ${CEDIS.format(pesewas / 100)}`;
}

/** "Harvested today", "Harvested yesterday" or "Harvested 3 days ago", from an ISO date. */
export function harvestedAgo(harvestDate: string, now = new Date()): string {
  const [year, month, day] = harvestDate.split('-').map(Number);
  const harvested = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - harvested.getTime()) / 86_400_000);
  if (days <= 0) return 'Harvested today';
  if (days === 1) return 'Harvested yesterday';
  return `Harvested ${days} days ago`;
}
