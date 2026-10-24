import Link from 'next/link';
import type { ProductCard as ProductCardData } from '@cheap-market/shared-types';

import { formatCedis, harvestedAgo } from '@/lib/format';

export const PLACEHOLDER_IMAGE = '/images/produce-placeholder.svg';

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- images come from Cloudinary or the API, not static imports */}
      <img
        src={product.primaryImageUrl ?? PLACEHOLDER_IMAGE}
        alt={product.primaryImageUrl ? product.name : `No photo of ${product.name}`}
        loading="lazy"
        decoding="async"
        width={400}
        height={400}
        className="aspect-square w-full bg-muted object-cover"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.categoryName}
        </p>
        <h3 className="font-semibold leading-snug group-hover:underline">{product.name}</h3>
        <p className="text-sm">
          <span className="text-base font-bold">{formatCedis(product.priceCents)}</span>{' '}
          <span className="text-muted-foreground">{product.unit}</span>
        </p>
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {harvestedAgo(product.harvestDate)} · {product.farmerName}
        </p>
      </div>
    </Link>
  );
}
