import Link from 'next/link';
import { regionName, type RegionCode } from '@cheap-market/shared-types';

import { PRODUCE_TINTS, ProduceArt, type ProduceShape } from '@/components/brand/ProduceArt';
import { ProductCard } from '@/components/catalog/ProductCard';
import { buttonVariants } from '@/components/ui/button';
import { useCatalogProducts, usePublicCategories } from '@/hooks/useCatalog';
import { usePublicStats } from '@/hooks/useStats';
import { cn } from '@/lib/utils';

const SHAPES: ProduceShape[] = ['round', 'oval', 'long', 'oval', 'round', 'oval'];
const FRESH_COUNT = 4;

function SectionHeading({ title, subtitle, link }: { title: string; subtitle?: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <h2 className="text-[32px] font-extrabold leading-none sm:text-5xl">{title}</h2>
        {subtitle && <p className="text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link.href} className="flex min-h-11 items-center text-[15px] font-semibold underline-offset-4 hover:underline">
          {link.label} →
        </Link>
      )}
    </div>
  );
}

/** Farmers selling and regions covered, once there's something worth showing. */
function HeroStats() {
  const { data } = usePublicStats();
  if (!data || data.farmers === 0) return null;
  const items = [
    { value: data.farmers, label: data.farmers === 1 ? 'Farmer selling' : 'Farmers selling' },
    ...(data.regions > 0 ? [{ value: data.regions, label: data.regions === 1 ? 'Region covered' : 'Regions covered' }] : []),
  ];
  return (
    <dl className="flex flex-wrap gap-8 pt-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse gap-0.5">
          <dt className="text-sm text-background/75">{item.label}</dt>
          <dd className="font-display text-3xl font-bold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Hero() {
  return (
    <section className="flex flex-wrap items-center gap-12 overflow-hidden rounded-[36px] bg-primary p-7 sm:p-12 lg:p-16">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-7 text-background">
        <span className="flex items-center gap-2 self-start rounded-full bg-background/10 px-3.5 py-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Straight from farms across Ghana
        </span>
        <h1 className="text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-6xl xl:text-7xl">
          Fresh food,
          <br />
          fair prices,
          <br />
          <span className="text-accent">no middlemen.</span>
        </h1>
        <p className="max-w-[480px] text-lg leading-relaxed text-background/80">
          Buy tomatoes, yam, plantain and more directly from the farmers who grow them. They earn more, you pay less.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/products" className={buttonVariants({ variant: 'accent', size: 'lg' })}>
            Browse produce
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-background/40 text-background hover:bg-background/10')}
          >
            Create an account
          </Link>
        </div>
        <HeroStats />
      </div>
      <div aria-hidden="true" className="mx-auto grid w-full min-w-0 max-w-[520px] flex-[1_1_380px] grid-cols-2 gap-4">
        {SHAPES.slice(0, 4).map((shape, index) => (
          <ProduceArt key={index} shape={shape} tint={PRODUCE_TINTS[index]} className="aspect-square rounded-[28px]" />
        ))}
      </div>
    </section>
  );
}

export function ShopByCategory() {
  const { data: categories } = usePublicCategories();
  if (!categories || categories.length === 0) return null;

  return (
    <section aria-label="Shop by category">
      <SectionHeading title="Shop by category" link={{ href: '/products', label: 'See all produce' }} />
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
        {categories.map((category, index) => (
          <li key={category.id}>
            <Link
              href={`/products?category=${encodeURIComponent(category.id)}`}
              className="flex h-full flex-col gap-5 rounded-3xl border bg-card p-5 font-bold hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ProduceArt
                shape={SHAPES[index % SHAPES.length]}
                tint={PRODUCE_TINTS[index % PRODUCE_TINTS.length]}
                className="h-16 w-16 rounded-2xl"
              />
              <span className="text-[17px]">{category.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FreshThisWeek({ region }: { region: RegionCode }) {
  const { data } = useCatalogProducts({ region, page: 0 });
  const products = data?.content.slice(0, FRESH_COUNT) ?? [];
  if (products.length === 0) return null;

  return (
    <section aria-label="Fresh this week">
      <SectionHeading
        title="Fresh this week"
        subtitle={`The latest listings from farmers in ${regionName(region)}, priced by the farmer.`}
        link={{ href: '/products', label: 'View catalog' }}
      />
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  {
    title: 'Farmers list their harvest',
    body: 'Our agents help farmers post fresh produce with real photos and fair prices.',
    className: 'bg-card text-foreground border',
  },
  {
    title: 'You order direct',
    body: 'Pick what you need, check out once and track every order from your account.',
    className: 'bg-primary text-background',
  },
  {
    title: 'Rate and resolve',
    body: 'Rate the farmer after delivery. If something is wrong, report it from your order.',
    className: 'bg-muted text-foreground',
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="flex scroll-mt-6 flex-wrap gap-12">
      <div className="flex flex-[1_1_340px] flex-col gap-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">How it works</p>
        <h2 id="how-heading" className="text-[32px] font-extrabold leading-[1.05] sm:text-5xl">
          From the farm gate to your door, in three steps.
        </h2>
        <p className="max-w-[420px] text-[17px] leading-relaxed text-muted-foreground">
          Every order goes straight to the farmer. If something isn&apos;t right, our team helps you sort it out.
        </p>
      </div>
      <ol className="grid flex-[2_1_560px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className={cn('flex min-h-[260px] flex-col gap-10 rounded-[28px] p-7', step.className)}>
            <span aria-hidden="true" className="font-display text-[56px] font-extrabold leading-none tracking-tighter">
              0{index + 1}
            </span>
            <div className="mt-auto space-y-2">
              <h3 className="font-sans text-xl font-bold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed opacity-90">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FARMER_POINTS = ['An agent registers you and lists your produce', 'You set your own prices', 'Buyer ratings build your reputation'];

export function ForFarmers() {
  return (
    <section id="farmers" aria-labelledby="farmers-heading" className="flex scroll-mt-6 flex-wrap overflow-hidden rounded-[36px] border bg-card">
      <div aria-hidden="true" className="flex min-h-[320px] flex-[1_1_420px] items-center justify-center gap-4 bg-muted p-10">
        {SHAPES.slice(0, 3).map((shape, index) => (
          <ProduceArt key={index} shape={shape} tint={PRODUCE_TINTS[index]} className="aspect-square w-1/4 rounded-3xl" />
        ))}
      </div>
      <div className="flex flex-[1_1_420px] flex-col justify-center gap-5 p-7 sm:p-12 lg:p-16">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">For farmers</p>
        <h2 id="farmers-heading" className="text-3xl font-extrabold leading-[1.05] sm:text-[44px]">
          No smartphone? No problem. We&apos;ll list your harvest for you.
        </h2>
        <p className="text-[17px] leading-relaxed text-muted-foreground">
          Our agents register you, photograph your produce and publish your listings, so buyers in your region can order straight from you.
        </p>
        <ul className="space-y-3 text-base font-medium">
          {FARMER_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="flex flex-wrap items-center justify-between gap-7 rounded-[36px] bg-accent p-7 text-accent-foreground sm:p-12 lg:p-16">
      <h2 className="flex-[1_1_420px] text-[32px] font-extrabold leading-[1.02] sm:text-[56px]">
        Your next market run starts here.
      </h2>
      {/* A plain GET form: carries the email to /signup?email=…, where the sign-up form picks it up. */}
      <form action="/signup" method="get" className="flex flex-[1_1_380px] flex-wrap gap-2.5">
        <label htmlFor="cta-email" className="sr-only">
          Email address
        </label>
        <input
          id="cta-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          className="h-14 min-w-0 flex-[1_1_220px] rounded-full border-0 bg-card px-5 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" className={buttonVariants({ size: 'lg' })}>
          Get started
        </button>
      </form>
    </section>
  );
}
