import Link from 'next/link';

import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  /** `light` for use on the forest-green admin sidebar and hero panels. */
  tone?: 'dark' | 'light';
  /** Small caption under the wordmark, e.g. "Admin". */
  caption?: string;
  className?: string;
}

/** The leaf mark and "cheap market" wordmark, linking home. */
export function Logo({ href = '/', tone = 'dark', caption, className }: LogoProps) {
  const light = tone === 'light';
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2.5 whitespace-nowrap', light ? 'text-background' : 'text-primary', className)}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          light ? 'bg-accent text-accent-foreground' : 'bg-primary text-accent',
        )}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[22px] font-extrabold leading-tight tracking-tight">cheap market</span>
        {caption && (
          <span className={cn('text-xs font-bold uppercase tracking-widest', light ? 'text-background/75' : 'text-muted-foreground')}>
            {caption}
          </span>
        )}
      </span>
    </Link>
  );
}
