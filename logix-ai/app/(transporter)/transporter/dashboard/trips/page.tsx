"use client";

import { Route as RouteIcon, Fuel, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MOCK_TRIPS } from "@/data/transporter-mock";
import { formatINR } from "@/lib/utils";

export default function MyTripsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">My Trips</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {MOCK_TRIPS.length} completed trips, most recent first.
        </p>
      </div>

      <div className="grid gap-4">
        {MOCK_TRIPS.map((trip) => (
          <div key={trip.id} className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-navy-800">
                <RouteIcon className="h-4 w-4 text-skyline-500" />
                {trip.route}
                {trip.wasBackhaul && <Badge tone="info">Backhaul trip</Badge>}
              </div>
              <span className="text-xs text-neutral-500">{trip.completedOn}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{trip.shipperCompany} · {trip.distanceKm} km</p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-border pt-4 text-xs sm:grid-cols-4">
              <div>
                <p className="flex items-center gap-1 text-neutral-400"><Wallet className="h-3 w-3" /> Earnings</p>
                <p className="mt-0.5 font-bold text-navy-800">{formatINR(trip.earningsINR)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-neutral-400"><Fuel className="h-3 w-3" /> Fuel</p>
                <p className="mt-0.5 font-semibold text-neutral-600">{formatINR(trip.fuelCostINR)}</p>
              </div>
              <div>
                <p className="text-neutral-400">Toll</p>
                <p className="mt-0.5 font-semibold text-neutral-600">{formatINR(trip.tollCostINR)}</p>
              </div>
              <div>
                <p className="text-neutral-400">Net profit</p>
                <p className="mt-0.5 font-bold text-emerald-700">{formatINR(trip.netProfitINR)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
