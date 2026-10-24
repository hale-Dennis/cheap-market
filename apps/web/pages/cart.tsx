import type { GetServerSideProps } from 'next';

import { CartView } from '@/components/cart/CartView';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSessionForCart } from '@/lib/pageSession';

interface CartPageProps {
  session: PublicSession;
}

export default function CartPage({ session }: CartPageProps) {
  return (
    <PublicLayout title="Your cart" session={session}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
      <CartView />
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<CartPageProps> = async (context) => {
  const result = await requireBuyerSessionForCart(context);
  if (!('props' in result)) return result;
  const { email } = await result.props;
  return { props: { session: { email, role: 'BUYER' } } };
};
