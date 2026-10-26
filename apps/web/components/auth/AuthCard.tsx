import Head from 'next/head';
import type { ReactNode } from 'react';

import { Logo } from '@/components/brand/Logo';
import { PRODUCE_TINTS, ProduceArt, type ProduceShape } from '@/components/brand/ProduceArt';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const PANEL_SHAPES: ProduceShape[] = ['round', 'long', 'oval', 'oval', 'round', 'oval'];

/** Split layout used by the sign-in and sign-up pages: the form beside a decorative produce panel. */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <>
      <Head>
        <title>{`${title} · Cheap Market`}</title>
      </Head>
      <div className="flex min-h-screen gap-4 p-4">
        <main className="flex min-w-0 flex-1 flex-col px-2 py-4 sm:px-8">
          <Logo className="self-start" />
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-3">
                <h1 className="text-[40px] font-extrabold leading-none sm:text-5xl">{title}</h1>
                <p className="text-[17px] text-muted-foreground">{description}</p>
              </div>
              {children}
              <p className="text-center text-[15px] text-muted-foreground">{footer}</p>
            </div>
          </div>
        </main>
        <aside
          aria-hidden="true"
          className="hidden flex-1 flex-col justify-between gap-8 overflow-hidden rounded-[32px] bg-primary p-12 lg:flex"
        >
          <div className="grid grid-cols-3 gap-3.5">
            {PANEL_SHAPES.map((shape, index) => (
              <ProduceArt key={index} shape={shape} tint={PRODUCE_TINTS[index]} className="aspect-square rounded-3xl" />
            ))}
          </div>
          <div className="space-y-3 text-background">
            <p className="font-display text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              Fresh food, fair prices, <span className="text-accent">no middlemen.</span>
            </p>
            <p className="text-base text-background/80">Straight from farms across Ghana.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
