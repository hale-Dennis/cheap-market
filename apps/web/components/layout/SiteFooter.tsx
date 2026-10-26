import Link from 'next/link';

import { Logo } from '@/components/brand/Logo';

// Link names differ from the header's and pages' own ("Cart", "My orders", "Create an account")
// so each name on a page stays unique for screen-reader users and tests.
const COLUMNS = [
  {
    heading: 'Shop',
    links: [{ href: '/products', label: 'All produce' }],
  },
  {
    heading: 'About',
    links: [
      { href: '/#how', label: 'How it works' },
      { href: '/#farmers', label: 'For farmers' },
    ],
  },
];

/** Footer for the public and buyer pages. */
export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-8 px-4 pb-12 pt-16 sm:px-6">
      <div className="flex max-w-xs flex-col gap-3">
        <Logo />
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Fresh produce straight from Ghanaian farmers, at fair prices.
        </p>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-12 text-[15px]">
        {COLUMNS.map((column) => (
          <div key={column.heading} className="flex flex-col gap-1">
            <p className="font-bold">{column.heading}</p>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-9 items-center text-muted-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </footer>
  );
}
