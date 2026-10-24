import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Category } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FormError, describedBy } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  CATEGORY_NAME_MAX,
  categorySchema,
  type CategoryFormValues,
} from '@/lib/validation/category';
import { ApiError } from '@/services/apiClient';
import { createCategory, updateCategory } from '@/services/categoryService';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The category to rename; omit to add a new one. */
  category?: Category;
  onSaved: (category: Category) => void;
}

/** Modal for adding a category or renaming an existing one. */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormDialogProps) {
  const isEdit = category !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '' },
  });

  // Start from a clean form each time the dialog opens.
  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '' });
    }
  }, [open, category, reset]);

  async function onSubmit({ name }: CategoryFormValues) {
    try {
      const saved = isEdit
        ? await updateCategory(category.id, { name })
        : await createCategory({ name });
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      setError('root', {
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Rename category' : 'Add category'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Change the name of "${category.name}". Listings in this category keep it.`
              : 'Categories group produce so buyers can find what they need.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormError message={errors.root?.message} />
          <Field
            id="category-name"
            label="Name"
            hint={`For example "Vegetables" or "Fruits". Up to ${CATEGORY_NAME_MAX} characters.`}
            error={errors.name?.message}
          >
            <Input
              id="category-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy('category-name', errors.name, true)}
              {...register('name')}
            />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save name' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
