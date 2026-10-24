import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { OrderConfirmation } from '@/components/orders/OrderConfirmation';
import { PublicLayout, type PublicSession } from '@/components/PublicLayout';
import { requireBuyerSessionForCart } from '@/lib/pageSession';

interface ConfirmationPageProps {
  session: PublicSession;
}

export default function OrderConfirmationPage({ session }: ConfirmationPageProps) {
  const { query } = useRouter();
  const orderId = typeof query.orderId === 'string' ? query.orderId : null;

  return (
    <PublicLayout title="Order confirmed" session={session}>
      <OrderConfirmation orderId={orderId} />
    </PublicLayout>
  );
}

export const getServerSideProps: GetServerSideProps<ConfirmationPageProps> = async (context) => {
  // Signed-out visitors (e.g. from a bookmark) sign in and come back here.
  const result = await requireBuyerSessionForCart(context);
  if (!('props' in result)) return result;
  const { email } = await result.props;
  return { props: { session: { email, role: 'BUYER' } } };
};
