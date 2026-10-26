import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CartItem } from '@cheap-market/shared-types';

import { PLACEHOLDER_IMAGE } from '@/components/catalog/ProductCard';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart, useCartActions } from '@/hooks/useCart';
import { formatCedis } from '@/lib/format';
import { sizedImageUrl } from '@/lib/image';
import { ApiError } from '@/services/apiClient';

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

function EmptyCart() {
  return (
    <Card className="flex flex-col items-center gap-4 border-dashed px-6 py-14 text-center">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-16 w-16 text-muted-foreground">
        <path
          d="M10 22h44l-5 30H15L10 22zm12 0c0-6 4-12 10-12s10 6 10 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2 className="text-[28px] font-extrabold">Your cart is empty</h2>
      <p className="max-w-sm text-[15px] text-muted-foreground">
        Fresh produce from farmers near you is waiting. Add a few items and they&apos;ll appear here.
      </p>
      <Link href="/products" className={buttonVariants()}>
        Browse produce
      </Link>
    </Card>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const actions = useCartActions();

  async function run(action: () => Promise<unknown>, success?: string) {
    try {
      await action();
      if (success) toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <li className="flex gap-4 rounded-[28px] border bg-card p-3.5 sm:gap-5">
      {/* Mouse shortcut only: the product name below is the accessible link to the same page. */}
      <Link href={`/products/${item.productId}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary sizing via sizedImageUrl */}
        <img
          src={item.primaryImageUrl ? sizedImageUrl(item.primaryImageUrl, 192) : PLACEHOLDER_IMAGE}
          alt=""
          loading="lazy"
          className="h-20 w-20 rounded-[20px] bg-muted object-cover sm:h-28 sm:w-28"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 py-1 pr-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href={`/products/${item.productId}`} className="text-lg font-bold hover:underline">
            {item.name}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatCedis(item.priceCents)} {item.unit} · {item.farmerName}
          </p>
          {!item.available && (
            <p className="mt-1 text-sm font-medium text-destructive">
              No longer available. Remove it to continue.
            </p>
          )}
        </div>
        {/* Wraps on narrow phones so the stepper, total and Remove never overflow the card. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:flex-nowrap sm:items-end">
          <QuantityStepper
            itemName={item.name}
            value={item.quantity}
            disabled={!item.available}
            onChange={(quantity) => run(() => actions.updateQuantity(item.productId, quantity))}
          />
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
            <p className={item.available ? 'whitespace-nowrap font-display text-xl font-bold' : 'whitespace-nowrap font-display text-xl font-bold text-muted-foreground line-through'}>
              {formatCedis(item.lineTotalCents)}
            </p>
            <button
              type="button"
              className="min-h-11 text-sm font-semibold text-destructive hover:underline"
              onClick={() => run(() => actions.removeItem(item.productId), `${item.name} removed from your cart.`)}
              aria-label={`Remove ${item.name}`}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function CartView() {
  const { data: cart, error } = useCart(true);
  const actions = useCartActions();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (error && !cart) {
    return (
      <Card className="p-6">
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      </Card>
    );
  }
  if (!cart) {
    return <p className="text-sm text-muted-foreground">Loading your cart…</p>;
  }
  if (cart.items.length === 0) {
    return <EmptyCart />;
  }

  const unavailable = cart.items.filter((item) => !item.available).length;
  // Count only what the subtotal charges for.
  const chargedQuantity = cart.items.filter((item) => item.available).reduce((sum, item) => sum + item.quantity, 0);

  async function handleClear() {
    setConfirmingClear(false);
    try {
      await actions.clearCart();
      toast.success('Your cart has been emptied.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_24rem]">
      <div className="h-fit">
        <ul className="space-y-4" aria-label="Items in your cart">
          {cart.items.map((item) => (
            <CartRow key={item.productId} item={item} />
          ))}
        </ul>
      </div>

      <section aria-labelledby="cart-summary-heading" className="h-fit space-y-5 rounded-[32px] bg-primary p-7 text-primary-foreground">
        <h2 id="cart-summary-heading" className="text-[26px] font-bold">Order summary</h2>
        <dl className="space-y-3 text-base">
          <div className="flex justify-between">
            <dt className="text-primary-foreground/80">Items ({chargedQuantity})</dt>
            <dd className="font-semibold">{formatCedis(cart.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-primary-foreground/80">
            <dt>Delivery</dt>
            <dd>Chosen at checkout</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-4">
            <dt className="font-semibold">Subtotal</dt>
            <dd aria-live="polite" className="font-display text-4xl font-extrabold tracking-tight text-accent">
              {formatCedis(cart.subtotalCents)}
            </dd>
          </div>
        </dl>
        {unavailable > 0 && (
          <p id="unavailable-note" className="rounded-2xl bg-status-disputed px-4 py-3 text-sm font-semibold text-status-disputed-foreground">
            {unavailable === 1 ? '1 item is' : `${unavailable} items are`} no longer available and not
            included in the subtotal. Remove {unavailable === 1 ? 'it' : 'them'} to check out.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {unavailable > 0 ? (
            <Button variant="accent" size="lg" disabled aria-describedby="unavailable-note">
              Proceed to checkout
            </Button>
          ) : (
            <Link href="/checkout" className={buttonVariants({ variant: 'accent', size: 'lg' })}>
              Proceed to checkout
            </Link>
          )}
          <Link
            href="/products"
            className={buttonVariants({ variant: 'outline', className: 'border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10' })}
          >
            Continue shopping
          </Link>
          <Button
            variant="ghost"
            className="text-primary-foreground underline underline-offset-4 hover:bg-primary-foreground/10"
            onClick={() => setConfirmingClear(true)}
          >
            Empty cart
          </Button>
        </div>
      </section>

      <AlertDialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} from your cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep items</AlertDialogCancel>
            <Button variant="destructive" onClick={handleClear}>
              Empty cart
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
