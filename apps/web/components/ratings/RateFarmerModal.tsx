import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RATING_COMMENT_MAX, type OrderFarmer } from '@cheap-market/shared-types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ApiError } from '@/services/apiClient';
import { createRating } from '@/services/ratingService';

const SCORE_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface RateFarmerModalProps {
  orderId: string;
  /** The farmer being rated; the dialog is open while this is set. */
  farmer: Pick<OrderFarmer, 'farmerId' | 'fullName'> | null;
  onClose: () => void;
  /** Called once the farmer has a rating for this order (just submitted, or already there), to refresh. */
  onRated: () => void;
}

/** 1–5 stars, as a radio group so it works with the keyboard and screen readers. */
function StarPicker({ value, onChange }: { value: number; onChange: (score: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <fieldset>
      <legend className="text-[15px] font-bold">Your rating</legend>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className="cursor-pointer" onMouseEnter={() => setHovered(score)}>
            <input
              type="radio"
              name="score"
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-3xl leading-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                score <= shown ? 'text-amber-600' : 'text-muted-foreground',
              )}
            >
              {score <= shown ? '★' : '☆'}
            </span>
            <span className="sr-only">
              {score} {score === 1 ? 'star' : 'stars'}
            </span>
          </label>
        ))}
      </div>
      <p aria-live="polite" className="mt-1 h-5 text-sm text-muted-foreground">
        {shown ? `${shown} out of 5 · ${SCORE_WORDS[shown]}` : 'Choose 1 to 5 stars.'}
      </p>
    </fieldset>
  );
}

/** Rate one farmer from a completed order: 1–5 stars and an optional comment. */
export function RateFarmerModal({ orderId, farmer, onClose, onRated }: RateFarmerModalProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Start from a clean form for each farmer.
  useEffect(() => {
    if (farmer) {
      setScore(0);
      setComment('');
      setError(undefined);
    }
  }, [farmer]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!farmer || score === 0) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createRating({ orderId, farmerId: farmer.farmerId, score, comment: comment.trim() || undefined });
      toast.success(`Thanks! You rated ${farmer.fullName} ${score} out of 5.`);
      onRated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_RATED') {
        // Rated in another tab or a double submit: show the existing rating instead.
        toast.error(err.message);
        onRated();
        onClose();
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not submit your rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={farmer !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate {farmer?.fullName}</DialogTitle>
          <DialogDescription>
            How was the produce from this farmer? Your rating is added to their profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <StarPicker value={score} onChange={setScore} />
          <div className="space-y-2">
            <Label htmlFor="rating-comment">Comment (optional)</Label>
            <textarea
              id="rating-comment"
              rows={3}
              maxLength={RATING_COMMENT_MAX}
              value={comment}
              onChange={(event) => setComment(event.target.value.slice(0, RATING_COMMENT_MAX))}
              aria-describedby="rating-comment-count"
              className="flex w-full rounded-2xl border border-input bg-background px-4 py-3 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p id="rating-comment-count" className="text-right text-sm text-muted-foreground">
              {comment.length}/{RATING_COMMENT_MAX} characters
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={score === 0 || submitting}>
              {submitting ? 'Submitting…' : 'Submit rating'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
