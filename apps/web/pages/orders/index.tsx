import type { GetServerSideProps } from 'next';

import { OrderHistory } from '@/components/orders/OrderHistory';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSessionForCart } from '@/lib/pageSession';

interface OrdersPageProps {
  session: PublicSession;
}

export default function OrdersPage({ session }: OrdersPageProps) {
  return (
    <PublicLayout title="My orders" session={session}>
      <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">My orders</h1>
      <OrderHistory />
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<OrdersPageProps> = async (context) => {
  const result = await requireBuyerSessionForCart(context);
  if (!('props' in result)) return result;
  const { email } = await result.props;
  return { props: { session: { email, role: 'BUYER' } } };
};
