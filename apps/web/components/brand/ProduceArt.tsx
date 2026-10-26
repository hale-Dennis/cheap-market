import { cn } from '@/lib/utils';

export type ProduceShape = 'round' | 'oval' | 'long';

export interface ProduceTint {
  /** Fill of the produce itself. */
  color: string;
  /** Soft tile background behind it. */
  background: string;
}

/** Tints for decorative tiles, cycled by index so neighbouring tiles differ. */
export const PRODUCE_TINTS: ProduceTint[] = [
  { color: '#D9452B', background: '#F6D9CF' },
  { color: '#E7B32B', background: '#F7E8B5' },
  { color: '#4F7A2E', background: '#DCE8C6' },
  { color: '#6B3E86', background: '#E6DAEE' },
  { color: '#F08A24', background: '#FBE2C8' },
  { color: '#9A6B3F', background: '#EDE0CF' },
];

const SHAPES: Record<ProduceShape, { rx: number; ry: number; rotate: number }> = {
  round: { rx: 40, ry: 38, rotate: 0 },
  oval: { rx: 30, ry: 40, rotate: -15 },
  long: { rx: 22, ry: 46, rotate: 35 },
};

interface ProduceArtProps {
  tint: ProduceTint;
  shape?: ProduceShape;
  className?: string;
}

/**
 * A simple illustrated piece of produce on a tinted tile. Decorative only: used for
 * landing-page artwork and as the fallback when a listing has no photo.
 */
export function ProduceArt({ tint, shape = 'round', className }: ProduceArtProps) {
  const { rx, ry, rotate } = SHAPES[shape];
  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center justify-center', className)}
      style={{ backgroundColor: tint.background }}
    >
      <svg viewBox="0 0 120 120" className="h-3/5 w-3/5">
        <ellipse cx="60" cy="66" rx={rx} ry={ry} fill={tint.color} transform={`rotate(${rotate} 60 66)`} />
        <ellipse cx="46" cy="52" rx="10" ry="6" fill="#FFFFFF" opacity="0.28" transform="rotate(-30 46 52)" />
        <path d="M60 26c-4-10 4-16 14-14-2 9-7 13-14 14Z" fill="#3F8F4E" />
      </svg>
    </div>
  );
}
