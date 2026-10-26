import type { GetServerSideProps } from 'next';

import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { CheckoutView } from '@/components/checkout/CheckoutView';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSession } from '@/lib/pageSession';

interface CheckoutPageProps {
  session: PublicSession;
}

export default function CheckoutPage({ session }: CheckoutPageProps) {
  return (
    <PublicLayout title="Checkout" session={session}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[40px] font-extrabold leading-none sm:text-6xl">Checkout</h1>
        <CheckoutSteps current={2} />
      </div>
      <CheckoutView />
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<CheckoutPageProps> = async (context) => {
  const result = await requireBuyerSession(context);
  if (!('props' in result)) return result;
  const { email } = await result.props;
  return { props: { session: { email, role: 'BUYER' } } };
};
