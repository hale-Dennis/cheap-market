import Link from 'next/link';

import { useCart } from '@/hooks/useCart';

/** Round header button to the cart with the number of items; updates whenever the cart changes. */
export function CartLink() {
  const { data: cart } = useCart(true);
  const count = cart?.totalItems;
  // No number while loading, rather than a misleading "0".
  const label = count === undefined ? 'Cart' : `Cart · ${count} ${count === 1 ? 'item' : 'items'}`;

  return (
    <Link
      href="/cart"
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-card text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 2H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="sr-only">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-accent"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
