import type { Category } from '@cheap-market/shared-types';

import { PRODUCE_TINTS, ProduceArt, type ProduceShape } from '@/components/brand/ProduceArt';
import { Button } from '@/components/ui/button';

const SHAPES: ProduceShape[] = ['round', 'oval', 'long', 'round', 'oval', 'long'];

interface CategoryGridProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

/** One card per category, each with Rename and Delete. */
export function CategoryGrid({ categories, onEdit, onDelete }: CategoryGridProps) {
  return (
    <ul aria-label={`Produce categories (${categories.length})`} className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {categories.map((category, index) => (
        <li key={category.id} className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
          <div className="flex items-center gap-3.5">
            <ProduceArt
              shape={SHAPES[index % SHAPES.length]}
              tint={PRODUCE_TINTS[index % PRODUCE_TINTS.length]}
              className="h-14 w-14 shrink-0 rounded-[18px]"
            />
            <h2 className="min-w-0 break-words font-sans text-[19px] font-bold">{category.name}</h2>
          </div>
          <div className="mt-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(category)}
              aria-label={`Rename ${category.name}`}
            >
              Rename
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 bg-muted text-destructive hover:bg-border"
              onClick={() => onDelete(category)}
              aria-label={`Delete ${category.name}`}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
