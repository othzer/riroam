"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  hotelSchema,
  type HotelInput,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/lib/validators/listings";
import { createHotel, updateHotel } from "@/actions/listings";
import { SingleImageUpload, MultiImageUpload } from "@/components/shared/image-upload";
import { FormCard, FieldError } from "@/components/vendor/form-parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HotelForm({
  hotelId,
  initial,
}: {
  hotelId?: string;
  initial?: HotelInput;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [amenitiesText, setAmenitiesText] = useState(
    initial?.amenities.join(", ") ?? "",
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HotelInput>({
    resolver: zodResolver(hotelSchema),
    defaultValues: initial ?? {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      amenities: [],
      freeCancellationDays: 2,
      coverImageUrl: "",
      imageUrls: [],
      rooms: [{ name: "", description: "", capacity: 2, totalUnits: 1 }],
    },
  });

  const rooms = useFieldArray({ control, name: "rooms" });

  async function onSubmit(input: HotelInput) {
    setPending(true);
    try {
      const res = hotelId
        ? await updateHotel(hotelId, input)
        : await createHotel(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(hotelId ? "Hotel updated" : "Hotel created");
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Nubra Ecolodge" {...register("name")} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label>Property type</Label>
            <Controller
              control={control}
              name="propertyType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError msg={errors.propertyType && "Select a type"} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          <FieldError msg={errors.description?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
          <FieldError msg={errors.address?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Hunder" {...register("city")} />
            <FieldError msg={errors.city?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Ladakh" {...register("state")} />
            <FieldError msg={errors.state?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="altitude">Altitude (m)</Label>
            <Input id="altitude" type="number" placeholder="3100" {...register("altitudeMeters", { valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeCancel">Free-cancel days</Label>
            <Input id="freeCancel" type="number" {...register("freeCancellationDays", { valueAsNumber: true })} />
            <FieldError msg={errors.freeCancellationDays?.message} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amenities">Amenities</Label>
          <Input
            id="amenities"
            placeholder="wifi, parking, breakfast"
            value={amenitiesText}
            onChange={(e) => {
              setAmenitiesText(e.target.value);
              setValue(
                "amenities",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                { shouldValidate: true },
              );
            }}
          />
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
                folder="hotels"
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
              <MultiImageUpload folder="hotels" value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </div>
      </FormCard>

      <FormCard title="Rooms">
        <FieldError msg={errors.rooms?.message} />
        <div className="space-y-4">
          {rooms.fields.map((f, i) => (
            <div key={f.id} className="rounded-control border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Room type {i + 1}</span>
                {rooms.fields.length > 1 && (
                  <button type="button" onClick={() => rooms.remove(i)} className="text-ink-muted hover:text-danger" aria-label="Remove room">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Deluxe Double" {...register(`rooms.${i}.name`)} />
                  <FieldError msg={errors.rooms?.[i]?.name?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label>Price /night (₹)</Label>
                  <Input type="number" {...register(`rooms.${i}.pricePerNight`, { valueAsNumber: true })} />
                  <FieldError msg={errors.rooms?.[i]?.pricePerNight?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label>Capacity</Label>
                  <Input type="number" {...register(`rooms.${i}.capacity`, { valueAsNumber: true })} />
                  <FieldError msg={errors.rooms?.[i]?.capacity?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label>Total units</Label>
                  <Input type="number" {...register(`rooms.${i}.totalUnits`, { valueAsNumber: true })} />
                  <FieldError msg={errors.rooms?.[i]?.totalUnits?.message} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            rooms.append({
              name: "",
              description: "",
              pricePerNight: undefined as unknown as number,
              capacity: 2,
              totalUnits: 1,
            })
          }
        >
          <Plus className="size-4" /> Add room type
        </Button>
      </FormCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {hotelId ? "Save changes" : "Create hotel"}
        </Button>
      </div>
    </form>
  );
}
