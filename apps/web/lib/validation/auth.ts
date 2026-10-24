import { z } from 'zod';
import { isRegionCode } from '@cheap-market/shared-types';

/** Client-side rules for the sign-up form; mirrors RegisterRequest.java. */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .max(255, 'Full name must be at most 255 characters.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must be at most 72 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    // Explicit boolean return: an inferred type predicate would narrow the output type, which zodResolver can't express.
    region: z.string().refine((value): boolean => isRegionCode(value), 'Select your region.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
