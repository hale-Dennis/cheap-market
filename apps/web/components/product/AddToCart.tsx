import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { UserRole } from '@cheap-market/shared-types';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart, useCartActions } from '@/hooks/useCart';
import { ApiError } from '@/services/apiClient';

const MAX_QUANTITY = 99;

interface AddToCartProps {
  productId: string;
  productName: string;
  unit: string;
  /** Who is viewing: only buyers can buy; visitors are invited to sign in. */
  viewerRole: UserRole | null;
}

export function AddToCart({ productId, productName, unit, viewerRole }: AddToCartProps) {
  const isBuyer = viewerRole === 'BUYER';
  const { data: cart } = useCart(isBuyer);
  const actions = useCartActions();
  const [quantity, setQuantity] = useState('1');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string>();

  if (viewerRole === null) {
    const next = encodeURIComponent(`/products/${productId}`);
    return (
      <div className="space-y-2">
        <Link href={`/login?next=${next}`} className={buttonVariants({ size: 'default', className: 'w-full text-base' })}>
          Sign in to add to cart
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href={`/signup?next=${next}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  if (viewerRole !== 'BUYER') {
    return (
      <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
        Only buyer accounts can add produce to a cart.
      </p>
    );
  }

  const parsed = Number(quantity);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_QUANTITY;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid) {
      setError(`Choose a quantity from 1 to ${MAX_QUANTITY}.`);
      return;
    }
    setAdding(true);
    setError(undefined);
    try {
      const inCart = await actions.addItem(productId, parsed, cart);
      toast.success(
        inCart === parsed
          ? `Added ${parsed} × ${productName} (${unit}) to your cart.`
          : `Added ${parsed} more. You now have ${inCart} × ${productName} in your cart.`,
        { action: { label: 'View cart', onClick: () => window.location.assign('/cart') } },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add to your cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="w-24 space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            aria-invalid={Boolean(error) && !valid}
            aria-describedby={error ? 'add-to-cart-error' : undefined}
          />
        </div>
        <Button type="submit" className="h-10 flex-1 text-base" disabled={adding}>
          {adding ? 'Adding…' : 'Add to cart'}
        </Button>
      </div>
      {error && (
        <p id="add-to-cart-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
