import type { Metadata } from "next";
import { PackageForm } from "@/components/vendor/package-form";

export const metadata: Metadata = { title: "New package" };

export default function NewPackagePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">
        New package
      </h1>
      <PackageForm />
    </div>
  );
}
