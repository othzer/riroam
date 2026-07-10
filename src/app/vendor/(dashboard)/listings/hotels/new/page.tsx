import type { Metadata } from "next";
import { HotelForm } from "@/components/vendor/hotel-form";

export const metadata: Metadata = { title: "New hotel" };

export default function NewHotelPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">New hotel</h1>
      <HotelForm />
    </div>
  );
}
