import { Sparkles, Route, Fuel, Truck, TrendingUp, RotateCcw, MapPin } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { ShipmentListing } from "@/types/transporter";

const demandReason: Record<ShipmentListing["demandLevel"], string> = {
  High: "Demand is high on this route and available truck capacity is limited.",
  Medium: "Demand is moderate on this route with balanced truck supply.",
  Low: "Demand is currently soft on this route — capacity is easy to find.",
};

export function AIPricingCard({ shipment }: { shipment: ShipmentListing }) {
  // Prefer the real rule-based estimate (lib/pricing.ts) where available;
  // fall back to the shipment's own numbers for older/mock data so this
  // card never breaks.
  const est = shipment.aiEstimate;
  const minRate = est?.minRate ?? shipment.minRate;
  const recommendedRate = est?.recommendedRate ?? shipment.recommendedRate;
  const maxRate = est?.maxRate ?? shipment.maxRate;
  const marketRatePerKm = est?.ratePerKm ?? Math.round(shipment.recommendedRate / shipment.distanceKm);
  const explanation = est?.explanation ?? demandReason[shipment.demandLevel];

  const factors = [
    { icon: Route, label: "Route demand", value: `${shipment.demandLevel} demand` },
    { icon: Fuel, label: "Fuel estimate", value: formatINR(shipment.fuelEstimateINR) },
    { icon: MapPin, label: "Distance", value: `${shipment.distanceKm} km` },
    { icon: Truck, label: "Truck capacity fit", value: shipment.truckTypeRequired },
    { icon: TrendingUp, label: "Current market rate", value: `~₹${marketRatePerKm}/km` },
    { icon: RotateCcw, label: "Return-load probability", value: `${shipment.returnLoadProbabilityPercent}%` },
  ];

  return (
    <div className="rounded-2xl border border-skyline-200 bg-gradient-to-br from-skyline-50 to-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyline-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-bold text-navy-800">Logix AI Estimate</h3>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/70 py-2">
          <p className="text-[11px] text-neutral-500">Minimum</p>
          <p className="text-sm font-bold text-navy-800">{formatINR(minRate)}</p>
        </div>
        <div className="rounded-xl bg-skyline-600 py-2 text-white">
          <p className="text-[11px] text-skyline-100">Recommended</p>
          <p className="text-sm font-bold">{formatINR(recommendedRate)}</p>
        </div>
        <div className="rounded-xl bg-white/70 py-2">
          <p className="text-[11px] text-neutral-500">Maximum</p>
          <p className="text-sm font-bold text-navy-800">{formatINR(maxRate)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-600">{explanation}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-skyline-100 pt-4">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-xs text-neutral-600">
            <f.icon className="h-3.5 w-3.5 shrink-0 text-skyline-500" />
            <div>
              <p className="text-[10px] text-neutral-400">{f.label}</p>
              <p className="font-semibold text-navy-800">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-skyline-100 pt-3 text-[11px] italic text-neutral-400">
        Prototype estimate based on current rules and demo data.
      </p>
    </div>
  );
}
