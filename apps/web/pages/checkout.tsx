import type { GetServerSideProps } from 'next';

import { CheckoutView } from '@/components/checkout/CheckoutView';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSession } from '@/lib/pageSession';

interface CheckoutPageProps {
  session: PublicSession;
}

export default function CheckoutPage({ session }: CheckoutPageProps) {
  return (
    <PublicLayout title="Checkout" session={session}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Checkout</h1>
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
