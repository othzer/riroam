"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { replyToReview } from "@/actions/vendor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function VendorReviewReply({
  reviewId,
  existingReply,
}: {
  reviewId: string;
  existingReply: string | null;
}) {
  const router = useRouter();
  const [reply, setReply] = useState(existingReply ?? "");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      try {
        const res = await replyToReview(reviewId, reply);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(existingReply ? "Reply updated" : "Reply posted");
        router.refresh();
      } catch {
        toast.error("Something went wrong — try again");
      }
    });
  }

  return (
    <div className="mt-3 border-l-2 border-border pl-3">
      <Textarea
        rows={2}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Reply to this review…"
      />
      <div className="mt-2">
        <Button size="sm" disabled={isPending || reply.trim().length < 2} onClick={submit}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {existingReply ? "Update reply" : "Reply"}
        </Button>
      </div>
    </div>
  );
}
