import { useEffect, useState } from 'react';
import { regionName, type RegionCode } from '@cheap-market/shared-types';

import { ProductCard } from '@/components/catalog/ProductCard';
import { RegionPicker } from '@/components/catalog/RegionPicker';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogProducts, usePublicCategories } from '@/hooks/useCatalog';
import { ApiError } from '@/services/apiClient';

export interface CatalogFilters {
  categoryId?: string;
  /** Zero-based. */
  page: number;
}

interface CatalogViewProps {
  region: RegionCode | null;
  filters: CatalogFilters;
  onRegionChange: (region: RegionCode) => void;
  onFiltersChange: (filters: CatalogFilters) => void;
  /** Builds the link for a zero-based page with the current filters. */
  hrefForPage: (page: number) => string;
}

export function CatalogView({ region, filters, onRegionChange, onFiltersChange, hrefForPage }: CatalogViewProps) {
  if (!region) {
    return (
      <Card className="mx-auto max-w-xl p-7">
        <h2 className="text-2xl font-bold">Where are you shopping?</h2>
        <p className="mb-5 mt-1 text-[15px] text-muted-foreground">
          We show produce from farmers in your region so it reaches you fresh.
        </p>
        <RegionPicker submitLabel="Show produce" onSelect={onRegionChange} />
      </Card>
    );
  }
  return (
    <RegionCatalog
      region={region}
      filters={filters}
      onRegionChange={onRegionChange}
      onFiltersChange={onFiltersChange}
      hrefForPage={hrefForPage}
    />
  );
}

function RegionCatalog({
  region,
  filters,
  onRegionChange,
  onFiltersChange,
  hrefForPage,
}: CatalogViewProps & { region: RegionCode }) {
  const [changingRegion, setChangingRegion] = useState(false);
  const categories = usePublicCategories();
  const { data, error, isLoading, isValidating } = useCatalogProducts({
    region,
    categoryId: filters.categoryId,
    page: filters.page,
  });
  const categoryName = categories.data?.find((c) => c.id === filters.categoryId)?.name;

  // A page past the end (e.g. after listings sold out) falls back to the last page.
  const outOfRange = data !== undefined && data.totalPages > 0 && filters.page >= data.totalPages;
  useEffect(() => {
    if (outOfRange) onFiltersChange({ ...filters, page: data.totalPages - 1 });
  }, [outOfRange, data, filters, onFiltersChange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border bg-card p-5 sm:flex-row sm:items-end sm:justify-between">
        {changingRegion ? (
          <div className="flex-1">
            <RegionPicker
              initialRegion={region}
              submitLabel="Update"
              onSelect={(next) => {
                setChangingRegion(false);
                onRegionChange(next);
              }}
              onCancel={() => setChangingRegion(false)}
            />
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            <span>
              Showing produce from farmers in{' '}
              <span className="rounded-full bg-muted px-3 py-1 font-bold">{regionName(region)}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setChangingRegion(true)} className="underline underline-offset-4">
              Change region
            </Button>
          </p>
        )}
        <div className="space-y-2 sm:w-64">
          <Label htmlFor="category-filter">Category</Label>
          <Select
            id="category-filter"
            value={filters.categoryId ?? ''}
            onChange={(event) => onFiltersChange({ categoryId: event.target.value || undefined, page: 0 })}
          >
            <option value="">All categories</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && !data && (
        <Card className="p-6">
          <p role="alert" className="text-[15px] font-semibold text-destructive">
            {error instanceof ApiError ? error.message : 'Could not load produce.'}
          </p>
        </Card>
      )}
      {(isLoading || outOfRange) && !error && (
        <p className="text-[15px] text-muted-foreground">Loading produce…</p>
      )}
      {data && !outOfRange && data.totalElements === 0 && (
        <Card className="flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
          <h2 className="text-2xl font-extrabold">
            {categoryName ? `No ${categoryName} in ${regionName(region)} right now` : `No produce in ${regionName(region)} yet`}
          </h2>
          <p className="max-w-sm text-[15px] text-muted-foreground">
            Farmers add new harvests regularly, so check back soon
            {categoryName ? ' or browse every category' : ' or look in a nearby region'}.
          </p>
          {categoryName ? (
            <Button onClick={() => onFiltersChange({ page: 0 })}>Show all categories</Button>
          ) : (
            <Button onClick={() => setChangingRegion(true)}>Change region</Button>
          )}
        </Card>
      )}
      {data && !outOfRange && data.totalElements > 0 && (
        <section aria-label="Produce" aria-busy={isValidating}>
          <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {data.content.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={data.currentPage}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                pageSize={data.size}
                hrefForPage={hrefForPage}
                itemLabel="listings"
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
