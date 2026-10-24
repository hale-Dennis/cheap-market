import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { OrderConfirmation } from '@/components/orders/OrderConfirmation';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSessionForCart } from '@/lib/pageSession';

interface OrderPageProps {
  session: PublicSession;
}

export default function OrderPage({ session }: OrderPageProps) {
  const { query } = useRouter();
  const orderId = typeof query.orderId === 'string' ? query.orderId : null;

  return (
    <PublicLayout title="Order details" session={session}>
      <OrderConfirmation orderId={orderId} variant="detail" />
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<OrderPageProps> = async (context) => {
  const result = await requireBuyerSessionForCart(context);
  if (!('props' in result)) return result;
  const { email } = await result.props;
  return { props: { session: { email, role: 'BUYER' } } };
};
