import { Navigation, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatINR } from "@/lib/utils";
import type { PositioningRecommendation } from "@/services/demandService";

const DEMAND_TONE: Record<PositioningRecommendation["expectedDemand"], "danger" | "success" | "warning" | "neutral"> = {
  "VERY HIGH": "danger",
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "neutral",
};

/**
 * "Where should I position my truck?" — ranks the demo route set by
 * forecast demand and surfaces a plain-language recommendation per
 * route. Backed by services/demandService.ts's rule-based forecast.
 */
export function TruckPositioningCard({ recommendations }: { recommendations: PositioningRecommendation[] }) {
  const best = recommendations[0];

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
          <Navigation className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold text-navy-800">Where should I position my truck?</h2>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Ranked by expected demand over the next 7 days across nearby corridors.
      </p>

      <div className="mt-5 space-y-3">
        {recommendations.map((r, i) => (
          <div
            key={r.route}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
              i === 0 ? "border-skyline-300 bg-skyline-50" : "border-surface-border bg-white"
            )}
          >
            <div className="flex items-center gap-2">
              <MapPinned className={cn("h-4 w-4", i === 0 ? "text-skyline-600" : "text-neutral-400")} />
              <div>
                <p className="text-sm font-bold text-navy-800">{r.route}</p>
                <p className="mt-0.5 text-xs text-neutral-600">{r.recommendation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {r.potentialRate != null && (
                <div className="text-right">
                  <p className="text-[11px] text-neutral-400">Potential rate</p>
                  <p className="text-sm font-bold text-navy-800">{formatINR(r.potentialRate)}</p>
                </div>
              )}
              <Badge tone={DEMAND_TONE[r.expectedDemand]}>{r.expectedDemand}</Badge>
            </div>
          </div>
        ))}
      </div>

      {best && (
        <p className="mt-4 text-[11px] italic text-neutral-400">
          Simulated recommendation based on demo demand data — not yet connected to live bookings.
        </p>
      )}
    </div>
  );
}
