"use client";

import { useState } from "react";
import { ShieldCheck, Truck, Languages, MapPinned, Star, Wallet, Pencil, Check, X, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { Button } from "@/components/ui/Button";
import { useTransporter } from "@/hooks/useTransporter";
import { LANGUAGE_OPTIONS, MOCK_REVIEWS } from "@/data/transporter-mock";
import type { DocStatus } from "@/types/transporter";

const docTone: Record<DocStatus, "success" | "warning" | "neutral"> = {
  VERIFIED: "success",
  PENDING: "warning",
  NOT_SUBMITTED: "neutral",
};

export default function TransporterProfilePage() {
  const { profile, updateProfile } = useTransporter();
  const [editing, setEditing] = useState(false);
  const [language, setLanguage] = useState(profile?.preferredLanguage ?? "");
  const [radius, setRadius] = useState(String(profile?.preferredRadiusKm ?? ""));
  const [minPayment, setMinPayment] = useState(String(profile?.minAcceptablePaymentINR ?? ""));
  const [operatingArea, setOperatingArea] = useState(profile?.preferredOperatingArea ?? "");

  if (!profile) return null;

  function startEdit() {
    setLanguage(profile!.preferredLanguage);
    setRadius(String(profile!.preferredRadiusKm));
    setMinPayment(String(profile!.minAcceptablePaymentINR));
    setOperatingArea(profile!.preferredOperatingArea);
    setEditing(true);
  }

  function save() {
    updateProfile({
      preferredLanguage: language,
      preferredRadiusKm: Number(radius) || 0,
      minAcceptablePaymentINR: Number(minPayment) || 0,
      preferredOperatingArea: operatingArea,
    });
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-800">Profile & Ratings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Your public profile, as shippers see it when reviewing your bids.
          </p>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit preferences
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button onClick={save}>
              <Check className="h-3.5 w-3.5" />
              Save changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-800">{profile.name}</h2>
                <p className="text-sm text-neutral-500">Member since {profile.memberSince}</p>
              </div>
              <Badge tone={profile.kycStatus === "VERIFIED" ? "success" : "warning"}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {profile.kycStatus === "VERIFIED" ? "Verified" : profile.kycStatus}
              </Badge>
            </div>

            <div className="mt-4">
              <RatingStars score={profile.rating || 0} size="md" />
              <p className="mt-1 text-xs text-neutral-500">{profile.totalTrips} trips completed</p>
            </div>

            <dl className="mt-6 space-y-3 border-t border-surface-border pt-5 text-sm">
              <Row icon={Truck} label="Vehicle" value={`${profile.vehicleCategory} · ${profile.vehicleNumber} · ${profile.vehicleCapacityTons}T`} />
              <Row icon={MapPinned} label="Base location" value={`${profile.city}, ${profile.state} — ${profile.pincode}`} />
              <Row icon={Languages} label="Preferred language" value={profile.preferredLanguage} />

              {editing ? (
                <div className="grid gap-3 rounded-xl bg-surface-muted p-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Preferred language</span>
                    <select
                      className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Preferred radius (km)</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Minimum acceptable payment (₹)</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm"
                      value={minPayment}
                      onChange={(e) => setMinPayment(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">Preferred operating area</span>
                    <input
                      className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm"
                      value={operatingArea}
                      onChange={(e) => setOperatingArea(e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <Row
                    icon={MapPinned}
                    label="Preferred routes"
                    value={
                      profile.preferredRoutes.length
                        ? profile.preferredRoutes.map((r) => `${r.from} → ${r.to}`).join(", ")
                        : `No preference set (${profile.preferredRadiusKm} km radius)`
                    }
                  />
                  <Row icon={Wallet} label="Min. acceptable payment" value={`₹${profile.minAcceptablePaymentINR.toLocaleString("en-IN")}`} />
                  <Row icon={MapPinned} label="Operating area" value={profile.preferredOperatingArea} />
                </>
              )}

              <Row icon={ShieldCheck} label="Driving licence" value={`${profile.drivingLicenseNumber} (${profile.licenceUploadStatus === "VERIFIED" ? "Verified" : profile.licenceUploadStatus})`} />
              <Row icon={FileText} label="PAN" value={profile.panNumber} />
              <Row icon={Wallet} label="Payout method" value={profile.preferredPaymentMethod === "UPI" ? profile.upiId : `${profile.bankAccountNumberMasked} (${profile.ifsc})`} />
            </dl>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <h3 className="text-sm font-bold text-navy-800">KYC & document status</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-surface-border p-3">
                <span className="text-xs font-medium text-neutral-600">Driving licence</span>
                <Badge tone={docTone[profile.licenceUploadStatus]}>{profile.licenceUploadStatus.replace("_", " ")}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-surface-border p-3">
                <span className="text-xs font-medium text-neutral-600">Aadhaar / KYC</span>
                <Badge tone={docTone[profile.aadhaarStatus]}>{profile.aadhaarStatus.replace("_", " ")}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-navy-800">Reviews from shippers</h2>
          </div>
          <div className="mt-4 space-y-4">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="border-b border-surface-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-800">{r.fromCompany}</p>
                  <RatingStars score={r.score} showScore={false} />
                </div>
                <p className="mt-1 text-sm text-neutral-600">{r.comment}</p>
                <p className="mt-1 text-xs text-neutral-400">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <dt className="text-xs text-neutral-500">{label}</dt>
        <dd className="font-medium text-navy-800">{value}</dd>
      </div>
    </div>
  );
}
