import type { Metadata } from "next";
import { VehicleForm } from "@/components/vendor/vehicle-form";

export const metadata: Metadata = { title: "New vehicle" };

export default function NewVehiclePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">
        New vehicle
      </h1>
      <VehicleForm />
    </div>
  );
}
