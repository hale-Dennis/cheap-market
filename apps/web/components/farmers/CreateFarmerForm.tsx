import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { REGIONS, type Farmer, type RegionCode } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  createFarmerSchema,
  type CreateFarmerFormValues,
} from '@/lib/validation/farmer';
import { ApiError } from '@/services/apiClient';
import { createFarmer } from '@/services/farmerService';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
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
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error: unknown, hasHint = false) {
  if (error) return `${id}-error`;
  return hasHint ? `${id}-hint` : undefined;
}

interface CreateFarmerFormProps {
  onCreated: (farmer: Farmer) => void;
}

export function CreateFarmerForm({ onCreated }: CreateFarmerFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFarmerFormValues>({
    resolver: zodResolver(createFarmerSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', phoneNumber: '', region: '' },
  });

  async function onSubmit(values: CreateFarmerFormValues) {
    try {
      // The schema has already checked that region is a valid RegionCode.
      const farmer = await createFarmer({
        ...values,
        region: values.region as RegionCode,
        email: values.email || undefined,
      });
      onCreated(farmer);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {errors.root && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="off"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy('fullName', errors.fullName)}
          {...register('fullName')}
        />
      </Field>

      <Field id="region" label="Home region" error={errors.region?.message}>
        <Select
          id="region"
          aria-invalid={Boolean(errors.region)}
          aria-describedby={describedBy('region', errors.region)}
          {...register('region')}
        >
          <option value="" disabled>
            Select a region
          </option>
          {REGIONS.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        id="phoneNumber"
        label="Phone number"
        hint="Ghanaian number, e.g. 024 123 4567 or +233 24 123 4567."
        error={errors.phoneNumber?.message}
      >
        <Input
          id="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          aria-invalid={Boolean(errors.phoneNumber)}
          aria-describedby={describedBy('phoneNumber', errors.phoneNumber, true)}
          {...register('phoneNumber')}
        />
      </Field>

      <Field id="email" label="Email (optional)" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email', errors.email)}
          {...register('email')}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating farmer…' : 'Create farmer'}
      </Button>
    </form>
  );
}
