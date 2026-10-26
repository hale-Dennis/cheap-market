import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Label + control + hint/error message. Pair the control with `describedBy(id, error, hasHint)`. */
export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** The aria-describedby value for a control rendered inside <Field>. */
export function describedBy(id: string, error: unknown, hasHint = false) {
  if (error) return `${id}-error`;
  return hasHint ? `${id}-hint` : undefined;
}

/** Form-level error banner (e.g. a message from the API). */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl bg-status-disputed px-4 py-3 text-[15px] font-semibold text-status-disputed-foreground"
    >
      {message}
    </div>
  );
}
