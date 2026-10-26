import { useEffect, useState } from 'react';
import type { Category, Farmer } from '@cheap-market/shared-types';

import { ProductCardPreview } from '@/components/catalog/ProductCard';
import { cedisToPesewas, today, type ListingFormValues } from '@/lib/validation/listing';

const PRICE = /^\d{1,7}(\.\d{1,2})?$/;

interface ListingPreviewProps {
  values: ListingFormValues;
  farmers: Farmer[];
  categories: Category[];
}

/** The catalog card buyers will see, updated as the listing form is filled in. */
export function ListingPreview({ values, farmers, categories }: ListingPreviewProps) {
  const mainPhoto = values.images[0];
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!mainPhoto) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(mainPhoto);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mainPhoto]);

  const price = values.price.trim();

  return (
    <aside aria-labelledby="preview-heading" className="space-y-3">
      <h2 id="preview-heading" className="font-sans text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
        How buyers will see it
      </h2>
      <ProductCardPreview
        product={{
          id: 'preview',
          name: values.name.trim() || 'Produce name',
          priceCents: PRICE.test(price) ? cedisToPesewas(price) : 0,
          unit: values.unit || 'per unit',
          primaryImageUrl: photoUrl,
          harvestDate: values.harvestDate || today(),
          farmerName: farmers.find((farmer) => farmer.id === values.farmerId)?.fullName ?? 'Farmer',
          categoryName: categories.find((category) => category.id === values.categoryId)?.name ?? 'Category',
        }}
      />
      <p className="text-sm text-muted-foreground">Updates as you fill in the form.</p>
    </aside>
  );
}
