"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cancelBooking } from "@/actions/bookings";
import { computeRefund, type BookingStatusLite } from "@/lib/refund";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CancelBookingButton({
  bookingId,
  status,
  startDate,
  isPaid,
  freeCancellationDays,
  totalAmount,
}: {
  bookingId: string;
  status: BookingStatusLite;
  startDate: string;
  isPaid: boolean;
  freeCancellationDays: number;
  totalAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const quote = computeRefund({
    status,
    isPaid,
    startDate: new Date(startDate),
    freeCancellationDays,
    totalAmount,
  });

  function onConfirm() {
    startTransition(async () => {
      try {
        const res = await cancelBooking(bookingId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Booking cancelled");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Something went wrong — try again");
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Cancel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              {isPaid
                ? quote.refundPercent === 100
                  ? `You're within the free-cancellation window — a full refund of ${formatINR(quote.refundAmount)} will be processed.`
                  : `This is inside ${freeCancellationDays} days of the start date, so ${quote.refundPercent}% is refundable: ${formatINR(quote.refundAmount)}.`
                : "No payment has been captured yet — cancelling just releases your held spot."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
