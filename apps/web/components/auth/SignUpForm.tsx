import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { REGIONS, type RegionCode } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import { Field, FormError, describedBy } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { signUpSchema, type SignUpFormValues } from '@/lib/validation/auth';
import { AuthError, register, type LoginResult } from '@/services/authService';

interface SignUpFormProps {
  onSuccess: (result: LoginResult) => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    // Validate on submit, then live as fields are corrected. (Validating on blur shows errors
    // mid-click, which shifts the submit button so the click can miss it.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', region: '' },
  });

  async function onSubmit({ confirmPassword: _confirm, ...values }: SignUpFormValues) {
    try {
      const result = await register({
        ...values,
        // The schema has already checked that region is a valid RegionCode.
        region: values.region as RegionCode,
      });
      onSuccess(result);
    } catch (error) {
      setError('root', {
        message:
          error instanceof AuthError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={errors.root?.message} />

      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy('fullName', errors.fullName)}
          {...field('fullName')}
        />
      </Field>

      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email', errors.email)}
          {...field('email')}
        />
      </Field>

      <Field id="region" label="Home region" error={errors.region?.message}>
        <Select
          id="region"
          aria-invalid={Boolean(errors.region)}
          aria-describedby={describedBy('region', errors.region)}
          {...field('region')}
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

      <Field
        id="password"
        label="Password"
        hint="At least 8 characters, with an uppercase letter and a number."
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy('password', errors.password, true)}
          {...field('password')}
        />
      </Field>

      <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={describedBy('confirmPassword', errors.confirmPassword)}
          {...field('confirmPassword')}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
