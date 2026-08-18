import Link from "next/link";
import { MapPin, Package, Truck, Weight, Clock, Route } from "lucide-react";
import type { ShipmentListing } from "@/types/transporter";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";

const demandTone = {
  High: "success",
  Medium: "warning",
  Low: "neutral",
} as const;

export function ShipmentCard({ shipment }: { shipment: ShipmentListing }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-navy-800">
          <MapPin className="h-4 w-4 text-skyline-500" />
          {shipment.pickupLocation}
          <Route className="h-3.5 w-3.5 text-neutral-400" />
          {shipment.dropLocation}
        </div>
        <div className="flex items-center gap-2">
          {shipment.isBackhaulMatch && <Badge tone="info">Backhaul match</Badge>}
          <Badge tone={demandTone[shipment.demandLevel]}>{shipment.demandLevel} demand</Badge>
        </div>
      </div>

      {shipment.backhaulNote && (
        <p className="mt-2 text-xs font-medium text-skyline-700">{shipment.backhaulNote}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5 text-neutral-400" />
          {shipment.distanceKm} km
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-neutral-400" />
          {shipment.productType}
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-neutral-400" />
          {shipment.truckTypeRequired}
        </div>
        <div className="flex items-center gap-1.5">
          <Weight className="h-3.5 w-3.5 text-neutral-400" />
          {(shipment.weightKg / 1000).toLocaleString("en-IN")} T
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
        <div>
          <p className="text-xs text-neutral-500">Recommended bid</p>
          <p className="text-lg font-extrabold text-navy-800">
            {formatINR(shipment.recommendedRate)}
          </p>
          <p className="text-[11px] text-neutral-400">
            Range {formatINR(shipment.minRate)} – {formatINR(shipment.maxRate)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Clock className="h-3.5 w-3.5" />
          {shipment.postedAgo}
        </div>
        <Link
          href={`/transporter/dashboard/shipments/${shipment.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-navy-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-navy-800"
        >
          View & Bid
        </Link>
      </div>
    </div>
  );
}
