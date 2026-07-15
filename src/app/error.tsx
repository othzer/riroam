"use client";

import { useEffect } from "react";
import { Ridge } from "@/components/shared/ridge";

// Root error boundary. Says what happened and what to do — no apologies, no
// raw exception text in the UI (design §5).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 w-44 opacity-70">
        <Ridge className="rounded-control" back="#E2DDD1" mid="#C9C2B2" front="#EFEAE0" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-ink">
        Something broke on our end
      </h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        This one&apos;s on us, not you. Try again, and if it keeps happening come
        back in a little while.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-control bg-apricot px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover"
      >
        Try again
      </button>
    </div>
  );
}
