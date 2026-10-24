import type { Category } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoriesTable({ categories, onEdit, onDelete }: CategoriesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Produce categories ({categories.length})</caption>
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Name</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{category.name}</td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(category)}
                    aria-label={`Rename ${category.name}`}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
