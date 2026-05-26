"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { packageSchema, type PackageInput } from "@/lib/validators/listings";
import { createPackage, updatePackage } from "@/actions/listings";
import { ElevationProfile } from "@/components/shared/elevation-profile";
import { SingleImageUpload, MultiImageUpload } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-danger">{msg}</p> : null;
}

export function PackageForm({
  packageId,
  initial,
}: {
  packageId?: string;
  initial?: PackageInput;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [destinationsText, setDestinationsText] = useState(
    initial?.destinations.join(", ") ?? "",
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageInput>({
    resolver: zodResolver(packageSchema),
    defaultValues: initial ?? {
      title: "",
      description: "",
      destinations: [],
      startCity: "",
      durationDays: 4,
      durationNights: 3,
      maxGroupSize: 8,
      availableFrom: "",
      availableTo: "",
      freeCancellationDays: 3,
      coverImageUrl: "",
      imageUrls: [],
      itineraryDays: [
        { title: "", location: "", altitudeMeters: undefined, description: "" },
      ],
      extras: [],
    },
  });

  const days = useFieldArray({ control, name: "itineraryDays" });
  const extras = useFieldArray({ control, name: "extras" });

  const watchedDays = watch("itineraryDays");
  const previewDays = (watchedDays ?? []).map((d, i) => ({
    dayNumber: i + 1,
    altitudeMeters: Number.isFinite(d?.altitudeMeters)
      ? (d.altitudeMeters as number)
      : 2900,
  }));

  async function onSubmit(input: PackageInput) {
    setPending(true);
    try {
      const res = packageId
        ? await updatePackage(packageId, input)
        : await createPackage(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(packageId ? "Package updated" : "Package created");
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
      {/* Basics */}
      <Card title="Basics">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Nubra & Pangong circuit" {...register("title")} />
          <Err msg={errors.title?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          <Err msg={errors.description?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="startCity">Start city</Label>
            <Input id="startCity" placeholder="Leh" {...register("startCity")} />
            <Err msg={errors.startCity?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="destinations">Destinations</Label>
            <Input
              id="destinations"
              placeholder="Nubra, Pangong, Sham Valley"
              value={destinationsText}
              onChange={(e) => {
                setDestinationsText(e.target.value);
                setValue(
                  "destinations",
                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  { shouldValidate: true },
                );
              }}
            />
            <Err msg={errors.destinations?.message} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField label="Days" reg={register("durationDays", { valueAsNumber: true })} err={errors.durationDays?.message} />
          <NumberField label="Nights" reg={register("durationNights", { valueAsNumber: true })} err={errors.durationNights?.message} />
          <NumberField label="Max group" reg={register("maxGroupSize", { valueAsNumber: true })} err={errors.maxGroupSize?.message} />
          <NumberField label="Price /person (₹)" reg={register("pricePerPerson", { valueAsNumber: true })} err={errors.pricePerPerson?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="availableFrom">Available from</Label>
            <Input id="availableFrom" type="date" {...register("availableFrom")} />
            <Err msg={errors.availableFrom?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="availableTo">Available to</Label>
            <Input id="availableTo" type="date" {...register("availableTo")} />
            <Err msg={errors.availableTo?.message} />
          </div>
          <NumberField label="Free-cancel days" reg={register("freeCancellationDays", { valueAsNumber: true })} err={errors.freeCancellationDays?.message} />
        </div>
      </Card>

      {/* Images */}
      <Card title="Images">
        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <Controller
            control={control}
            name="coverImageUrl"
            render={({ field }) => (
              <SingleImageUpload
                folder="packages"
                value={field.value || undefined}
                onChange={(url) => field.onChange(url ?? "")}
              />
            )}
          />
          <Err msg={errors.coverImageUrl?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Gallery</Label>
          <Controller
            control={control}
            name="imageUrls"
            render={({ field }) => (
              <MultiImageUpload
                folder="packages"
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </Card>

      {/* Itinerary builder */}
      <Card title="Itinerary">
        {previewDays.length > 0 && (
          <div className="rounded-control border border-border bg-paper p-3">
            <ElevationProfile days={previewDays} animate={false} />
          </div>
        )}
        <Err msg={errors.itineraryDays?.message} />

        <div className="space-y-4">
          {days.fields.map((f, i) => (
            <div key={f.id} className="rounded-control border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-ink">
                  Day {i + 1}
                </span>
                {days.fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => days.remove(i)}
                    className="text-ink-muted hover:text-danger"
                    aria-label="Remove day"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Title</Label>
                  <Input placeholder="Khardung La to Nubra" {...register(`itineraryDays.${i}.title`)} />
                  <Err msg={errors.itineraryDays?.[i]?.title?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label>Altitude (m)</Label>
                  <Input type="number" placeholder="5359" {...register(`itineraryDays.${i}.altitudeMeters`, { valueAsNumber: true })} />
                  <Err msg={errors.itineraryDays?.[i]?.altitudeMeters?.message} />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="Nubra Valley" {...register(`itineraryDays.${i}.location`)} />
                <Err msg={errors.itineraryDays?.[i]?.location?.message} />
              </div>
              <div className="mt-3 space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} {...register(`itineraryDays.${i}.description`)} />
                <Err msg={errors.itineraryDays?.[i]?.description?.message} />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            days.append({ title: "", location: "", altitudeMeters: undefined as unknown as number, description: "" })
          }
        >
          <Plus className="size-4" /> Add day
        </Button>
      </Card>

      {/* Extras */}
      <Card title="Extras (optional)">
        <div className="space-y-3">
          {extras.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-3">
              <div className="flex-1 space-y-1.5">
                <Input placeholder="Inner Line Permit" {...register(`extras.${i}.name`)} />
                <Err msg={errors.extras?.[i]?.name?.message} />
              </div>
              <div className="w-32 space-y-1.5">
                <Input type="number" placeholder="₹ price" {...register(`extras.${i}.price`, { valueAsNumber: true })} />
                <Err msg={errors.extras?.[i]?.price?.message} />
              </div>
              <button
                type="button"
                onClick={() => extras.remove(i)}
                className="mt-2 text-ink-muted hover:text-danger"
                aria-label="Remove extra"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => extras.append({ name: "", description: "", price: undefined as unknown as number })}
        >
          <Plus className="size-4" /> Add extra
        </Button>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {packageId ? "Save changes" : "Create package"}
        </Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  reg,
  err,
}: {
  label: string;
  reg: ReturnType<ReturnType<typeof useForm<PackageInput>>["register"]>;
  err?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" {...reg} />
      <Err msg={err} />
    </div>
  );
}
