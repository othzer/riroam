"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { approveVendor, rejectVendor, suspendVendor } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";

export function VendorActions({
  vendorId,
  status,
}: {
  vendorId: string;
  status: Status;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong");
        return;
      }
      toast.success(ok);
      setRejectOpen(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {isPending && <Loader2 className="size-4 animate-spin text-ink-muted" />}

      {status === "PENDING_REVIEW" && (
        <>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => approveVendor(vendorId), "Vendor approved")}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setRejectOpen(true)}
          >
            Reject
          </Button>
        </>
      )}

      {status === "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => suspendVendor(vendorId), "Vendor suspended")}
        >
          Suspend
        </Button>
      )}

      {status === "SUSPENDED" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => approveVendor(vendorId), "Vendor reinstated")}
        >
          Reinstate
        </Button>
      )}

      {status === "REJECTED" && (
        <span className="text-xs text-ink-muted">Awaiting resubmission</span>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              The reason is emailed to the vendor and shown on their dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Verification document was unreadable…"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                run(() => rejectVendor(vendorId, reason), "Vendor rejected")
              }
            >
              Reject vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
