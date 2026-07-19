"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import {
  onboardingSchema,
  type OnboardingInput,
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  LADAKH_DISTRICTS,
  LADAKH_REGIONS,
  REGION_DISTRICT,
} from "@/lib/validators/vendor";
import { submitVendorOnboarding } from "@/actions/vendor";
import { FileUpload } from "@/components/shared/file-upload";
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
import { cn } from "@/lib/utils";

const STEPS = ["Business", "Verification", "Review"] as const;

const STEP_FIELDS: FieldPath<OnboardingInput>[][] = [
  [
    "businessName",
    "businessType",
    "phone",
    "district",
    "region",
    "city",
    "state",
    "serviceAreas",
  ],
  ["verificationDocUrl"],
  [],
];

export function OnboardingForm({ isReapplying }: { isReapplying: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [serviceAreasText, setServiceAreasText] = useState("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      description: "",
      phone: "",
      city: "",
      state: "",
      district: undefined,
      region: undefined,
      serviceAreas: [],
      gstNumber: "",
      verificationDocUrl: "",
    },
  });

  const values = watch();

  async function next() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(input: OnboardingInput) {
    // Pressing Enter in any text field fires a native submit, which used to
    // send the application straight off the first step — past Verification and
    // the Review screen. Only the last step may actually submit; anywhere else
    // Enter behaves like Continue.
    if (step < STEPS.length - 1) {
      await next();
      return;
    }

    setPending(true);
    try {
      const res = await submitVendorOnboarding(input);

      if (!res.ok) {
        if (res.fieldErrors) {
          for (const [field, messages] of Object.entries(res.fieldErrors)) {
            if (messages?.[0])
              setError(field as FieldPath<OnboardingInput>, {
                message: messages[0],
              });
          }
        }
        toast.error(res.error);
        return;
      }

      toast.success(
        isReapplying ? "Application resubmitted" : "Application submitted",
      );
      router.push("/vendor/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
                i < step && "bg-pangong text-white",
                i === step && "bg-ink text-white",
                i > step && "bg-sand text-ink-muted",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-ink" : "text-ink-muted",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-card border border-border bg-surface p-6">
        {/* STEP 1 — Business */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                placeholder="Snow Leopard Expeditions"
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs text-danger">
                  {errors.businessName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Business type</Label>
              <Controller
                control={control}
                name="businessType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {BUSINESS_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.businessType && (
                <p className="text-xs text-danger">Select a business type</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>District</Label>
                <Controller
                  control={control}
                  name="district"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        // Clear a region that doesn't belong to the new
                        // district rather than leaving an invalid pair behind.
                        if (
                          values.region &&
                          REGION_DISTRICT[values.region] !== v
                        ) {
                          setValue("region", "" as OnboardingInput["region"]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a district" />
                      </SelectTrigger>
                      <SelectContent>
                        {LADAKH_DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.district && (
                  <p className="text-xs text-danger">Select a district</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Region</Label>
                <Controller
                  control={control}
                  name="region"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!values.district}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            values.district ? "Select a region" : "Pick a district first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {LADAKH_REGIONS.filter(
                          (r) => REGION_DISTRICT[r] === values.district,
                        ).map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.region && (
                  <p className="text-xs text-danger">{errors.region.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">Town or village</Label>
                <Input id="city" placeholder="Diskit" {...register("city")} />
                {errors.city && (
                  <p className="text-xs text-danger">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State / UT</Label>
                <Input
                  id="state"
                  placeholder="Ladakh"
                  {...register("state")}
                />
                {errors.state && (
                  <p className="text-xs text-danger">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-danger">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="serviceAreas">Service areas</Label>
              <Input
                id="serviceAreas"
                placeholder="Leh, Nubra, Pangong"
                value={serviceAreasText}
                onChange={(e) => {
                  setServiceAreasText(e.target.value);
                  setValue(
                    "serviceAreas",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                    { shouldValidate: true },
                  );
                }}
              />
              <p className="text-xs text-ink-muted">
                Comma-separated list of places you serve
              </p>
              {errors.serviceAreas && (
                <p className="text-xs text-danger">
                  {errors.serviceAreas.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstNumber">GST number (optional)</Label>
              <Input
                id="gstNumber"
                placeholder="22AAAAA0000A1Z5"
                {...register("gstNumber")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="What makes your business special?"
                {...register("description")}
              />
            </div>
          </div>
        )}

        {/* STEP 2 — Verification */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>Verification document</Label>
              <p className="mt-1 text-sm text-ink-soft">
                Business registration, licence, or a government ID. Only RiRoam
                admins can see this.
              </p>
            </div>
            <Controller
              control={control}
              name="verificationDocUrl"
              render={({ field }) => (
                <FileUpload
                  folder="verification-docs"
                  value={field.value || undefined}
                  onChange={(url) =>
                    field.onChange(url ?? "")
                  }
                />
              )}
            />
            {errors.verificationDocUrl && (
              <p className="text-xs text-danger">
                {errors.verificationDocUrl.message}
              </p>
            )}
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 2 && (
          <dl className="divide-y divide-border-soft text-sm">
            <Row label="Business name" value={values.businessName} />
            <Row
              label="Type"
              value={
                values.businessType
                  ? BUSINESS_TYPE_LABELS[values.businessType]
                  : "—"
              }
            />
            <Row
              label="Location"
              value={`${values.city}, ${values.region} · ${values.district} district, ${values.state}`}
            />
            <Row label="Phone" value={values.phone} />
            <Row
              label="Service areas"
              value={values.serviceAreas?.join(", ") || "—"}
            />
            {values.gstNumber && (
              <Row label="GST" value={values.gstNumber} />
            )}
            <Row
              label="Verification"
              value={values.verificationDocUrl ? "Uploaded" : "Missing"}
            />
          </dl>
        )}
      </div>

      {/* nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Submitting…" : "Submit application"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}
