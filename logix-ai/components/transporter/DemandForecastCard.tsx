import { Compass, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatINR } from "@/lib/utils";
import type { RouteDemandForecast } from "@/services/demandService";

const DEMAND_TONE: Record<RouteDemandForecast["currentDemand"], "danger" | "success" | "warning" | "neutral"> = {
  "VERY HIGH": "danger",
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "neutral",
};

const BAR_COLOR: Record<RouteDemandForecast["currentDemand"], string> = {
  "VERY HIGH": "bg-rose-500",
  HIGH: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-neutral-300",
};

const DEMAND_SCORE: Record<RouteDemandForecast["currentDemand"], number> = {
  "VERY HIGH": 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

const TREND_ICON: Record<RouteDemandForecast["trend"], typeof ArrowUpRight> = {
  UP: ArrowUpRight,
  DOWN: ArrowDownRight,
  STABLE: Minus,
};

const TREND_COLOR: Record<RouteDemandForecast["trend"], string> = {
  UP: "text-emerald-600",
  DOWN: "text-rose-600",
  STABLE: "text-neutral-400",
};

/**
 * Shows current + 7-day-forward demand for a set of routes, backed by
 * services/demandService.ts's rule-based forecast. Every figure here is
 * demo/historical data — the card says so explicitly so it's never
 * mistaken for a live feed.
 */
export function DemandForecastCard({ forecasts }: { forecasts: RouteDemandForecast[] }) {
  const top = forecasts[0];

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
            <Compass className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold text-navy-800">Demand Forecast</h2>
        </div>
        <Badge tone="info">Simulated</Badge>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Current demand and a 7-day-forward outlook for these corridors, based on demo historical booking data.
      </p>

      <div className="mt-5 space-y-5">
        {forecasts.map((f) => {
          const TrendIcon = TREND_ICON[f.trend];
          return (
            <div key={f.route} className="rounded-xl border border-surface-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-navy-800">{f.route}</span>
                {f.potentialRate != null && (
                  <span className="text-xs font-semibold text-neutral-500">
                    ~{formatINR(f.potentialRate)} potential
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-neutral-400">Current</p>
                  <Badge tone={DEMAND_TONE[f.currentDemand]} className="mt-1">
                    {f.currentDemand}
                  </Badge>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400">Next 7 days</p>
                  <Badge tone={DEMAND_TONE[f.forecastDemand]} className="mt-1">
                    {f.forecastDemand}
                  </Badge>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400">Trend</p>
                  <span className={cn("mt-1 flex items-center gap-1 text-xs font-bold", TREND_COLOR[f.trend])}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {f.trend === "STABLE" ? "Stable" : `${f.trendPercent > 0 ? "+" : ""}${f.trendPercent}%`}
                  </span>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn("h-full rounded-full transition-all", BAR_COLOR[f.forecastDemand])}
                  style={{ width: `${DEMAND_SCORE[f.forecastDemand]}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-neutral-600">
                <span className="font-semibold text-navy-700">Reason:</span> {f.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {top && (
        <p className="mt-5 flex items-start gap-1.5 rounded-xl bg-skyline-50 p-3 text-xs font-medium text-skyline-800">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Demand is expected to be {top.forecastDemand.toLowerCase()} on the {top.route.replace("→", "–")} corridor
          over the next 7 days.
        </p>
      )}

      <p className="mt-3 text-[11px] italic text-neutral-400">
        Simulated forecast based on demo historical data — not yet connected to live bookings.
      </p>
    </div>
  );
}
