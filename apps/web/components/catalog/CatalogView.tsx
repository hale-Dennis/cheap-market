import { useEffect, useState, type FormEvent } from 'react';
import { regionName, type RegionCode } from '@cheap-market/shared-types';

import { ProductCard } from '@/components/catalog/ProductCard';
import { RegionPicker } from '@/components/catalog/RegionPicker';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogProducts, usePublicCategories } from '@/hooks/useCatalog';
import { ApiError } from '@/services/apiClient';
import { CATALOG_SORTS, type CatalogSort } from '@/lib/catalog';

export interface CatalogFilters {
  categoryId?: string;
  search?: string;
  /** Cedis, as typed, e.g. "15.50". */
  minPrice?: string;
  maxPrice?: string;
  sort?: CatalogSort;
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
    search: filters.search,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: filters.page,
  });
  const categoryName = categories.data?.find((c) => c.id === filters.categoryId)?.name;
  const narrowed = Boolean(filters.search || filters.minPrice || filters.maxPrice);

  // A page past the end (e.g. after listings sold out) falls back to the last page.
  const outOfRange = data !== undefined && data.totalPages > 0 && filters.page >= data.totalPages;
  useEffect(() => {
    if (outOfRange) onFiltersChange({ ...filters, page: data.totalPages - 1 });
  }, [outOfRange, data, filters, onFiltersChange]);

  /** Any change of filter starts again from the first page. */
  function change(next: Partial<CatalogFilters>) {
    onFiltersChange({ ...filters, ...next, page: 0 });
  }

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
        <SearchBox key={filters.search ?? ''} initial={filters.search} onSearch={(search) => change({ search })} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="space-y-6 rounded-[28px] border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="category-filter">Category</Label>
            <Select
              id="category-filter"
              value={filters.categoryId ?? ''}
              onChange={(event) => change({ categoryId: event.target.value || undefined })}
            >
              <option value="">All categories</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <PriceFilter
            key={`${filters.minPrice ?? ''}-${filters.maxPrice ?? ''}`}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onApply={(minPrice, maxPrice) => change({ minPrice, maxPrice })}
          />
          {(narrowed || filters.categoryId) && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => onFiltersChange({ sort: filters.sort, page: 0 })}>
              Clear filters
            </Button>
          )}
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-muted-foreground" aria-live="polite">
              {data && !outOfRange && (
                <>
                  <span className="font-bold text-foreground">{data.totalElements}</span>{' '}
                  {data.totalElements === 1 ? 'listing' : 'listings'}
                  {filters.search && <> matching “{filters.search}”</>}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="font-semibold text-muted-foreground">
                Sort by
              </Label>
              <Select
                id="sort"
                className="w-auto rounded-full bg-card font-semibold"
                value={filters.sort ?? 'newest'}
                onChange={(event) => change({ sort: event.target.value as CatalogSort })}
              >
                {CATALOG_SORTS.map((sort) => (
                  <option key={sort} value={sort}>
                    {SORT_LABELS[sort]}
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
              {narrowed ? (
                <>
                  <h2 className="text-2xl font-extrabold">No produce matches your filters</h2>
                  <p className="max-w-sm text-[15px] text-muted-foreground">
                    Try a different search or price range in {regionName(region)}.
                  </p>
                  <Button onClick={() => onFiltersChange({ categoryId: filters.categoryId, sort: filters.sort, page: 0 })}>
                    Clear search and price
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold">
                    {categoryName ? `No ${categoryName} in ${regionName(region)} right now` : `No produce in ${regionName(region)} yet`}
                  </h2>
                  <p className="max-w-sm text-[15px] text-muted-foreground">
                    Farmers add new harvests regularly, so check back soon
                    {categoryName ? ' or browse every category' : ' or look in a nearby region'}.
                  </p>
                  {categoryName ? (
                    <Button onClick={() => change({ categoryId: undefined })}>Show all categories</Button>
                  ) : (
                    <Button onClick={() => setChangingRegion(true)}>Change region</Button>
                  )}
                </>
              )}
            </Card>
          )}
          {data && !outOfRange && data.totalElements > 0 && (
            <section aria-label="Produce" aria-busy={isValidating}>
              <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 xl:grid-cols-3">
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
      </div>
    </div>
  );
}

const SORT_LABELS: Record<CatalogSort, string> = {
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  top_rated: 'Top rated farmers',
};

function SearchBox({ initial, onSearch }: { initial?: string; onSearch: (search: string | undefined) => void }) {
  const [value, setValue] = useState(initial ?? '');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(value.trim() || undefined);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2 sm:max-w-md">
      <Label htmlFor="catalog-search" className="sr-only">
        Search produce or farmers
      </Label>
      <Input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search produce or farmers"
        maxLength={100}
        className="rounded-full"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}

const PRICE = /^\d{1,7}(\.\d{1,2})?$/;

interface PriceFilterProps {
  minPrice?: string;
  maxPrice?: string;
  onApply: (minPrice: string | undefined, maxPrice: string | undefined) => void;
}

/** Min/max price in cedis, applied together so the list doesn't reload on every keystroke. */
function PriceFilter({ minPrice, maxPrice, onApply }: PriceFilterProps) {
  const [min, setMin] = useState(minPrice ?? '');
  const [max, setMax] = useState(maxPrice ?? '');
  const [error, setError] = useState<string>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const low = min.trim();
    const high = max.trim();
    if ((low && !PRICE.test(low)) || (high && !PRICE.test(high))) {
      setError('Enter prices like 15 or 15.50.');
      return;
    }
    if (low && high && Number(low) > Number(high)) {
      setError('The minimum price can’t be more than the maximum.');
      return;
    }
    setError(undefined);
    onApply(low || undefined, high || undefined);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset className="space-y-3" aria-describedby={error ? 'price-error' : undefined}>
        <legend className="mb-3 text-[15px] font-bold">Price (GH₵)</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price-min" className="text-sm font-semibold text-muted-foreground">
              Min
            </Label>
            <Input id="price-min" inputMode="decimal" placeholder="0" value={min} onChange={(event) => setMin(event.target.value)} aria-invalid={Boolean(error)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price-max" className="text-sm font-semibold text-muted-foreground">
              Max
            </Label>
            <Input id="price-max" inputMode="decimal" placeholder="Any" value={max} onChange={(event) => setMax(event.target.value)} aria-invalid={Boolean(error)} />
          </div>
        </div>
        {error && (
          <p id="price-error" role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Apply price
        </Button>
      </fieldset>
    </form>
  );
}
