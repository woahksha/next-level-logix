"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Truck,
  Wallet,
  Route,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  INDIAN_CITIES,
  INDIAN_STATES,
  LANGUAGE_OPTIONS,
  VEHICLE_CATEGORY_OPTIONS,
} from "@/data/transporter-mock";
import { useTransporter } from "@/hooks/useTransporter";
import { cn } from "@/lib/utils";
import type { DocStatus, PreferredRoute, TransporterProfileData } from "@/types/transporter";

const STEPS = [
  { key: "personal", label: "Personal Details", icon: User },
  { key: "kyc", label: "Licence & KYC", icon: ShieldCheck },
  { key: "vehicle", label: "Vehicle Details", icon: Truck },
  { key: "payment", label: "Payment Details", icon: Wallet },
  { key: "preferences", label: "Preferences", icon: Route },
] as const;

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  preferredLanguage: string;

  drivingLicenseNumber: string;
  licenceUploadStatus: DocStatus;
  panNumber: string;
  aadhaarStatus: DocStatus;

  vehicleNumber: string;
  vehicleCategory: string;
  vehicleCapacityTons: string;
  vehicleDimensions: string;
  currentLocation: string;
  preferredOperatingArea: string;

  bankAccountNumberMasked: string;
  ifsc: string;
  upiId: string;
  preferredPaymentMethod: "UPI" | "Bank Transfer";

  maxAdditionalDistanceKm: string;
  preferredRadiusKm: string;
  preferredRoutes: PreferredRoute[];
  preferredCities: string[];
  minAcceptablePaymentINR: string;
}

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: INDIAN_CITIES[0],
  state: INDIAN_STATES[0],
  pincode: "",
  preferredLanguage: LANGUAGE_OPTIONS[0],

  drivingLicenseNumber: "",
  licenceUploadStatus: "NOT_SUBMITTED",
  panNumber: "",
  aadhaarStatus: "NOT_SUBMITTED",

  vehicleNumber: "",
  vehicleCategory: VEHICLE_CATEGORY_OPTIONS[2],
  vehicleCapacityTons: "",
  vehicleDimensions: "",
  currentLocation: INDIAN_CITIES[0],
  preferredOperatingArea: "",

  bankAccountNumberMasked: "",
  ifsc: "",
  upiId: "",
  preferredPaymentMethod: "UPI",

  maxAdditionalDistanceKm: "50",
  preferredRadiusKm: "100",
  preferredRoutes: [],
  preferredCities: [],
  minAcceptablePaymentINR: "5000",
};

function inputClasses(hasError?: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors placeholder:text-neutral-400",
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-surface-border focus:border-skyline-400"
  );
}

const docStatusTone: Record<DocStatus, "success" | "warning" | "neutral"> = {
  VERIFIED: "success",
  PENDING: "warning",
  NOT_SUBMITTED: "neutral",
};

const docStatusLabel: Record<DocStatus, string> = {
  VERIFIED: "Verified",
  PENDING: "Pending review",
  NOT_SUBMITTED: "Not submitted",
};

