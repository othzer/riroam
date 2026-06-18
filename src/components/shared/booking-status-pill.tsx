import { cn } from "@/lib/utils";

type Status = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STYLES: Record<Status, string> = {
  PENDING: "bg-sand text-ink-soft",
  CONFIRMED: "bg-pangong-tint text-pangong-deep",
  COMPLETED: "bg-success-tint text-success",
  CANCELLED: "bg-danger-tint text-danger",
};

const LABELS: Record<Status, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function BookingStatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-block rounded-chip px-2 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
