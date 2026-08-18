"use client";

import { useState } from "react";
import { Star, Truck, Weight, ShieldCheck, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { MATCH_FACTOR_LABELS_ORDER } from "@/components/shipper/matchFactorOrder";
import type { RecommendedTransporter } from "@/types/shipper";

function scoreRingColor(score: number) {
  if (score >= 85) return "text-emerald-600 border-emerald-200 bg-emerald-50";
  if (score >= 65) return "text-skyline-600 border-skyline-200 bg-skyline-50";
  if (score >= 40) return "text-amber-600 border-amber-200 bg-amber-50";
  return "text-rose-600 border-rose-200 bg-rose-50";
}

function barColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 55) return "bg-skyline-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-rose-400";
}

export function TransporterRecommendationCard({
  recommendation,
  rank,
  orderIsPending,
  onSelect,
}: {
  recommendation: RecommendedTransporter;
  rank: number;
  orderIsPending: boolean;
  onSelect: (bidId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const { name, vehicleType, vehicleCapacityTons, rating, totalTrips, kycStatus, bidAmount, matchScore, reasons, factors } =
    recommendation;

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
              {rank}
            </span>
            <p className="text-base font-bold text-navy-800">{name}</p>
            {kycStatus === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)} rating · {totalTrips} trips completed
          </span>
        </div>

        <div className={`flex flex-col items-center rounded-xl border px-4 py-2 ${scoreRingColor(matchScore)}`}>
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide">
            <Sparkles className="h-3 w-3" />
            AI Match
          </span>
          <span className="text-2xl font-extrabold leading-tight">{matchScore}%</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-border pt-4 text-xs text-neutral-600 sm:grid-cols-3">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-neutral-400" />
          {vehicleType}
        </div>
        <div className="flex items-center gap-1.5">
          <Weight className="h-3.5 w-3.5 text-neutral-400" />
          {vehicleCapacityTons} T capacity
        </div>
        {bidAmount != null && (
          <div className="font-semibold text-navy-800">{formatINR(bidAmount)} bid</div>
        )}
      </div>

      {reasons.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-1.5 border-t border-surface-border pt-4 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
        {bidAmount != null ? (
          <div>
            <p className="text-xs text-neutral-500">Bid amount</p>
            <p className="text-xl font-extrabold text-navy-800">{formatINR(bidAmount)}</p>
          </div>
        ) : (
          <div />
        )}
        {orderIsPending && recommendation.bidId && (
          <Button
            size="sm"
            disabled={selecting}
            onClick={async () => {
              setSelecting(true);
              await onSelect(recommendation.bidId as string);
              setSelecting(false);
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {selecting ? "Selecting…" : "Select Transporter"}
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex w-full items-center justify-between border-t border-surface-border pt-3 text-left text-xs font-semibold text-navy-700"
      >
        Why was this transporter recommended?
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {MATCH_FACTOR_LABELS_ORDER.map((key) => {
            const factor = factors[key];
            if (!factor) return null;
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy-800">{factor.label}</span>
                  <span className="text-neutral-500">
                    {factor.isNeutral ? "Neutral" : `${factor.score}%`}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${factor.isNeutral ? "bg-neutral-300" : barColor(factor.score)}`}
                    style={{ width: `${Math.max(factor.score, 4)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">{factor.detail}</p>
              </div>
            );
          })}
          <p className="pt-1 text-[11px] italic text-neutral-400">
            Prototype recommendation based on configurable matching rules and available transporter data.
          </p>
        </div>
      )}
    </div>
  );
}
