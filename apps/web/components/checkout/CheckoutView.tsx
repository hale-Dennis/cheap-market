import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { regionName } from '@cheap-market/shared-types';

import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { FulfillmentSelector } from '@/components/checkout/FulfillmentSelector';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { useCart } from '@/hooks/useCart';
import { useDeliveryFee, usePickupLocations } from '@/hooks/useCheckout';
import { checkoutTotals, selectionError, type FulfillmentSelection } from '@/lib/checkout';
import { parseRegion } from '@/lib/region';
import { ApiError } from '@/services/apiClient';

interface CheckoutViewProps {
  /** Called with a complete, valid selection. */
  onPlaceOrder: (selection: FulfillmentSelection) => Promise<void> | void;
}

export function CheckoutView({ onPlaceOrder }: CheckoutViewProps) {
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
        <h2 className="text-lg font-semibold">Some items are no longer available</h2>
        <p className="text-sm text-muted-foreground">
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
      await onPlaceOrder(selection);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="h-fit p-6">
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

      <Card className="h-fit space-y-4 p-6">
        <CheckoutSummary cart={cart.data} fulfillment={selection.type} totals={totals} />
        <Button type="submit" className="w-full text-base" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
        <Link href="/cart" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to cart
        </Link>
      </Card>
    </form>
  );
}
