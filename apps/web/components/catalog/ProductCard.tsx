import Link from 'next/link';
import type { ProductCard as ProductCardData } from '@cheap-market/shared-types';

import { Badge } from '@/components/ui/badge';
import { formatCedis, harvestedAgo } from '@/lib/format';

export const PLACEHOLDER_IMAGE = '/images/produce-placeholder.svg';

const CARD_CLASS = 'flex h-full flex-col gap-3.5 rounded-[28px] border bg-card p-3';

/** The inside of a product card; also used, unlinked, for the admin listing preview. */
export function ProductCardContent({ product }: { product: ProductCardData }) {
  return (
    <>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- images come from Cloudinary, the API or a local blob, not static imports */}
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
    </>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className={`group ${CARD_CLASS} transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
    >
      <ProductCardContent product={product} />
    </Link>
  );
}

/** A product card that isn't a link, e.g. a preview of a listing being written. */
export function ProductCardPreview({ product }: { product: ProductCardData }) {
  return (
    <div className={CARD_CLASS}>
      <ProductCardContent product={product} />
    </div>
  );
}
