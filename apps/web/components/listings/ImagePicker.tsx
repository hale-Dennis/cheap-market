import { useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { IMAGE_TYPES, MAX_IMAGES, imageFileError } from '@/lib/validation/listing';

interface ImagePickerProps {
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Called with reasons when picked files are rejected (wrong type, too big, too many). */
  onReject: (messages: string[]) => void;
  describedBy?: string;
  invalid?: boolean;
}

/** Multi-image picker with previews. The first photo is the listing's main image. */
export function ImagePicker({ id, files, onChange, onReject, describedBy, invalid }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  function handlePick(picked: FileList | null) {
    if (!picked) return;
    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const file of Array.from(picked)) {
      const error = imageFileError(file);
      if (error) rejected.push(error);
      else accepted.push(file);
    }
    const room = MAX_IMAGES - files.length;
    if (accepted.length > room) {
      rejected.push(`A listing can have at most ${MAX_IMAGES} photos; ${accepted.length - room} not added.`);
    }
    onReject(rejected);
    onChange([...files, ...accepted.slice(0, Math.max(room, 0))]);
    // Allow picking the same file again after removing it.
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      {/* The button below is the accessible control; the native input only opens the file dialog. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => handlePick(event.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        className={invalid ? 'border-destructive' : undefined}
        aria-describedby={describedBy}
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= MAX_IMAGES}
      >
        {files.length === 0 ? 'Add photos' : 'Add more photos'}
      </Button>
      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Selected photos">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
              <img
                src={previews[index]}
                alt={`Preview of ${file.name}`}
                className="aspect-square w-full rounded-[18px] object-cover"
              />
              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="truncate text-muted-foreground">
                  {index === 0 ? <span className="rounded-full bg-primary px-2 py-0.5 font-bold text-accent">Main photo</span> : file.name}
                </span>
                <button
                  type="button"
                  className="min-h-8 shrink-0 font-semibold text-destructive hover:underline"
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
