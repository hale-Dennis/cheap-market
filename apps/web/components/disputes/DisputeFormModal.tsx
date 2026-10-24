import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DISPUTE_REASON_MAX } from '@cheap-market/shared-types';

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
import { ApiError } from '@/services/apiClient';
import { createDispute } from '@/services/disputeService';

interface DisputeFormModalProps {
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once the order has a reported issue (just submitted, or already there), to refresh it. */
  onReported: () => void;
}

/** "Report issue" form for a completed order: a description of the problem, sent to the admins. */
export function DisputeFormModal({ orderId, orderNumber, open, onOpenChange, onReported }: DisputeFormModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // Start from a clean form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setReason('');
      setError(undefined);
    }
  }, [open]);

  const empty = reason.trim().length === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (empty) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createDispute({ orderId, reason: reason.trim() });
      toast.success("Thanks for letting us know. We'll review the issue and get back to you.");
      onReported();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_DISPUTED') {
        // Reported in another tab or a double submit: show the existing report instead.
        toast.error(err.message);
        onReported();
        onOpenChange(false);
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not send your report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Tell us what went wrong with order <span className="font-mono">{orderNumber}</span>, such as missing,
            wrong or poor-quality items. Our team will review it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">What went wrong?</Label>
            <textarea
              id="dispute-reason"
              rows={5}
              required
              placeholder="Describe the issue"
              maxLength={DISPUTE_REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, DISPUTE_REASON_MAX))}
              aria-describedby="dispute-reason-count"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p id="dispute-reason-count" className="text-right text-sm text-muted-foreground">
              {reason.length}/{DISPUTE_REASON_MAX} characters
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={empty || submitting}>
              {submitting ? 'Sending…' : 'Submit report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
