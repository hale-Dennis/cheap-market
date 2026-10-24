import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  PRODUCE_UNITS,
  regionName,
  type AdminProduct,
  type Category,
  type Farmer,
} from '@cheap-market/shared-types';

import { ImagePicker } from '@/components/listings/ImagePicker';
import { Button } from '@/components/ui/button';
import { Field, FormError, describedBy } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  MAX_IMAGES,
  cedisToPesewas,
  listingSchema,
  oneYearAgo,
  today,
  type ListingFormValues,
} from '@/lib/validation/listing';
import { ApiError } from '@/services/apiClient';
import { createProduct, uploadListingImages } from '@/services/productService';

const EMPTY: ListingFormValues = {
  farmerId: '',
  categoryId: '',
  name: '',
  description: '',
  price: '',
  unit: '',
  harvestDate: '',
  images: [],
};

interface ListingFormProps {
  farmers: Farmer[];
  categories: Category[];
  onCreated: (listing: AdminProduct, farmer: Farmer) => void;
}

/** Creates a produce listing for a farmer: uploads the photos, then saves the listing. */
export function ListingForm({ farmers, categories, onCreated }: ListingFormProps) {
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    // Validate on submit, then live as fields are corrected. (Validating on blur shows errors
    // mid-click, which shifts the submit button so the click can miss it.)
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: EMPTY,
  });

  async function onSubmit(values: ListingFormValues) {
    try {
      setStage('uploading');
      const imageUrls = await uploadListingImages(values.farmerId, values.images);
      setStage('saving');
      const listing = await createProduct({
        farmerId: values.farmerId,
        categoryId: values.categoryId,
        name: values.name,
        description: values.description || undefined,
        priceCents: cedisToPesewas(values.price),
        unit: values.unit,
        harvestDate: values.harvestDate,
        imageUrls,
      });
      const farmer = farmers.find((f) => f.id === values.farmerId)!;
      // Keep the farmer selected: admins often list several items for the same farmer.
      reset({ ...EMPTY, farmerId: getValues('farmerId') });
      setRejectedFiles([]);
      onCreated(listing, farmer);
    } catch (error) {
      setError('root', {
        message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setStage('idle');
    }
  }

  const submitting = stage !== 'idle';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <FormError message={errors.root?.message} />

      <section aria-labelledby="who-heading" className="space-y-4">
        <h2 id="who-heading" className="text-lg font-semibold">
          Farmer and category
        </h2>
        <Field id="farmerId" label="Farmer" error={errors.farmerId?.message}>
          <Select
            id="farmerId"
            aria-invalid={Boolean(errors.farmerId)}
            aria-describedby={describedBy('farmerId', errors.farmerId)}
            {...register('farmerId')}
          >
            <option value="" disabled>
              Select a farmer
            </option>
            {farmers.map((farmer) => (
              <option key={farmer.id} value={farmer.id}>
                {farmer.fullName} — {regionName(farmer.region)}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="categoryId" label="Category" error={errors.categoryId?.message}>
          <Select
            id="categoryId"
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={describedBy('categoryId', errors.categoryId)}
            {...register('categoryId')}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section aria-labelledby="produce-heading" className="space-y-4">
        <h2 id="produce-heading" className="text-lg font-semibold">
          Produce
        </h2>
        <Field id="name" label="Produce name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="off"
            placeholder="e.g. Organic Tomatoes"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name', errors.name)}
            {...register('name')}
          />
        </Field>
        <Field
          id="description"
          label="Description (optional)"
          hint="A short note for buyers, e.g. how it was grown."
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[invalid=true]:border-destructive"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy('description', errors.description, true)}
            {...register('description')}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="price" label="Price (GH₵)" error={errors.price?.message}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
              >
                GH₵
              </span>
              <Input
                id="price"
                inputMode="decimal"
                autoComplete="off"
                placeholder="15.00"
                className="pl-12"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={describedBy('price', errors.price)}
                {...register('price')}
              />
            </div>
          </Field>
          <Field id="unit" label="Unit" error={errors.unit?.message}>
            <Select
              id="unit"
              aria-invalid={Boolean(errors.unit)}
              aria-describedby={describedBy('unit', errors.unit)}
              {...register('unit')}
            >
              <option value="" disabled>
                Select a unit
              </option>
              {PRODUCE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field id="harvestDate" label="Harvest date" error={errors.harvestDate?.message}>
          <Input
            id="harvestDate"
            type="date"
            min={oneYearAgo()}
            max={today()}
            className="sm:max-w-xs"
            aria-invalid={Boolean(errors.harvestDate)}
            aria-describedby={describedBy('harvestDate', errors.harvestDate)}
            {...register('harvestDate')}
          />
        </Field>
      </section>

      <section aria-labelledby="photos-heading" className="space-y-3">
        <h2 id="photos-heading" className="text-lg font-semibold">
          Photos
        </h2>
        <p id="images-hint" className="text-sm text-muted-foreground">
          1 to {MAX_IMAGES} photos, JPEG or PNG, up to 2 MB each. The first photo is shown in the
          catalog.
        </p>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImagePicker
              id="images"
              files={field.value}
              onChange={(files) => {
                field.onChange(files);
                field.onBlur();
              }}
              onReject={setRejectedFiles}
              describedBy={errors.images ? 'images-error images-hint' : 'images-hint'}
              invalid={Boolean(errors.images)}
            />
          )}
        />
        {(errors.images?.message || rejectedFiles.length > 0) && (
          <ul id="images-error" className="space-y-1 text-sm text-destructive">
            {errors.images?.message && <li>{errors.images.message}</li>}
            {rejectedFiles.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {stage === 'uploading'
            ? 'Uploading photos…'
            : stage === 'saving'
              ? 'Saving listing…'
              : 'Create listing'}
        </Button>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
