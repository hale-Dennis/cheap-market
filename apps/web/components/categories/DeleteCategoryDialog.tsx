import { useEffect, useState } from 'react';
import type { Category } from '@cheap-market/shared-types';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-field';
import { ApiError } from '@/services/apiClient';
import { deleteCategory } from '@/services/categoryService';

interface DeleteCategoryDialogProps {
  /** The category to delete; the dialog is open while this is set. */
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (category: Category) => void;
}

export function DeleteCategoryDialog({ category, onOpenChange, onDeleted }: DeleteCategoryDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setError(undefined);
  }, [category]);

  async function handleDelete() {
    if (!category) return;
    setDeleting(true);
    setError(undefined);
    try {
      await deleteCategory(category.id);
      onDeleted(category);
      onOpenChange(false);
    } catch (err) {
      // Keep the dialog open so the reason (e.g. the category is in use) is visible.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={category !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{category?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the category. Categories used by produce listings can&apos;t
            be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FormError message={error} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
