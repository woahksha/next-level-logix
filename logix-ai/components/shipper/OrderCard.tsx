import Link from "next/link";
import { MapPin, Route, Package, Gavel, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import { statusTone, statusLabel } from "@/components/shipper/status";
import type { OrderSummary } from "@/types/shipper";

export function OrderCard({ order }: { order: OrderSummary }) {
  const price = order.acceptedBidAmount ?? order.proposedRate;

  return (
    <Link
      href={`/shipper/orders/${order.id}`}
      className="block rounded-2xl border border-surface-border bg-white p-5 shadow-soft transition-shadow hover:shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-navy-800">
          <MapPin className="h-4 w-4 text-skyline-500" />
          {order.pickupLocation}
          <Route className="h-3.5 w-3.5 text-neutral-400" />
          {order.dropLocation}
        </div>
        <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-600 sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5 text-neutral-400" />
          {order.distanceKm} km
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-neutral-400" />
          {order.productType}
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-neutral-400" />
          {order.acceptedTransporter ? order.acceptedTransporter.vehicleNumber : order.truckTypeRequired}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          Due {new Date(order.deliveryDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
        <div>
          <p className="text-xs text-neutral-500">{order.acceptedBidAmount ? "Accepted price" : "Asking price"}</p>
          <p className="text-lg font-extrabold text-navy-800">{formatINR(price)}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Gavel className="h-3.5 w-3.5" />
          {order.bidCount} bid{order.bidCount === 1 ? "" : "s"}
        </div>
        {order.acceptedTransporter ? (
          <p className="text-xs font-semibold text-navy-800">{order.acceptedTransporter.name}</p>
        ) : (
          <span className="text-sm font-semibold text-skyline-600">View & compare bids →</span>
        )}
      </div>
    </Link>
  );
}
