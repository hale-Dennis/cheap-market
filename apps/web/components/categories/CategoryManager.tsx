import { useState } from 'react';
import { toast } from 'sonner';
import type { Category } from '@cheap-market/shared-types';

import { CategoriesTable } from '@/components/categories/CategoriesTable';
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog';
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { ApiError } from '@/services/apiClient';

type FormState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; category: Category };

/** Lists categories and wires up the add, rename and delete dialogs. */
export function CategoryManager() {
  const { data: categories, error, mutate } = useCategories();
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [toDelete, setToDelete] = useState<Category | null>(null);

  function openAdd() {
    setForm({ mode: 'add' });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-muted-foreground">Group produce so buyers can browse it.</p>
        </div>
        <Button onClick={openAdd}>Add category</Button>
      </div>

      {error && !categories && (
        <Card className="p-6">
          <p role="alert" className="text-sm text-destructive">
            {error instanceof ApiError ? error.message : 'Could not load categories.'}
          </p>
        </Card>
      )}
      {!error && !categories && (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Loading categories…</p>
        </Card>
      )}
      {categories?.length === 0 && (
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No categories yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add categories such as Vegetables, Fruits and Grains before listing produce.
          </p>
          <Button onClick={openAdd}>Add category</Button>
        </Card>
      )}
      {categories && categories.length > 0 && (
        <Card className="overflow-hidden">
          <CategoriesTable
            categories={categories}
            onEdit={(category) => setForm({ mode: 'edit', category })}
            onDelete={setToDelete}
          />
        </Card>
      )}

      <CategoryFormDialog
        open={form.mode !== 'closed'}
        onOpenChange={(open) => !open && setForm({ mode: 'closed' })}
        category={form.mode === 'edit' ? form.category : undefined}
        onSaved={(saved) => {
          toast.success(
            form.mode === 'edit'
              ? `Category renamed to "${saved.name}".`
              : `Category "${saved.name}" added.`,
          );
          mutate();
        }}
      />
      <DeleteCategoryDialog
        category={toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        onDeleted={(deleted) => {
          toast.success(`Category "${deleted.name}" deleted.`);
          mutate();
        }}
      />
    </>
  );
}