export function OnboardingWizard() {
  const router = useRouter();
  const { completeOnboarding } = useTransporter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [routeFrom, setRouteFrom] = useState<string>(INDIAN_CITIES[0]);
  const [routeTo, setRouteTo] = useState<string>(INDIAN_CITIES[1]);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function simulateUpload(field: "licenceUploadStatus" | "aadhaarStatus") {
    // Prototype-only: mock document upload -> pending -> verified after a beat.
    update(field, "PENDING");
    setTimeout(() => update(field, "VERIFIED"), 900);
  }

  function toggleCity(city: string) {
    setForm((prev) => ({
      ...prev,
      preferredCities: prev.preferredCities.includes(city)
        ? prev.preferredCities.filter((c) => c !== city)
        : [...prev.preferredCities, city],
    }));
  }

  function addRoute() {
    if (!routeFrom || !routeTo || (routeFrom as string) === (routeTo as string)) return;
    if (form.preferredRoutes.some((r) => r.from === routeFrom && r.to === routeTo)) return;
    update("preferredRoutes", [...form.preferredRoutes, { from: routeFrom, to: routeTo }]);
  }

  function removeRoute(idx: number) {
    update(
      "preferredRoutes",
      form.preferredRoutes.filter((_, i) => i !== idx)
    );
  }

  function validateStep(): boolean {
    setError(null);
    if (step.key === "personal") {
      if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.pincode.trim()) {
        setError("Please fill in your name, contact details, and address.");
        return false;
      }
    }
    if (step.key === "kyc") {
      if (!form.drivingLicenseNumber.trim() || !form.panNumber.trim()) {
        setError("Please enter your driving licence number and PAN.");
        return false;
      }
    }
    if (step.key === "vehicle") {
      if (!form.vehicleNumber.trim() || !form.vehicleCapacityTons.trim()) {
        setError("Please enter your vehicle number and capacity.");
        return false;
      }
    }
    if (step.key === "payment") {
      if (form.preferredPaymentMethod === "UPI" && !form.upiId.trim()) {
        setError("Please enter your UPI ID, or switch to bank transfer.");
        return false;
      }
      if (form.preferredPaymentMethod === "Bank Transfer" && (!form.bankAccountNumberMasked.trim() || !form.ifsc.trim())) {
        setError("Please enter your bank account number and IFSC code.");
        return false;
      }
    }
    return true;
  }

  function buildProfile(): TransporterProfileData {
    return {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,

      drivingLicenseNumber: form.drivingLicenseNumber,
      licenceUploadStatus: form.licenceUploadStatus === "NOT_SUBMITTED" ? "VERIFIED" : form.licenceUploadStatus,
      panNumber: form.panNumber,
      aadhaarStatus: form.aadhaarStatus === "NOT_SUBMITTED" ? "VERIFIED" : form.aadhaarStatus,
      kycStatus: "VERIFIED", // instant mock verification for the demo

      vehicleType: form.vehicleCategory,
      vehicleCategory: form.vehicleCategory,
      vehicleNumber: form.vehicleNumber,
      vehicleCapacityTons: Number(form.vehicleCapacityTons) || 0,
      vehicleDimensions: form.vehicleDimensions || "Not specified",
      currentLocation: form.currentLocation,
      preferredOperatingArea: form.preferredOperatingArea || `${form.currentLocation} region`,

      bankAccountNumberMasked: form.bankAccountNumberMasked
        ? `XXXX XXXX ${form.bankAccountNumberMasked.slice(-4)}`
        : "Not provided",
      ifsc: form.ifsc || "Not provided",
      upiId: form.upiId || "Not provided",
      preferredPaymentMethod: form.preferredPaymentMethod,

      preferredLanguage: form.preferredLanguage,
      preferredRadiusKm: Number(form.preferredRadiusKm) || 0,
      maxAdditionalDistanceKm: Number(form.maxAdditionalDistanceKm) || 0,
      preferredRoutes: form.preferredRoutes,
      preferredCities: form.preferredCities,
      minAcceptablePaymentINR: Number(form.minAcceptablePaymentINR) || 0,

      preferredRouteFrom: form.preferredRoutes[0]?.from ?? "",
      preferredRouteTo: form.preferredRoutes[0]?.to ?? "",

      rating: 0,
      totalTrips: 0,
      memberSince: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    };
  }

  async function handleNext() {
    if (!validateStep()) return;
    if (isLastStep) {
      await completeOnboarding(buildProfile());
      router.push("/transporter/dashboard");
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function handleBack() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <ol className="mb-8 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  i < stepIndex
                    ? "border-skyline-500 bg-skyline-500 text-white"
                    : i === stepIndex
                    ? "border-skyline-500 text-skyline-600"
                    : "border-neutral-200 text-neutral-400"
                )}
              >
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  i <= stepIndex ? "text-navy-800" : "text-neutral-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  i < stepIndex ? "bg-skyline-500" : "bg-neutral-200"
                )}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
            <step.icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-navy-800">{step.label}</h2>
            {step.key === "preferences" && (
              <p className="text-xs text-neutral-500">Optional — improves matching, doesn&apos;t restrict what you see.</p>
            )}
          </div>
        </div>

        {step.key === "personal" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <input
                className={inputClasses()}
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field label="Mobile number">
              <input
                className={inputClasses()}
                placeholder="98100 00001"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputClasses()}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input
                className={inputClasses()}
                placeholder="House / street / area"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
            <Field label="City">
              <select className={inputClasses()} value={form.city} onChange={(e) => update("city", e.target.value)}>
                {INDIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="State">
              <select className={inputClasses()} value={form.state} onChange={(e) => update("state", e.target.value)}>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Pincode">
              <input
                className={inputClasses()}
                placeholder="e.g. 110045"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
              />
            </Field>
            <Field label="Preferred / native language">
              <select
                className={inputClasses()}
                value={form.preferredLanguage}
                onChange={(e) => update("preferredLanguage", e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {step.key === "kyc" && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Driving licence number">
                <input
                  className={inputClasses()}
                  placeholder="e.g. DL-0120230001"
                  value={form.drivingLicenseNumber}
                  onChange={(e) => update("drivingLicenseNumber", e.target.value)}
                />
              </Field>
              <Field label="PAN number">
                <input
                  className={inputClasses()}
                  placeholder="e.g. ABCDE1234F"
                  value={form.panNumber}
                  onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
                />
              </Field>
            </div>

            <UploadRow
              title="Driving licence upload"
              status={form.licenceUploadStatus}
              onUpload={() => simulateUpload("licenceUploadStatus")}
            />
            <UploadRow
              title="Aadhaar / KYC verification"
              status={form.aadhaarStatus}
              onUpload={() => simulateUpload("aadhaarStatus")}
            />
          </div>
        )}

        {step.key === "vehicle" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle registration number">
              <input
                className={inputClasses()}
                placeholder="e.g. DL01AB1234"
                value={form.vehicleNumber}
                onChange={(e) => update("vehicleNumber", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Truck category">
              <select
                className={inputClasses()}
                value={form.vehicleCategory}
                onChange={(e) => update("vehicleCategory", e.target.value)}
              >
                {VEHICLE_CATEGORY_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Maximum load capacity (tons)">
              <input
                type="number"
                min={0}
                className={inputClasses()}
                placeholder="e.g. 9"
                value={form.vehicleCapacityTons}
                onChange={(e) => update("vehicleCapacityTons", e.target.value)}
              />
            </Field>
            <Field label="Vehicle dimensions (optional)">
              <input
                className={inputClasses()}
                placeholder="e.g. 20 ft x 7 ft x 7 ft"
                value={form.vehicleDimensions}
                onChange={(e) => update("vehicleDimensions", e.target.value)}
              />
            </Field>
            <Field label="Current location">
              <select
                className={inputClasses()}
                value={form.currentLocation}
                onChange={(e) => update("currentLocation", e.target.value)}
              >
                {INDIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred operating area">
              <input
                className={inputClasses()}
                placeholder="e.g. Delhi NCR & North India"
                value={form.preferredOperatingArea}
                onChange={(e) => update("preferredOperatingArea", e.target.value)}
              />
            </Field>
          </div>
        )}

        {step.key === "payment" && (
          <div className="grid gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-neutral-600">Preferred payment method</p>
              <div className="grid grid-cols-2 gap-2">
                {(["UPI", "Bank Transfer"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => update("preferredPaymentMethod", method)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                      form.preferredPaymentMethod === method
                        ? "border-skyline-400 bg-skyline-50 text-skyline-700"
                        : "border-surface-border text-neutral-600 hover:bg-surface-muted"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {form.preferredPaymentMethod === "UPI" ? (
              <Field label="UPI ID">
                <input
                  className={inputClasses()}
                  placeholder="e.g. ramesh.kumar@okhdfcbank"
                  value={form.upiId}
                  onChange={(e) => update("upiId", e.target.value)}
                />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bank account number">
                  <input
                    className={inputClasses()}
                    placeholder="Enter account number"
                    value={form.bankAccountNumberMasked}
                    onChange={(e) => update("bankAccountNumberMasked", e.target.value)}
                  />
                </Field>
                <Field label="IFSC code">
                  <input
                    className={inputClasses()}
                    placeholder="e.g. HDFC0001234"
                    value={form.ifsc}
                    onChange={(e) => update("ifsc", e.target.value.toUpperCase())}
                  />
                </Field>
              </div>
            )}

            <div className="rounded-xl border border-dashed border-skyline-200 bg-skyline-50 p-4 text-xs text-skyline-800">
              For your security, account details are masked once saved. Logix AI settles payment
              digitally within 24–72 hours of proof-of-delivery, straight to this account.
            </div>
          </div>
        )}

        {step.key === "preferences" && (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Preferred operating radius: ${form.preferredRadiusKm} km`} className="sm:col-span-2">
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={form.preferredRadiusKm}
                  onChange={(e) => update("preferredRadiusKm", e.target.value)}
                  className="w-full accent-skyline-500"
                />
                <div className="mt-1 flex justify-between text-[11px] text-neutral-400">
                  <span>50 km</span>
                  <span>100 km</span>
                  <span>200 km</span>
                  <span>No limit</span>
                </div>
              </Field>
              <Field label="Max additional distance for a pickup (km)">
                <input
                  type="number"
                  min={0}
                  className={inputClasses()}
                  value={form.maxAdditionalDistanceKm}
                  onChange={(e) => update("maxAdditionalDistanceKm", e.target.value)}
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  e.g. &quot;I am willing to travel up to {form.maxAdditionalDistanceKm || 0} km for a suitable load.&quot;
                </p>
              </Field>
              <Field label="Minimum acceptable payment (₹)">
                <input
                  type="number"
                  min={0}
                  className={inputClasses()}
                  value={form.minAcceptablePaymentINR}
                  onChange={(e) => update("minAcceptablePaymentINR", e.target.value)}
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-neutral-600">Preferred routes (optional, multiple allowed)</p>
              <div className="flex flex-wrap items-center gap-2">
                <select className={cn(inputClasses(), "w-auto")} value={routeFrom} onChange={(e) => setRouteFrom(e.target.value as string)}>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
                <select className={cn(inputClasses(), "w-auto")} value={routeTo} onChange={(e) => setRouteTo(e.target.value as string)}>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  type="button"
                  onClick={addRoute}
                  className="inline-flex items-center gap-1 rounded-xl border border-skyline-200 bg-skyline-50 px-3 py-2 text-xs font-semibold text-skyline-700 hover:bg-skyline-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add route
                </button>
              </div>
              {form.preferredRoutes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.preferredRoutes.map((r, i) => (
                    <span key={`${r.from}-${r.to}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-muted px-3 py-1 text-xs font-medium text-navy-800">
                      {r.from} → {r.to}
                      <button type="button" onClick={() => removeRoute(i)} className="text-neutral-400 hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-neutral-600">Preferred cities / states</p>
              <div className="flex flex-wrap gap-2">
                {INDIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      form.preferredCities.includes(city)
                        ? "border-skyline-400 bg-skyline-50 text-skyline-700"
                        : "border-surface-border text-neutral-600 hover:bg-surface-muted"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              These preferences improve matching but never prevent you from viewing or bidding on other opportunities.
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0} type="button">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {step.key === "preferences" && (
              <button
                type="button"
                onClick={async () => {
                  await completeOnboarding(buildProfile());
                  router.push("/transporter/dashboard");
                }}
                className="text-sm font-semibold text-neutral-500 hover:text-navy-700"
              >
                Skip for now
              </button>
            )}
            <Button onClick={handleNext} type="button">
              {isLastStep ? "Finish & go to dashboard" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadRow({
  title,
  status,
  onUpload,
}: {
  title: string;
  status: DocStatus;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-surface-border bg-surface-muted p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-500">
          <UploadCloud className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-navy-800">{title}</p>
          <p className="text-[11px] text-neutral-400">Simulated upload for this prototype</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={docStatusTone[status]}>{docStatusLabel[status]}</Badge>
        {status !== "VERIFIED" && (
          <button
            type="button"
            onClick={onUpload}
            className="rounded-lg border border-surface-border bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
          >
            {status === "PENDING" ? "Verifying…" : "Upload"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
