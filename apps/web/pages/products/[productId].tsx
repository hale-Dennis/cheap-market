import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import type { ProductDetail } from '@cheap-market/shared-types';

import { AddToCart } from '@/components/product/AddToCart';
import { FarmerInfo } from '@/components/product/FarmerInfo';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '@/lib/auth';
import { formatCedis, harvestedAgo } from '@/lib/format';
import { fetchProductDetail } from '@/services/productDetailService';

interface ProductPageProps {
  product: ProductDetail;
  session: PublicSession | null;
  /** Absolute URLs of the photos, for structured data and link previews. */
  absoluteImageUrls: string[];
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** schema.org Product data so search engines can show price and availability. */
function productJsonLd(product: ProductDetail, images: string[]) {
  const rating = product.farmer.ratingCount && product.farmer.averageRating;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: images.length > 0 ? images : undefined,
    category: product.categoryName,
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'GHS',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Person', name: product.farmer.fullName },
    },
    aggregateRating: rating
      ? { '@type': 'AggregateRating', ratingValue: product.farmer.averageRating, ratingCount: product.farmer.ratingCount }
      : undefined,
  };
}

export default function ProductPage({ product, session, absoluteImageUrls }: ProductPageProps) {
  const summary = product.description ?? `${product.name}, ${formatCedis(product.priceCents)} ${product.unit}.`;

  return (
    <PublicLayout title={product.name} session={session}>
      <Head>
        <meta name="description" content={summary} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={summary} />
        {absoluteImageUrls[0] && <meta property="og:image" content={absoluteImageUrls[0]} />}
        <script
          type="application/ld+json"
          // JSON.stringify output is safe here apart from "</script>"-style sequences, which "<" escaping prevents.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd(product, absoluteImageUrls)).replace(/</g, '\\u003c'),
          }}
        />
      </Head>

      <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to produce
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <ProductGallery name={product.name} imageUrls={product.imageUrls} />

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {product.categoryName}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-3">
              <span className="text-3xl font-bold">{formatCedis(product.priceCents)}</span>{' '}
              <span className="text-lg text-muted-foreground">{product.unit}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
              Harvested on <time dateTime={product.harvestDate}>{formatDate(product.harvestDate)}</time> (
              {harvestedAgo(product.harvestDate).replace('Harvested ', '')})
            </p>
          </div>

          <AddToCart
            productId={product.id}
            productName={product.name}
            unit={product.unit}
            viewerRole={session?.role ?? null}
          />

          {product.description && (
            <section aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-lg font-semibold">
                About this produce
              </h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{product.description}</p>
            </section>
          )}

          <FarmerInfo farmer={product.farmer} />
        </div>
      </div>
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<ProductPageProps, { productId: string }> = async ({
  params,
  req,
}) => {
  const product = await fetchProductDetail(params!.productId);
  if (!product) {
    return { notFound: true };
  }

  const claims = await verifyAccessToken(req.cookies[ACCESS_TOKEN_COOKIE]);
  const protocol = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
  const origin = `${protocol}://${req.headers.host}`;
  const absoluteImageUrls = product.imageUrls.map((url) => new URL(url, origin).toString());

  return {
    props: {
      product,
      session: claims ? { email: claims.sub, role: claims.role } : null,
      absoluteImageUrls,
    },
  };
};
