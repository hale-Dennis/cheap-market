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
      <div className="mb-8 space-y-2">
        <h1 className="text-[40px] font-extrabold leading-none sm:text-6xl">My orders</h1>
        <p className="text-[17px] text-muted-foreground">Track deliveries, rate farmers and report problems.</p>
      </div>
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
