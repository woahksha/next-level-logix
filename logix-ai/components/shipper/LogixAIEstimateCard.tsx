import { Sparkles, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { PriceEstimate } from "@/lib/pricing";

const DEMAND_BADGE_STYLE: Record<PriceEstimate["demandLevel"], string> = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/**
 * Shows the shipper-facing "Logix AI Estimate" while posting a shipment.
 * Renders either the live rule-based estimate, or a prompt telling the
 * shipper what's still missing — never a broken/NaN state.
 */
export function LogixAIEstimateCard({
  estimate,
  missingMessage,
}: {
  estimate: PriceEstimate | null;
  missingMessage?: string;
}) {
  if (!estimate) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted p-5 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-neutral-300" />
        <p className="mt-2 text-sm font-medium text-neutral-500">
          {missingMessage ?? "Complete pickup, delivery, cargo and vehicle details to see your Logix AI Estimate."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-skyline-200 bg-gradient-to-br from-skyline-50 to-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyline-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-navy-800">Logix AI Estimate</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DEMAND_BADGE_STYLE[estimate.demandLevel]}`}
        >
          {estimate.demandLevel} demand
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/70 py-2">
          <p className="text-[11px] text-neutral-500">Minimum</p>
          <p className="text-sm font-bold text-navy-800">{formatINR(estimate.minRate)}</p>
        </div>
        <div className="rounded-xl bg-skyline-600 py-2 text-white">
          <p className="text-[11px] text-skyline-100">Recommended</p>
          <p className="text-sm font-bold">{formatINR(estimate.recommendedRate)}</p>
        </div>
        <div className="rounded-xl bg-white/70 py-2">
          <p className="text-[11px] text-neutral-500">Maximum</p>
          <p className="text-sm font-bold text-navy-800">{formatINR(estimate.maxRate)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-600">{estimate.explanation}</p>

      <div className="mt-3 flex items-center gap-1.5 border-t border-skyline-100 pt-3 text-xs text-neutral-500">
        <TrendingUp className="h-3.5 w-3.5 text-skyline-500" />
        ~₹{estimate.ratePerKm}/km base rate for this vehicle type
      </div>

      <p className="mt-3 text-[11px] italic text-neutral-400">
        Prototype estimate based on current rules and demo data.
      </p>
    </div>
  );
}
