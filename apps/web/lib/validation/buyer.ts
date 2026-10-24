import { z } from 'zod';
import {
  isRegionCode,
  type BuyerProfile,
  type RegionCode,
  type UpdateBuyerProfileRequest,
} from '@cheap-market/shared-types';

const GPS_ADDRESS = /^[A-Za-z]{2}-\d{3,4}-\d{4}$/;

/**
 * Client-side rules for the buyer profile form; mirrors UpdateBuyerProfileRequest.java.
 * The delivery address is optional, but once any part is filled in, street and town are required.
 */
export const buyerProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .max(255, 'Full name must be at most 255 characters.'),
    // Explicit boolean return: an inferred type predicate would narrow the output type, which zodResolver can't express.
    region: z.string().refine((value): boolean => isRegionCode(value), 'Select your region.'),
    street: z.string().trim().max(255, 'Street must be at most 255 characters.'),
    town: z.string().trim().max(100, 'Town must be at most 100 characters.'),
    gpsAddress: z
      .string()
      .trim()
      .refine((value) => value === '' || GPS_ADDRESS.test(value), 'Use the format AK-484-9321.'),
  })
  .superRefine((values, ctx) => {
    const hasAddress = Boolean(values.street || values.town || values.gpsAddress);
    if (hasAddress && !values.street) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['street'], message: 'Street is required for a delivery address.' });
    }
    if (hasAddress && !values.town) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['town'], message: 'Town is required for a delivery address.' });
    }
  });

export type BuyerProfileFormValues = z.infer<typeof buyerProfileSchema>;

export function profileToFormValues(profile: BuyerProfile): BuyerProfileFormValues {
  return {
    fullName: profile.fullName,
    region: isRegionCode(profile.region) ? profile.region : '',
    street: profile.deliveryAddress?.street ?? '',
    town: profile.deliveryAddress?.town ?? '',
    gpsAddress: profile.deliveryAddress?.gpsAddress ?? '',
  };
}

export function formValuesToRequest(values: BuyerProfileFormValues): UpdateBuyerProfileRequest {
  const hasAddress = Boolean(values.street || values.town || values.gpsAddress);
  return {
    fullName: values.fullName,
    // The schema has already checked that region is a valid RegionCode.
    region: values.region as RegionCode,
    deliveryAddress: hasAddress
      ? {
          street: values.street,
          town: values.town,
          gpsAddress: values.gpsAddress ? values.gpsAddress.toUpperCase() : null,
        }
      : null,
  };
}
