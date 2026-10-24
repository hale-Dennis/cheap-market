/** Five stars, filled to the nearest half; decorative (the text alongside carries the meaning). */
export function Stars({ rating, className = 'text-lg' }: { rating: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span aria-hidden="true" className={`relative inline-block leading-none tracking-tight ${className}`}>
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
