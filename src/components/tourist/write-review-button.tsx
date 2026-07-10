"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createReview } from "@/actions/reviews";
import { StarRatingInput } from "@/components/shared/star-rating-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WriteReviewButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating");
      return;
    }
    if (comment.trim().length < 4) {
      setError("Add a few words about your trip");
      return;
    }
    startTransition(async () => {
      try {
        const res = await createReview(bookingId, { rating, title, comment });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        toast.success("Review posted");
        setOpen(false);
        router.refresh();
      } catch {
        setError("Something went wrong — try again");
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Write a review
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review your trip</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Unforgettable"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-comment">Your review</Label>
              <Textarea
                id="review-comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the trip?"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={onSubmit}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Post review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
