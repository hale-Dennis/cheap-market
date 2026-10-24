import { useState, type FormEvent } from 'react';
import { REGIONS, type RegionCode } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { parseRegion } from '@/lib/region';

interface RegionPickerProps {
  initialRegion?: RegionCode | null;
  submitLabel: string;
  onSelect: (region: RegionCode) => void;
  onCancel?: () => void;
}

export function RegionPicker({ initialRegion, submitLabel, onSelect, onCancel }: RegionPickerProps) {
  const [value, setValue] = useState<string>(initialRegion ?? '');
  const region = parseRegion(value);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (region) onSelect(region);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="region-picker">Your region</Label>
        <Select id="region-picker" value={value} onChange={(event) => setValue(event.target.value)}>
          <option value="" disabled>
            Select your region
          </option>
          {REGIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!region}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
