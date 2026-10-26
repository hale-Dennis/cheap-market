import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState, type FormEvent } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { regionName } from '@cheap-market/shared-types';

import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { FulfillmentSelector } from '@/components/checkout/FulfillmentSelector';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { CART_KEY, useCart } from '@/hooks/useCart';
import { useDeliveryFee, usePickupLocations } from '@/hooks/useCheckout';
import { checkoutTotals, selectionError, type FulfillmentSelection } from '@/lib/checkout';
import { newIdempotencyKey } from '@/lib/idempotency';
import { parseRegion } from '@/lib/region';
import { ApiError } from '@/services/apiClient';
import { placeOrder } from '@/services/orderService';

/** Errors after which the cart has changed on the server and should be reloaded. */
const CART_CHANGED = new Set(['EMPTY_CART', 'UNAVAILABLE_ITEMS']);

export function CheckoutView() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  // One key per checkout visit, reused if the buyer retries, so a repeat can't create a second order.
  const idempotencyKey = useRef<string | null>(null);
  idempotencyKey.current ??= newIdempotencyKey();
  const cart = useCart(true);
  const profile = useBuyerProfile();
  const region = parseRegion(profile.data?.region);
  const deliveryFee = useDeliveryFee(region);
  const pickupLocations = usePickupLocations(region);

  const [selection, setSelection] = useState<FulfillmentSelection>({ type: null, pickupLocationId: null });
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const loadError = cart.error ?? profile.error;
  if (loadError && !(cart.data && profile.data)) {
    return (
      <Card className="p-6">
        <p role="alert" className="text-sm text-destructive">
          {loadError instanceof ApiError ? loadError.message : 'Could not load your checkout.'}
        </p>
      </Card>
    );
  }
  if (!cart.data || !profile.data) {
    return <p className="text-sm text-muted-foreground">Loading checkout…</p>;
  }

  if (cart.data.items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">Add some produce before checking out.</p>
        <Link href="/products" className={buttonVariants()}>
          Browse produce
        </Link>
      </Card>
    );
  }

  const unavailable = cart.data.items.filter((item) => !item.available);
  if (unavailable.length > 0) {
    return (
      <Card className="space-y-3 p-6">
        <h2 className="text-2xl font-bold">Some items are no longer available</h2>
        <p className="text-[15px] text-muted-foreground">
          Remove {unavailable.map((item) => item.name).join(', ')} from your cart to continue.
        </p>
        <Link href="/cart" className={buttonVariants({ variant: 'outline' })}>
          Back to cart
        </Link>
      </Card>
    );
  }

  const totals = checkoutTotals(cart.data.subtotalCents, selection.type, deliveryFee.data?.feeCents ?? 0);

  function handleChange(next: FulfillmentSelection) {
    setSelection(next);
    // Clear the error once the problem is fixed.
    if (error && !selectionError(next)) setError(undefined);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = selectionError(selection);
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    setSubmitting(true);
    try {
      const placed = await placeOrder(
        {
          fulfillmentType: selection.type!,
          pickupLocationId: selection.type === 'PICKUP' ? selection.pickupLocationId! : undefined,
        },
        idempotencyKey.current!,
      );
      await router.push(`/orders/confirmation?orderId=${encodeURIComponent(placed.orderId)}`);
      // The order emptied the cart on the server; update the header and cart page.
      await mutate(CART_KEY);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not place your order. Please try again.';
      toast.error(message);
      if (err instanceof ApiError && err.code && CART_CHANGED.has(err.code)) {
        await mutate(CART_KEY);
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-7 lg:grid-cols-[1fr_24rem]">
      <Card className="h-fit p-7">
        <FulfillmentSelector
          selection={selection}
          onChange={handleChange}
          deliveryAddress={profile.data.deliveryAddress}
          deliveryFeeCents={deliveryFee.data?.feeCents}
          pickupLocations={pickupLocations.data ?? (pickupLocations.error ? [] : undefined)}
          regionName={region ? regionName(region) : 'your region'}
          error={error}
        />
      </Card>

      <div className="h-fit space-y-5 rounded-[32px] bg-primary p-7 text-primary-foreground">
        <CheckoutSummary cart={cart.data} fulfillment={selection.type} totals={totals} />
        <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
        <Link href="/cart" className="flex min-h-11 items-center justify-center text-sm font-semibold underline-offset-4 hover:underline">
          Back to cart
        </Link>
      </div>
    </form>
  );
}
