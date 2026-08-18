"use client";

import { useMemo, useState } from "react";
import { DemandForecastCard } from "@/components/transporter/DemandForecastCard";
import { TruckPositioningCard } from "@/components/transporter/TruckPositioningCard";
import { LeaveNowVsLaterCard } from "@/components/transporter/LeaveNowVsLaterCard";
import { useTransporter } from "@/hooks/useTransporter";
import {
  DEMAND_ROUTES,
  getRouteDemandForecast,
  getPositioningRecommendations,
  getLeaveNowVsLaterComparison,
} from "@/services/demandService";

export default function DemandForecastPage() {
  const { profile } = useTransporter();
  const truckType = profile?.vehicleType || "Open Truck";

  // All demand/forecast/positioning figures are recomputed on the client
  // from the same rule-based service, so route selection and the
  // "leave now vs later" widget always stay consistent with each other.
  const forecasts = useMemo(() => getRouteDemandForecast(DEMAND_ROUTES, new Date(), truckType), [truckType]);
  const positioning = useMemo(() => getPositioningRecommendations(DEMAND_ROUTES, new Date(), truckType), [truckType]);

  const [selectedRoute, setSelectedRoute] = useState<[string, string]>(DEMAND_ROUTES[0]);

  const leaveComparison = useMemo(
    () =>
      getLeaveNowVsLaterComparison({
        pickupCity: selectedRoute[0],
        dropCity: selectedRoute[1],
        truckType,
      }),
    [selectedRoute, truckType]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Demand Forecast</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Plan your next move using predicted demand across nearby routes.
        </p>
      </div>

      <DemandForecastCard forecasts={forecasts} />

      <TruckPositioningCard recommendations={positioning} />

      <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold text-neutral-600">Compare leave-now vs. leave-later for a route</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMAND_ROUTES.map((route) => {
            const active = route[0] === selectedRoute[0] && route[1] === selectedRoute[1];
            return (
              <button
                key={route.join("-")}
                type="button"
                onClick={() => setSelectedRoute(route)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-navy-700 bg-navy-700 text-white"
                    : "border-surface-border bg-white text-neutral-600 hover:bg-surface-muted"
                }`}
              >
                {route[0]} → {route[1]}
              </button>
            );
          })}
        </div>
      </div>

      <LeaveNowVsLaterCard comparison={leaveComparison} />
    </div>
  );
}
