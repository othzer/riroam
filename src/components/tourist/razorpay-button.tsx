"use client";

import { useState } from "react";
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
  disabled,
}: {
  bookingId: string;
  razorpayOrderId: string;
  amount: number;
  keyId: string;
  name: string;
  email: string;
  phone: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState(false);

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
          toast.error(res.error);
        } catch {
          toast.error("Couldn't verify the payment — check your trip status");
        } finally {
          setPending(false);
        }
      },
      modal: { ondismiss: () => setPending(false) },
    });
    rzp.on("payment.failed", () => {
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
        disabled={disabled || pending || !scriptReady}
        className="flex w-full items-center justify-center gap-1.5 rounded-control bg-apricot px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-apricot-hover active:scale-[0.98] disabled:opacity-60"
      >
        {(pending || !scriptReady) && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Opening payment…" : "Pay now"}
      </button>
    </>
  );
}
