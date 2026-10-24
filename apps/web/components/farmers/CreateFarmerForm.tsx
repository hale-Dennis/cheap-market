import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGIONS, type Farmer, type RegionCode } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FormError, describedBy } from '@/components/ui/form-field';
import { Select } from '@/components/ui/select';
import {
  createFarmerSchema,
  type CreateFarmerFormValues,
} from '@/lib/validation/farmer';
import { ApiError } from '@/services/apiClient';
import { createFarmer } from '@/services/farmerService';

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
      <FormError message={errors.root?.message} />

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
