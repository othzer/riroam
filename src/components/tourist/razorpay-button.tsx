"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { verifyPayment } from "@/actions/payments";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
};
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function RazorpayButton({
  bookingId,
  razorpayOrderId,
  amount,
  keyId,
  name,
  email,
  phone,
  expiresAt,
  disabled,
}: {
  bookingId: string;
  razorpayOrderId: string;
  amount: number;
  keyId: string;
  name: string;
  email: string;
  phone: string;
  expiresAt?: string; // ISO — disables the button once the hold lapses
  disabled?: boolean;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);
  // Razorpay fires ondismiss when the modal closes for ANY reason — including
  // right after a successful payment. This flag lets dismiss tell "user backed
  // out" apart from "we're already navigating", so a paid booking is never
  // redirected to the failure view.
  const settled = useRef(false);
  // Deterministic initial value — no Date.now() during render, so server and
  // client hydrate identically.
  const [expired, setExpired] = useState(false);

  // The server already refuses expired holds at page load; this covers the
  // user who sits on the page past the deadline — the button locks and a
  // refresh swaps in the server-rendered "hold expired" state. A hold that has
  // somehow already lapsed on mount clamps the delay to 0 and fires next tick,
  // so we never setState synchronously during the effect.
  useEffect(() => {
    if (!expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => {
      setExpired(true);
      router.refresh();
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [expiresAt, router]);

  function pay() {
    if (!window.Razorpay) {
      toast.error("Payment isn't ready yet — try again in a moment");
      return;
    }
    setPending(true);

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency: "INR",
      order_id: razorpayOrderId,
      name: "RiRoam",
      description: "Booking payment",
      prefill: { name, email, contact: phone },
      theme: { color: "#E39129" },
      handler: async (response: unknown) => {
        const r = response as RazorpaySuccessResponse;
        settled.current = true;
        try {
          const res = await verifyPayment({
            bookingId,
            razorpay_order_id: r.razorpay_order_id,
            razorpay_payment_id: r.razorpay_payment_id,
            razorpay_signature: r.razorpay_signature,
          });
          if (res.ok) {
            router.push(`/checkout/${bookingId}/result`);
            return;
          }
          // Verification bounced — the modal is gone but the hold may still be
          // live, so hand the button back and let a fresh attempt re-arm.
          settled.current = false;
          toast.error(res.error);
        } catch {
          settled.current = false;
          toast.error("Couldn't verify the payment — check your trip status");
        } finally {
          setPending(false);
        }
      },
      // Closing the modal used to only clear `pending`, which left the user
      // stranded on a checkout page with no feedback. Send them to the result
      // page instead — it reads the booking's real status and offers a retry
      // while the hold is still alive.
      modal: {
        ondismiss: () => {
          setPending(false);
          if (settled.current) return;
          router.push(`/checkout/${bookingId}/result`);
        },
      },
    });
    rzp.on("payment.failed", () => {
      settled.current = true;
      setPending(false);
      router.push(`/checkout/${bookingId}/result`);
    });
    rzp.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <button
        type="button"
        onClick={pay}
        disabled={disabled || expired || pending || !scriptReady}
        className="flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] disabled:opacity-60"
      >
        {(pending || !scriptReady) && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Opening payment…" : "Pay now"}
      </button>
    </>
  );
}
