"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CountdownChip({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const expired = remaining <= 0;
  const mm = Math.max(0, Math.floor(remaining / 60_000));
  const ss = Math.max(0, Math.floor((remaining % 60_000) / 1000));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip px-2.5 py-1 font-mono text-xs font-medium",
        expired ? "bg-danger-tint text-danger" : "bg-apricot-tint text-apricot-text",
      )}
    >
      <Clock className="size-3" />
      {expired ? "Hold expired" : `Held for ${mm}:${String(ss).padStart(2, "0")}`}
    </span>
  );
}
