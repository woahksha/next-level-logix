"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, CheckCircle2, Pencil, Gauge } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { useTransporter } from "@/hooks/useTransporter";
import { calculateMatchProbability } from "@/lib/pricing";
import type { ShipmentListing } from "@/types/transporter";

const COMPETITIVENESS_STYLE: Record<string, string> = {
  "Excellent match": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Competitive: "border-skyline-200 bg-skyline-50 text-skyline-700",
  "Below recommended range": "border-amber-200 bg-amber-50 text-amber-700",
  "Above competitive range": "border-rose-200 bg-rose-50 text-rose-700",
};

// Rough mock profit projection: bid amount minus estimated fuel cost and a
// flat toll/misc allowance scaled by distance.
function estimateProfit(bidAmount: number, shipment: ShipmentListing) {
  const tollEstimate = Math.round(shipment.distanceKm * 3);
  return bidAmount - shipment.fuelEstimateINR - tollEstimate;
}

// Mock empty-km projection: backhaul-matched loads have little/no empty
// running since they fill an existing return leg; others assume ~35% of
// the outbound distance is run empty before/after this shipment.
function estimateEmptyKm(shipment: ShipmentListing) {
  return shipment.isBackhaulMatch ? Math.round(shipment.distanceKm * 0.06) : Math.round(shipment.distanceKm * 0.35);
}

export function BidForm({ shipment }: { shipment: ShipmentListing }) {
  const router = useRouter();
  const { bids, placeBid, modifyBid, withdrawBid } = useTransporter();
  const existingBid = bids.find((b) => b.shipmentId === shipment.id && b.status !== "REJECTED" && b.status !== "EXPIRED");

  const [amount, setAmount] = useState(String(existingBid?.bidAmount ?? shipment.recommendedRate));
  const [submitted, setSubmitted] = useState(Boolean(existingBid));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);
  const [pending, setPending] = useState(false);

  const profit = estimateProfit(Number(amount) || 0, shipment);
  const emptyKm = estimateEmptyKm(shipment);

  // Live, rule-based match probability + competitiveness label — recalculated
  // on every keystroke against the Logix AI Estimate (falls back to the
  // shipment's own min/recommended/max if no AI estimate is available).
  const competitiveness = useMemo(() => {
    const aiRange = shipment.aiEstimate ?? {
      minRate: shipment.minRate,
      recommendedRate: shipment.recommendedRate,
      maxRate: shipment.maxRate,
    };
    return calculateMatchProbability(Number(amount) || 0, aiRange);
  }, [amount, shipment]);

  function validate(value: number): string | null {
    if (!value || Number.isNaN(value) || value <= 0) {
      return "Enter a bid amount.";
    }
    if (value < shipment.minRate || value > shipment.maxRate) {
      return `Bid must be between ${formatINR(shipment.minRate)} and ${formatINR(shipment.maxRate)}.`;
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Guard against accidental duplicate bids: if a non-rejected/expired
    // bid already exists for this shipment and we're not explicitly
    // editing it, treat this as a no-op rather than creating a second one.
    if (existingBid && !editing) {
      setSubmitted(true);
      setEditing(false);
      return;
    }

    setPending(true);
    const action = existingBid ? modifyBid(existingBid.id, value) : placeBid(shipment.id, value);
    action.then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error ?? "Could not submit your bid.");
        return;
      }
      setError(null);
      setSubmitted(true);
      setJustPlaced(true);
      setEditing(false);
    });
  }

  function handleWithdraw() {
    if (!existingBid) return;
    setPending(true);
    withdrawBid(existingBid.id).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error ?? "Could not withdraw your bid.");
        return;
      }
      setSubmitted(false);
      setJustPlaced(false);
      setAmount(String(shipment.recommendedRate));
    });
  }

  if (submitted && !editing) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h3 className="mt-2 text-base font-bold text-navy-800">
          {justPlaced ? "Bid submitted" : "You already have a bid on this load"}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          Your bid of {formatINR(Number(amount))} has been sent to {shipment.shipperCompany}.
        </p>
        <div
          className={`mx-auto mt-4 flex max-w-xs items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
            COMPETITIVENESS_STYLE[competitiveness.label]
          }`}
        >
          <Gauge className="h-3.5 w-3.5" />
          {competitiveness.label} — {competitiveness.matchProbability}% match
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-emerald-200 bg-white p-3 text-left text-xs">
          <div>
            <p className="text-neutral-400">Estimated profit</p>
            <p className="font-bold text-navy-800">{formatINR(profit)}</p>
          </div>
          <div>
            <p className="text-neutral-400">Estimated empty km</p>
            <p className="font-bold text-navy-800">{emptyKm} km</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Modify bid
          </Button>
          <Button variant="outline" onClick={handleWithdraw} disabled={pending}>
            Cancel bid
          </Button>
          <Button onClick={() => router.push("/transporter/dashboard/bids")}>
            View active bids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-navy-700" />
        <h3 className="text-base font-bold text-navy-800">{editing ? "Modify your bid" : "Place your bid"}</h3>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Allowed range: {formatINR(shipment.minRate)}–{formatINR(shipment.maxRate)}
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Your bid (₹)</span>
        <input
          type="number"
          min={shipment.minRate}
          max={shipment.maxRate}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors ${
            error ? "border-rose-400 focus:border-rose-500" : "border-surface-border focus:border-skyline-400"
          }`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError(null);
          }}
        />
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-600">{error}</p>}
      </label>

      <div
        className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
          COMPETITIVENESS_STYLE[competitiveness.label]
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5" />
          {competitiveness.label}
        </span>
        <span>Match probability: {competitiveness.matchProbability}%</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <button
          type="button"
          onClick={() => setAmount(String(shipment.minRate))}
          className="rounded-lg border border-surface-border py-1.5 font-medium text-neutral-600 hover:bg-surface-muted"
        >
          Min {formatINR(shipment.minRate)}
        </button>
        <button
          type="button"
          onClick={() => setAmount(String(shipment.recommendedRate))}
          className="rounded-lg border border-skyline-200 bg-skyline-50 py-1.5 font-medium text-skyline-700 hover:bg-skyline-100"
        >
          Recommended
        </button>
        <button
          type="button"
          onClick={() => setAmount(String(shipment.maxRate))}
          className="rounded-lg border border-surface-border py-1.5 font-medium text-neutral-600 hover:bg-surface-muted"
        >
          Max {formatINR(shipment.maxRate)}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-3 text-xs">
        <div>
          <p className="text-neutral-500">Estimated profit</p>
          <p className={`text-sm font-bold ${profit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {formatINR(profit)}
          </p>
        </div>
        <div>
          <p className="text-neutral-500">Estimated empty km</p>
          <p className="text-sm font-bold text-navy-800">{emptyKm} km</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {editing && (
          <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" size="lg" disabled={pending}>
          {editing ? "Save changes" : pending ? "Submitting…" : "Submit bid"}
        </Button>
      </div>
    </form>
  );
}
