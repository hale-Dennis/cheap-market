import Link from 'next/link';

import { useCart } from '@/hooks/useCart';

/** Header link to the cart with the number of items; updates whenever the cart changes. */
export function CartLink() {
  const { data: cart } = useCart(true);
  const count = cart?.totalItems;

  return (
    <Link
      href="/cart"
      className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* No number while loading, rather than a misleading "0". */}
      Cart{count !== undefined && <> · {count}</>}
      {count !== undefined && (
        // Visually hidden on phones (to fit the header) but always read by screen readers.
        <span className="sr-only sm:not-sr-only"> {count === 1 ? 'item' : 'items'}</span>
      )}
    </Link>
  );
}
