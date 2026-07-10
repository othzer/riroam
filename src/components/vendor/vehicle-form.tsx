"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  vehicleSchema,
  type VehicleInput,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
} from "@/lib/validators/listings";
import { createVehicle, updateVehicle } from "@/actions/listings";
import { SingleImageUpload, MultiImageUpload } from "@/components/shared/image-upload";
import { FormCard, FieldError } from "@/components/vendor/form-parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: string;
  initial?: VehicleInput;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initial ?? {
      vehicleType: "TAXI",
      title: "",
      brand: "",
      model: "",
      city: "",
      state: "",
      transmission: "",
      fuelType: "",
      totalUnits: 1,
      freeCancellationDays: 1,
      coverImageUrl: "",
      imageUrls: [],
    },
  });

  async function onSubmit(input: VehicleInput) {
    setPending(true);
    try {
      const res = vehicleId
        ? await updateVehicle(vehicleId, input)
        : await createVehicle(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(vehicleId ? "Vehicle updated" : "Vehicle created");
      router.push("/vendor/listings");
      router.refresh();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <FormCard title="Basics">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Controller
            control={control}
            name="vehicleType"
            render={({ field }) => (
              <div className="inline-flex rounded-control border border-border p-0.5">
                {VEHICLE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => field.onChange(t)}
                    className={cn(
                      "rounded-[6px] px-4 py-1.5 text-sm font-medium transition-colors",
                      field.value === t
                        ? "bg-pangong-tint text-pangong-deep"
                        : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {VEHICLE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Royal Enfield Classic 350" {...register("title")} />
          <FieldError msg={errors.title?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" placeholder="Royal Enfield" {...register("brand")} />
            <FieldError msg={errors.brand?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <Input id="model" placeholder="Classic 350" {...register("model")} />
            <FieldError msg={errors.model?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Leh" {...register("city")} />
            <FieldError msg={errors.city?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Ladakh" {...register("state")} />
            <FieldError msg={errors.state?.message} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="pricePerDay">Price /day (₹)</Label>
            <Input id="pricePerDay" type="number" {...register("pricePerDay", { valueAsNumber: true })} />
            <FieldError msg={errors.pricePerDay?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seats">Seats</Label>
            <Input id="seats" type="number" placeholder="optional" {...register("seats", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmission</Label>
            <Input id="transmission" placeholder="manual" {...register("transmission")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Fuel</Label>
            <Input id="fuelType" placeholder="petrol" {...register("fuelType")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="totalUnits">Total units in fleet</Label>
            <Input id="totalUnits" type="number" {...register("totalUnits", { valueAsNumber: true })} />
            <FieldError msg={errors.totalUnits?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeCancel">Free-cancel days</Label>
            <Input id="freeCancel" type="number" {...register("freeCancellationDays", { valueAsNumber: true })} />
            <FieldError msg={errors.freeCancellationDays?.message} />
          </div>
        </div>
      </FormCard>

      <FormCard title="Images">
        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <Controller
            control={control}
            name="coverImageUrl"
            render={({ field }) => (
              <SingleImageUpload
                folder="vehicles"
                value={field.value || undefined}
                onChange={(url) => field.onChange(url ?? "")}
              />
            )}
          />
          <FieldError msg={errors.coverImageUrl?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Gallery</Label>
          <Controller
            control={control}
            name="imageUrls"
            render={({ field }) => (
              <MultiImageUpload folder="vehicles" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
      </FormCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {vehicleId ? "Save changes" : "Create vehicle"}
        </Button>
      </div>
    </form>
  );
}
