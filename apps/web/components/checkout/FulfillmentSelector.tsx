import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Address, FulfillmentType, PickupLocation } from '@cheap-market/shared-types';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { FulfillmentSelection } from '@/lib/checkout';
import { formatCedis } from '@/lib/format';
import { cn } from '@/lib/utils';

interface FulfillmentSelectorProps {
  selection: FulfillmentSelection;
  onChange: (selection: FulfillmentSelection) => void;
  deliveryAddress: Address | null;
  deliveryFeeCents: number | undefined;
  /** Undefined while loading. */
  pickupLocations: PickupLocation[] | undefined;
  regionName: string;
  /** Shown under the group when the buyer tries to continue without a valid choice. */
  error?: string;
}

function formatAddress(address: Address) {
  return [address.street, address.town, address.gpsAddress].filter(Boolean).join(', ');
}

interface OptionProps {
  value: FulfillmentType;
  title: string;
  badge: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  children: ReactNode;
}

function Option({ value, title, badge, checked, disabled, onSelect, children }: OptionProps) {
  const id = `fulfillment-${value.toLowerCase()}`;
  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-4',
        checked && 'border-primary ring-1 ring-primary',
        disabled && 'bg-muted',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="radio"
          name="fulfillment"
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onSelect}
          aria-describedby={`${id}-details`}
          className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className={cn('flex justify-between gap-2 font-medium', !disabled && 'cursor-pointer')}>
            <span>{title}</span>
            <span className="text-sm text-muted-foreground">{badge}</span>
          </label>
          <div id={`${id}-details`} className="mt-1 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FulfillmentSelector({
  selection,
  onChange,
  deliveryAddress,
  deliveryFeeCents,
  pickupLocations,
  regionName,
  error,
}: FulfillmentSelectorProps) {
  const noPickupLocations = pickupLocations !== undefined && pickupLocations.length === 0;
  const chosenLocation = pickupLocations?.find((location) => location.id === selection.pickupLocationId);

  return (
    <fieldset aria-describedby={error ? 'fulfillment-error' : undefined} className="space-y-3">
      <legend className="mb-3 text-lg font-semibold">How would you like to get your order?</legend>

      <Option
        value="DELIVERY"
        title="Home delivery"
        badge={deliveryFeeCents === undefined ? '…' : formatCedis(deliveryFeeCents)}
        checked={selection.type === 'DELIVERY'}
        disabled={!deliveryAddress}
        onSelect={() => onChange({ type: 'DELIVERY', pickupLocationId: null })}
      >
        {deliveryAddress ? (
          <>
            <p>
              Delivered to <span className="text-foreground">{formatAddress(deliveryAddress)}</span>
            </p>
            <Link href="/buyer/profile" className="font-medium text-primary hover:underline">
              Change address
            </Link>
          </>
        ) : (
          <p>
            Add a delivery address to your{' '}
            <Link href="/buyer/profile" className="font-medium text-primary hover:underline">
              profile
            </Link>{' '}
            to choose home delivery.
          </p>
        )}
      </Option>

      <Option
        value="PICKUP"
        title="Collect from a pickup point"
        badge="Free"
        checked={selection.type === 'PICKUP'}
        disabled={noPickupLocations || pickupLocations === undefined}
        onSelect={() => onChange({ type: 'PICKUP', pickupLocationId: selection.pickupLocationId })}
      >
        {pickupLocations === undefined && <p>Loading pickup points…</p>}
        {noPickupLocations && (
          <p role="status">There are no pickup points in {regionName} yet. Choose home delivery instead.</p>
        )}
        {pickupLocations && pickupLocations.length > 0 && selection.type !== 'PICKUP' && (
          <p>
            {pickupLocations.length} pickup {pickupLocations.length === 1 ? 'point' : 'points'} in {regionName}.
          </p>
        )}
        {pickupLocations && pickupLocations.length > 0 && selection.type === 'PICKUP' && (
          <div className="mt-2 space-y-2">
            <Label htmlFor="pickup-location" className="text-foreground">
              Pickup point
            </Label>
            <Select
              id="pickup-location"
              value={selection.pickupLocationId ?? ''}
              onChange={(event) => onChange({ type: 'PICKUP', pickupLocationId: event.target.value || null })}
              aria-invalid={Boolean(error) && !selection.pickupLocationId}
            >
              <option value="" disabled>
                Select a pickup point
              </option>
              {pickupLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
            {chosenLocation && (
              <p>
                {formatAddress(chosenLocation.address)}
                {chosenLocation.operatingHours && <> · Open {chosenLocation.operatingHours}</>}
              </p>
            )}
          </div>
        )}
      </Option>

      {error && (
        <p id="fulfillment-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
