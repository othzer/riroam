import { Resend } from "resend";
import { formatDateRange } from "@/lib/dates";
import { formatINR } from "@/lib/money";

// Email is best-effort: every send is wrapped so a failure (or a missing API
// key in local dev) never breaks the action that triggered it (§10).
const FROM = "RiRoam <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(opts: { to: string; subject: string; html: string }) {
  const client = getClient();
  if (!client) {
    console.info(`[mail] skipped (no RESEND_API_KEY): "${opts.subject}"`);
    return;
  }
  try {
    await client.emails.send({ from: FROM, ...opts });
  } catch (err) {
    console.error("[mail] send failed:", err);
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );
}

function layout(body: string) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:auto;color:#182635">
    <p style="font-weight:800;font-size:18px">RiRoam</p>
    ${body}
    <p style="color:#8A94A0;font-size:12px;margin-top:24px">Roam the land of high passes.</p>
  </div>`;
}

export async function sendVendorApprovedEmail(to: string, name: string) {
  await send({
    to,
    subject: "You're verified on RiRoam",
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Your business has been approved. You can now publish listings and take bookings from your vendor dashboard.</p>`,
    ),
  });
}

export async function sendBookingConfirmedEmail(
  to: string,
  booking: { bookingCode: string; startDate: Date; endDate: Date; totalAmount: number },
) {
  await send({
    to,
    subject: `Booking confirmed — ${booking.bookingCode}`,
    html: layout(
      `<p>Your booking is confirmed.</p>
       <p style="padding:12px;background:#DCEBF1;border-radius:8px;font-family:monospace">${escapeHtml(booking.bookingCode)}</p>
       <p>${escapeHtml(formatDateRange(booking.startDate, booking.endDate))} · ${escapeHtml(formatINR(booking.totalAmount))}</p>
       <p>You'll find the full details and your cancellation policy under My Trips.</p>`,
    ),
  });
}

export async function sendBookingCancelledEmail(
  to: string,
  booking: { bookingCode: string; refundAmount: number },
) {
  const refundLine =
    booking.refundAmount > 0
      ? `<p>A refund of ${escapeHtml(formatINR(booking.refundAmount))} is being processed to your original payment method.</p>`
      : `<p>No payment had been captured, so there's nothing to refund.</p>`;
  await send({
    to,
    subject: `Booking cancelled — ${booking.bookingCode}`,
    html: layout(
      `<p>Your booking <span style="font-family:monospace">${escapeHtml(booking.bookingCode)}</span> has been cancelled.</p>
       ${refundLine}`,
    ),
  });
}

export async function sendNewBookingReceivedEmail(
  to: string,
  vendorName: string,
  bookingCode: string,
) {
  await send({
    to,
    subject: `New booking — ${bookingCode}`,
    html: layout(
      `<p>Hi ${escapeHtml(vendorName)},</p>
       <p>You have a new booking: <span style="font-family:monospace">${escapeHtml(bookingCode)}</span>.</p>
       <p>View it from your vendor dashboard.</p>`,
    ),
  });
}

export async function sendVendorRejectedEmail(
  to: string,
  name: string,
  reason: string,
) {
  await send({
    to,
    subject: "Your RiRoam application needs changes",
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>We couldn't approve your application yet:</p>
       <p style="padding:12px;background:#FBEAE8;border-radius:8px">${escapeHtml(reason)}</p>
       <p>You can update your details and resubmit from your dashboard.</p>`,
    ),
  });
}
