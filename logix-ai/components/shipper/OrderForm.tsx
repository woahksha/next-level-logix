"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  PackageSearch,
  Truck,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useShipper } from "@/hooks/useShipper";
import { SHIPPER_CITIES, PRODUCT_TYPE_OPTIONS, TRUCK_TYPE_OPTIONS } from "@/data/shipper-mock";
import { haversineDistanceKm } from "@/lib/geo";
import { calculatePriceEstimate, type PriceEstimate } from "@/lib/pricing";
import { LogixAIEstimateCard } from "@/components/shipper/LogixAIEstimateCard";
import type { OrderFormValues, PricingType } from "@/types/shipper";

const EMPTY_FORM: OrderFormValues = {
  pickupCity: "",
  pickupAddress: "",
  pickupDate: "",
  pickupTime: "",
  dropCity: "",
  dropAddress: "",
  deliveryDeadline: "",
  productType: "",
  weightKg: "",
  volume: "",
  packageCount: "",
  dimensions: "",
  isFragile: false,
  isTemperatureSensitive: false,
  specialHandlingNotes: "",
  truckTypeRequired: "",
  minCapacityTons: "",
  pricingType: "FIXED",
  fixedPrice: "",
  minPrice: "",
  maxPrice: "",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function OrderForm() {
  const router = useRouter();
  const { profile } = useShipper();
  const [form, setForm] = useState<OrderFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function set<K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  // Live "Logix AI Estimate" preview — recalculates as the shipper fills
  // in the form. Requires pickup, delivery, cargo weight, and truck type
  // before it will show a number; until then it shows a clear prompt
  // instead of a broken/partial estimate.
  const aiEstimate: PriceEstimate | null = useMemo(() => {
    const hasRequiredFields =
      form.pickupCity &&
      form.dropCity &&
      form.pickupCity !== form.dropCity &&
      form.truckTypeRequired &&
      form.weightKg &&
      Number(form.weightKg) > 0;

    if (!hasRequiredFields) return null;

    const distanceKm = haversineDistanceKm(form.pickupCity, form.dropCity);
    if (distanceKm == null) return null;

    let deliveryDeadline: string | null = null;
    if (form.deliveryDeadline) {
      const parsed = new Date(form.deliveryDeadline);
      if (!Number.isNaN(parsed.getTime())) deliveryDeadline = form.deliveryDeadline;
    }

    const result = calculatePriceEstimate({
      distanceKm,
      truckType: form.truckTypeRequired,
      productType: form.productType || undefined,
      weightKg: Number(form.weightKg),
      isFragile: form.isFragile,
      isTemperatureSensitive: form.isTemperatureSensitive,
      specialHandlingNotes: form.specialHandlingNotes,
      pickupCity: form.pickupCity,
      dropCity: form.dropCity,
      deliveryDeadline,
    });

    return result.ok ? result : null;
  }, [
    form.pickupCity,
    form.dropCity,
    form.truckTypeRequired,
    form.weightKg,
    form.productType,
    form.isFragile,
    form.isTemperatureSensitive,
    form.specialHandlingNotes,
    form.deliveryDeadline,
  ]);

  function validateClientSide(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.pickupCity) e.pickupCity = "Select a pickup city.";
    if (!form.pickupAddress.trim()) e.pickupAddress = "Pickup address is required.";
    if (!form.pickupDate || !form.pickupTime) e.pickupDateTime = "Pickup date and time are required.";
    if (!form.dropCity) e.dropCity = "Select a delivery city.";
    if (form.pickupCity && form.dropCity && form.pickupCity === form.dropCity) {
      e.dropCity = "Delivery city must be different from pickup city.";
    }
    if (!form.dropAddress.trim()) e.dropAddress = "Delivery address is required.";
    if (!form.deliveryDeadline) e.deliveryDeadline = "Delivery deadline is required.";
    if (!form.productType) e.productType = "Select a product type.";
    if (!form.weightKg || Number(form.weightKg) <= 0) e.weightKg = "Enter a valid cargo weight.";
    if (form.packageCount && Number(form.packageCount) <= 0) e.packageCount = "Enter a valid number of packages.";
    if (!form.truckTypeRequired) e.truckTypeRequired = "Select the required truck type.";
    if (form.minCapacityTons && Number(form.minCapacityTons) <= 0) e.minCapacityTons = "Enter a valid minimum capacity.";

    if (form.pricingType === "FIXED") {
      if (!form.fixedPrice || Number(form.fixedPrice) <= 0) e.fixedPrice = "Enter a valid fixed price.";
    } else {
      if (!form.minPrice || Number(form.minPrice) <= 0) e.minPrice = "Enter a valid minimum price.";
      if (!form.maxPrice || Number(form.maxPrice) <= 0) e.maxPrice = "Enter a valid maximum price.";
      if (form.minPrice && form.maxPrice && Number(form.minPrice) > Number(form.maxPrice)) {
        e.minPrice = "Minimum price cannot exceed maximum price.";
        e.maxPrice = "Maximum price must be greater than or equal to minimum price.";
      }
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, shipperId: profile.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        setGeneralError(data.error ?? "Could not post the order.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setGeneralError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-bold text-navy-800">Shipment posted successfully.</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your order is now visible to verified transporters. You&apos;ll see their bids on the order page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/shipper/orders")}>View My Orders</Button>
          <Button
            variant="outline"
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setSuccess(false);
            }}
          >
            Post another order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {generalError}
        </div>
      )}

      <Section icon={MapPin} title="Pickup">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.pickupCity}>
            <Select value={form.pickupCity} onChange={(v) => set("pickupCity", v)} options={SHIPPER_CITIES} placeholder="Select pickup city" error={!!errors.pickupCity} />
          </Field>
          <Field label="Address" error={errors.pickupAddress}>
            <Input value={form.pickupAddress} onChange={(v) => set("pickupAddress", v)} placeholder="Warehouse / street address" error={!!errors.pickupAddress} />
          </Field>
          <Field label="Date" error={errors.pickupDateTime}>
            <input
              type="date"
              min={todayISO()}
              className={inputClass(!!errors.pickupDateTime)}
              value={form.pickupDate}
              onChange={(e) => set("pickupDate", e.target.value)}
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              className={inputClass(!!errors.pickupDateTime)}
              value={form.pickupTime}
              onChange={(e) => set("pickupTime", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={MapPin} title="Delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" error={errors.dropCity}>
            <Select value={form.dropCity} onChange={(v) => set("dropCity", v)} options={SHIPPER_CITIES} placeholder="Select delivery city" error={!!errors.dropCity} />
          </Field>
          <Field label="Address" error={errors.dropAddress}>
            <Input value={form.dropAddress} onChange={(v) => set("dropAddress", v)} placeholder="Consignee / street address" error={!!errors.dropAddress} />
          </Field>
          <Field label="Deadline" error={errors.deliveryDeadline}>
            <input
              type="date"
              min={form.pickupDate || todayISO()}
              className={inputClass(!!errors.deliveryDeadline)}
              value={form.deliveryDeadline}
              onChange={(e) => set("deliveryDeadline", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section icon={PackageSearch} title="Cargo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product type" error={errors.productType}>
            <Select value={form.productType} onChange={(v) => set("productType", v)} options={[...PRODUCT_TYPE_OPTIONS]} placeholder="Select product type" error={!!errors.productType} />
          </Field>
          <Field label="Weight (kg)" error={errors.weightKg}>
            <Input type="number" value={form.weightKg} onChange={(v) => set("weightKg", v)} placeholder="e.g. 4500" error={!!errors.weightKg} />
          </Field>
          <Field label="Volume (cubic metres)">
            <Input type="number" value={form.volume} onChange={(v) => set("volume", v)} placeholder="Optional" />
          </Field>
          <Field label="Number of packages" error={errors.packageCount}>
            <Input type="number" value={form.packageCount} onChange={(v) => set("packageCount", v)} placeholder="Optional" error={!!errors.packageCount} />
          </Field>
          <Field label="Dimensions">
            <Input value={form.dimensions} onChange={(v) => set("dimensions", v)} placeholder='e.g. 2m x 1.5m x 1.5m' />
          </Field>
          <div className="flex items-end gap-6 pb-2">
            <Checkbox label="Fragile" checked={form.isFragile} onChange={(v) => set("isFragile", v)} />
            <Checkbox label="Temperature sensitive" checked={form.isTemperatureSensitive} onChange={(v) => set("isTemperatureSensitive", v)} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Special handling notes">
              <textarea
                className={inputClass(false) + " min-h-[80px] resize-y"}
                value={form.specialHandlingNotes}
                onChange={(e) => set("specialHandlingNotes", e.target.value)}
                placeholder="Optional — e.g. stack no more than 2 high, keep upright"
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={Truck} title="Vehicle">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Required truck type" error={errors.truckTypeRequired}>
            <Select value={form.truckTypeRequired} onChange={(v) => set("truckTypeRequired", v)} options={[...TRUCK_TYPE_OPTIONS]} placeholder="Select truck type" error={!!errors.truckTypeRequired} />
          </Field>
          <Field label="Minimum capacity (tons)" error={errors.minCapacityTons}>
            <Input type="number" value={form.minCapacityTons} onChange={(v) => set("minCapacityTons", v)} placeholder="Optional" error={!!errors.minCapacityTons} />
          </Field>
        </div>
      </Section>

      <LogixAIEstimateCard estimate={aiEstimate} />

      <Section icon={IndianRupee} title="Pricing">
        <div className="flex gap-3">
          <PricingTypeButton label="Fixed price" active={form.pricingType === "FIXED"} onClick={() => set("pricingType", "FIXED" as PricingType)} />
          <PricingTypeButton label="Negotiable range" active={form.pricingType === "NEGOTIABLE"} onClick={() => set("pricingType", "NEGOTIABLE" as PricingType)} />
        </div>

        {form.pricingType === "FIXED" ? (
          <div className="mt-4 max-w-xs">
            <Field label="Fixed price (₹)" error={errors.fixedPrice}>
              <Input type="number" value={form.fixedPrice} onChange={(v) => set("fixedPrice", v)} placeholder="e.g. 28000" error={!!errors.fixedPrice} />
            </Field>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:max-w-md">
            <Field label="Minimum price (₹)" error={errors.minPrice}>
              <Input type="number" value={form.minPrice} onChange={(v) => set("minPrice", v)} placeholder="e.g. 24000" error={!!errors.minPrice} />
            </Field>
            <Field label="Maximum price (₹)" error={errors.maxPrice}>
              <Input type="number" value={form.maxPrice} onChange={(v) => set("maxPrice", v)} placeholder="e.g. 30000" error={!!errors.maxPrice} />
            </Field>
          </div>
        )}
      </Section>

      <div className="sticky bottom-4">
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Posting shipment…" : "Post Shipment"}
        </Button>
      </div>
    </form>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <Icon className="h-4 w-4 text-skyline-500" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-800">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>}
    </label>
  );
}

function inputClass(error: boolean) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors ${
    error ? "border-rose-400 focus:border-rose-500" : "border-surface-border focus:border-skyline-400"
  }`;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      className={inputClass(!!error)}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      min={type === "number" ? 0 : undefined}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  error?: boolean;
}) {
  return (
    <select className={inputClass(!!error)} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-surface-border text-navy-700 focus:ring-skyline-400"
      />
      {label}
    </label>
  );
}

function PricingTypeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-navy-700 bg-navy-700 text-white shadow-soft"
          : "border-surface-border bg-white text-neutral-600 hover:bg-surface-muted"
      }`}
    >
      {label}
    </button>
  );
}
