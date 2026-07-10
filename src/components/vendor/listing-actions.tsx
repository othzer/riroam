"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { togglePublish, deleteListing } from "@/actions/listings";
import type { ListingType } from "@/lib/validators/listings";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ListingActions({
  type,
  id,
  isPublished,
  editHref,
}: {
  type: ListingType;
  id: string;
  isPublished: boolean;
  editHref: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function onToggle() {
    startTransition(async () => {
      try {
        const res = await togglePublish(type, id);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(isPublished ? "Listing unpublished" : "Listing published");
        router.refresh();
      } catch {
        toast.error("Something went wrong — try again");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      try {
        const res = await deleteListing(type, id);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Listing deleted");
        setConfirmOpen(false);
        router.refresh();
      } catch {
        toast.error("Something went wrong — try again");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant={isPublished ? "outline" : "default"}
        disabled={isPending}
        onClick={onToggle}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <Link href={editHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Edit
      </Link>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
      >
        Delete
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. The listing and its details are removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
