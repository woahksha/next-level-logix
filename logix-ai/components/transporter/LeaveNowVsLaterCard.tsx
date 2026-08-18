import { Zap, Hourglass, Sparkles, Fuel, Clock, Wallet, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatINR } from "@/lib/utils";
import type { LeaveNowVsLaterOutcome, LeaveOptionEstimate, ForecastDemandLevel } from "@/services/demandService";

const DEMAND_TONE: Record<ForecastDemandLevel, "danger" | "success" | "warning" | "neutral"> = {
  "VERY HIGH": "danger",
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "neutral",
};

function OptionColumn({
  option,
  isWinner,
}: {
  option: LeaveOptionEstimate;
  isWinner: boolean;
}) {
  const isNow = option.label === "Leave now";
  const Icon = isNow ? Zap : Hourglass;

  return (
    <div
      className={cn(
        "relative flex-1 rounded-2xl border-2 p-5 transition-all",
        isWinner ? "border-skyline-400 bg-gradient-to-br from-skyline-50 to-white shadow-soft" : "border-surface-border bg-white"
      )}
    >
      {isWinner && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-skyline-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">
          Recommended
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className={cn("flex items-center gap-1.5", isNow ? "text-navy-700" : "text-amber-700")}>
          <Icon className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">{option.label}</span>
        </div>
        <Badge tone={DEMAND_TONE[option.estimatedDemand]}>{option.estimatedDemand}</Badge>
      </div>

      <p className="mt-3 text-[11px] text-neutral-400">Estimated revenue</p>
      <p className="text-2xl font-extrabold text-navy-800">{formatINR(option.revenue)}</p>

      <p className="mt-2 text-[11px] text-neutral-400">Estimated profit</p>
      <p className={cn("text-lg font-bold", option.profit >= 0 ? "text-emerald-700" : "text-rose-600")}>
        {formatINR(option.profit)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-surface-border pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          {option.travelTimeHours}h travel
        </div>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Fuel className="h-3.5 w-3.5 text-neutral-400" />
          {formatINR(option.fuelCost)} fuel
        </div>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Wallet className="h-3.5 w-3.5 text-neutral-400" />
          {formatINR(option.tollCost)} toll
        </div>
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Hourglass className="h-3.5 w-3.5 text-neutral-400" />
          {option.waitingCost > 0 ? `${formatINR(option.waitingCost)} waiting` : "No wait"}
        </div>
      </div>
    </div>
  );
}

/**
 * "When should you leave?" — Leave Now vs. Leave Tomorrow 7 AM,
 * backed by services/demandService.ts's getLeaveNowVsLaterComparison().
 * This is a decision-support prototype, not a real routing engine —
 * every number is a transparent rule-of-thumb estimate.
 */
export function LeaveNowVsLaterCard({ comparison }: { comparison: LeaveNowVsLaterOutcome }) {
  if (!comparison.ok) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-surface-muted p-5 text-center">
        <Hourglass className="mx-auto h-5 w-5 text-neutral-300" />
        <p className="mt-2 text-sm font-medium text-neutral-500">{comparison.reason}</p>
      </div>
    );
  }

  const winner = comparison.recommendedOption === "now" ? comparison.now : comparison.later;

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyline-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-navy-800">When should you leave?</h3>
        </div>
        <Badge tone="info">{comparison.route}</Badge>
      </div>
      <p className="mt-1 text-xs text-neutral-500">A decision-support estimate — not a real routing engine.</p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <OptionColumn option={comparison.now} isWinner={comparison.recommendedOption === "now"} />
        <OptionColumn option={comparison.later} isWinner={comparison.recommendedOption === "later"} />
      </div>

      <div className="mt-5 rounded-xl bg-navy-800 p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-skyline-300" />
            <div>
              <p className="text-[11px] text-skyline-200">Recommendation</p>
              <p className="text-sm font-bold">{winner.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-skyline-200">Additional estimated profit</p>
            <p className="text-lg font-extrabold">{formatINR(comparison.additionalProfit)}</p>
          </div>
        </div>
        <p className="mt-3 border-t border-white/10 pt-3 text-xs text-skyline-100">{comparison.explanation}</p>
      </div>

      <p className="mt-3 text-[11px] italic text-neutral-400">{comparison.disclaimer}</p>
    </div>
  );
}
