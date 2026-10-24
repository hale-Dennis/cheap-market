import { z } from 'zod';
import { PRODUCE_UNITS } from '@cheap-market/shared-types';

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png'];

const PRICE_PATTERN = /^\d{1,7}(\.\d{1,2})?$/;
const MAX_PRICE_CENTS = 100_000_000;

/** Today's date as YYYY-MM-DD in the user's time zone (Ghana is UTC+0). */
export function today(now = new Date()): string {
  return now.toLocaleDateString('en-CA');
}

export function oneYearAgo(now = new Date()): string {
  const date = new Date(now);
  date.setFullYear(date.getFullYear() - 1);
  return today(date);
}

/**
 * Converts a cedi amount typed by the admin ("15", "15.5", "15.50") to pesewas (1550)
 * by string arithmetic, so no floating-point rounding is involved.
 */
export function cedisToPesewas(amount: string): number {
  const [whole, fraction = ''] = amount.trim().split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Why a file can't be attached, or null if it's fine. */
export function imageFileError(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" must be a JPEG or PNG image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is larger than 2 MB.`;
  }
  return null;
}

/** Client-side rules for the Create Listing form; mirrors CreateProductRequest.java. */
export const listingSchema = z.object({
  farmerId: z.string().min(1, 'Select the farmer selling this produce.'),
  categoryId: z.string().min(1, 'Select a category.'),
  name: z
    .string()
    .trim()
    .min(1, 'Produce name is required.')
    .max(100, 'Produce name must be at most 100 characters.'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters.'),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required.')
    .refine((value) => PRICE_PATTERN.test(value), 'Enter a price like 15 or 15.50.')
    .refine(
      (value) => !PRICE_PATTERN.test(value) || cedisToPesewas(value) > 0,
      'Price must be greater than zero.',
    )
    .refine(
      (value) => !PRICE_PATTERN.test(value) || cedisToPesewas(value) <= MAX_PRICE_CENTS,
      'Price must be at most GH₵ 1,000,000.',
    ),
  unit: z
    .string()
    .refine((value) => (PRODUCE_UNITS as readonly string[]).includes(value), 'Select a unit.'),
  harvestDate: z
    .string()
    .min(1, 'Harvest date is required.')
    // ISO dates compare correctly as strings.
    .refine((value) => value <= today(), 'Harvest date cannot be in the future.')
    .refine((value) => value >= oneYearAgo(), 'Harvest date must be within the last year.'),
  images: z
    .array(z.custom<File>((value) => value instanceof File))
    .min(1, 'Add at least one photo.')
    .max(MAX_IMAGES, `Add at most ${MAX_IMAGES} photos.`)
    .superRefine((files, ctx) => {
      for (const file of files) {
        const error = imageFileError(file);
        if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
});

export type ListingFormValues = z.infer<typeof listingSchema>;
