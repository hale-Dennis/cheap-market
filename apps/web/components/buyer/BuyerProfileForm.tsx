import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGIONS, type BuyerProfile } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import { Field, FormError, describedBy } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  buyerProfileSchema,
  formValuesToRequest,
  profileToFormValues,
  type BuyerProfileFormValues,
} from '@/lib/validation/buyer';
import { ApiError } from '@/services/apiClient';
import { updateBuyerProfile } from '@/services/buyerService';

interface BuyerProfileFormProps {
  profile: BuyerProfile;
  onSaved: (profile: BuyerProfile) => void;
}

export function BuyerProfileForm({ profile, onSaved }: BuyerProfileFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BuyerProfileFormValues>({
    resolver: zodResolver(buyerProfileSchema),
    // Validate on submit, then live as fields are corrected. (Validating on blur shows errors
    // mid-click, which shifts the submit button so the click can miss it.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: profileToFormValues(profile),
  });

  async function onSubmit(values: BuyerProfileFormValues) {
    try {
      const saved = await updateBuyerProfile(formValuesToRequest(values));
      reset(profileToFormValues(saved));
      onSaved(saved);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <FormError message={errors.root?.message} />

      <section aria-labelledby="details-heading" className="space-y-4">
        <h2 id="details-heading" className="text-2xl font-bold">
          Your details
        </h2>
        <div className="space-y-2">
          <p className="text-[15px] font-bold leading-none">Email</p>
          <p className="text-[15px] text-muted-foreground">{profile.email}</p>
        </div>
        <Field id="fullName" label="Full name" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy('fullName', errors.fullName)}
            {...register('fullName')}
          />
        </Field>
        <Field
          id="region"
          label="Home region"
          hint="You'll see produce from farmers in this region."
          error={errors.region?.message}
        >
          <Select
            id="region"
            aria-invalid={Boolean(errors.region)}
            aria-describedby={describedBy('region', errors.region, true)}
            {...register('region')}
          >
            <option value="" disabled>
              Select your region
            </option>
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <fieldset className="space-y-4">
        <legend className="font-display text-2xl font-bold">Delivery address</legend>
        <p className="text-[15px] text-muted-foreground">
          Used when you choose home delivery at checkout. Leave all fields empty if you&apos;ll
          only use pickup points.
        </p>
        <Field id="street" label="Street address" error={errors.street?.message}>
          <Input
            id="street"
            autoComplete="street-address"
            aria-invalid={Boolean(errors.street)}
            aria-describedby={describedBy('street', errors.street)}
            {...register('street')}
          />
        </Field>
        <Field id="town" label="Town / city" error={errors.town?.message}>
          <Input
            id="town"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.town)}
            aria-describedby={describedBy('town', errors.town)}
            {...register('town')}
          />
        </Field>
        <Field
          id="gpsAddress"
          label="GPS address (optional)"
          hint="Your Ghana Post digital address, e.g. AK-484-9321."
          error={errors.gpsAddress?.message}
        >
          <Input
            id="gpsAddress"
            autoComplete="off"
            className="uppercase"
            aria-invalid={Boolean(errors.gpsAddress)}
            aria-describedby={describedBy('gpsAddress', errors.gpsAddress, true)}
            {...register('gpsAddress')}
          />
        </Field>
      </fieldset>

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
