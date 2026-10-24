import { z } from 'zod';
import { isRegionCode } from '@cheap-market/shared-types';

import { normalizeGhanaianPhone } from '@/lib/phone';

/** Client-side rules for the Create Farmer form; mirrors CreateFarmerRequest.java. */
export const createFarmerSchema = z.object({
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
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine(
      (value) => normalizeGhanaianPhone(value) !== null,
      'Enter a valid Ghanaian phone number, e.g. 024 123 4567.',
    ),
  // Explicit boolean return: an inferred type predicate would narrow the output type, which zodResolver can't express.
  region: z.string().refine((value): boolean => isRegionCode(value), 'Select a region.'),
});

export type CreateFarmerFormValues = z.infer<typeof createFarmerSchema>;
