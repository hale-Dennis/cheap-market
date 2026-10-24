import { z } from 'zod';

export const CATEGORY_NAME_MAX = 50;

/** Client-side rules for category names; mirrors CategoryRequest.java. */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(CATEGORY_NAME_MAX, `Category name must be at most ${CATEGORY_NAME_MAX} characters.`),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
