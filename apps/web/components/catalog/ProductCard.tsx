import Link from 'next/link';
import type { ProductCard as ProductCardData } from '@cheap-market/shared-types';

import { Badge } from '@/components/ui/badge';
import { formatCedis, harvestedAgo } from '@/lib/format';

export const PLACEHOLDER_IMAGE = '/images/produce-placeholder.svg';

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col gap-3.5 rounded-[28px] border bg-card p-3 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- images come from Cloudinary or the API, not static imports */}
        <img
          src={product.primaryImageUrl ?? PLACEHOLDER_IMAGE}
          alt={product.primaryImageUrl ? product.name : `No photo of ${product.name}`}
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
          className="aspect-[4/3] w-full rounded-[20px] bg-muted object-cover"
        />
        <Badge variant="overlay" className="absolute left-3 top-3">
          {product.categoryName}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2">
        <h3 className="font-sans text-lg font-bold leading-snug group-hover:underline">{product.name}</h3>
        <p className="text-sm text-muted-foreground">
          {harvestedAgo(product.harvestDate)} · {product.farmerName}
        </p>
      </div>
      <p className="px-2 pb-1">
        <span className="font-display text-[22px] font-bold">{formatCedis(product.priceCents)}</span>{' '}
        <span className="text-sm text-muted-foreground">{product.unit}</span>
      </p>
    </Link>
  );
}
