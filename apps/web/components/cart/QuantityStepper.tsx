import { useEffect, useState, type KeyboardEvent } from 'react';
import { MAX_CART_QUANTITY } from '@cheap-market/shared-types';

interface QuantityStepperProps {
  /** Used in accessible labels, e.g. "Increase quantity of Okro". */
  itemName: string;
  value: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
}

/** − / number / + control for 1–99; typed values are applied on Enter or when leaving the field. */
export function QuantityStepper({ itemName, value, onChange, disabled }: QuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  function commit() {
    const parsed = Number(draft);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_CART_QUANTITY) {
      if (parsed !== value) onChange(parsed);
    } else {
      setDraft(String(value)); // invalid: put the previous quantity back
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
  }

  const button =
    'flex h-11 w-11 items-center justify-center rounded-full bg-card text-xl font-bold text-primary hover:bg-border disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-muted p-1">
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label={`Decrease quantity of ${itemName}`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_CART_QUANTITY}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={`Quantity of ${itemName}`}
        className="h-11 w-14 bg-transparent text-center text-base font-bold [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= MAX_CART_QUANTITY}
        aria-label={`Increase quantity of ${itemName}`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
