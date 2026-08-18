"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  Weight,
  CalendarClock,
  Wallet,
  Gavel,
  Navigation,
  Phone,
  Snowflake,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import { statusTone, statusLabel } from "@/components/shipper/status";
import { BidCompareCard } from "@/components/shipper/BidCompareCard";
import { TransporterRecommendations } from "@/components/shipper/TransporterRecommendations";
import type { OrderDetail } from "@/types/shipper";

export default function ShipperOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [showTrackingNote, setShowTrackingNote] = useState(false);
  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${params.id}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setOrder(data.order);
  }, [params.id]);

  useEffect(() => {
    load().catch(() => setError("Could not load this order."));
  }, [load]);

  async function handleAccept(bidId: string) {
    setAcceptError(null);
    const res = await fetch(`/api/bids/${bidId}/accept`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setAcceptError(
        data.acceptedTransporter
          ? `This order already has an accepted transporter: ${data.acceptedTransporter.name}.`
          : data.error ?? "Could not accept this bid."
      );
      await load();
      return;
    }
    setRecommendationsRefreshKey((k) => k + 1);
    await load();
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center">
        <p className="text-sm font-medium text-neutral-600">Order not found.</p>
        <Link href="/shipper/orders" className="mt-3 inline-block text-sm font-semibold text-skyline-600 hover:text-skyline-700">
          Back to My Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-neutral-500">Loading order…</p>;
  }

  const sortedBids = [...order.bids].sort((a, b) => {
    if (a.status === "ACCEPTED") return -1;
    if (b.status === "ACCEPTED") return 1;
    return a.bidAmount - b.bidAmount;
  });

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/shipper/orders")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my orders
      </button>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
      {acceptError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{acceptError}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xl font-extrabold text-navy-800">
                <MapPin className="h-5 w-5 text-skyline-500" />
                {order.pickupLocation}
                <span className="text-neutral-300">→</span>
                {order.dropLocation}
              </div>
              <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
            </div>

            <p className="mt-2 text-xs text-neutral-500">Order #{order.id.slice(-6).toUpperCase()}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-surface-border pt-5 sm:grid-cols-4">
              <Detail icon={Navigation} label="Distance" value={`${order.distanceKm} km`} />
              <Detail icon={Package} label="Cargo type" value={order.productType} />
              <Detail icon={Truck} label="Truck required" value={order.truckTypeRequired} />
              <Detail icon={Weight} label="Load" value={`${(order.weightKg / 1000).toLocaleString("en-IN")} T`} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-surface-border pt-4 text-sm text-neutral-600 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neutral-400" />
                Pickup: <span className="font-semibold text-navy-800">{order.pickupAddress}, {order.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neutral-400" />
                Pickup time: <span className="font-semibold text-navy-800">{new Date(order.pickupDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-neutral-400" />
                Delivery: <span className="font-semibold text-navy-800">{order.dropAddress}, {order.dropLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neutral-400" />
                Deadline: <span className="font-semibold text-navy-800">{new Date(order.deliveryDeadline).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
              </div>
              {order.minCapacityTons && (
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-neutral-400" />
                  Min. capacity: <span className="font-semibold text-navy-800">{order.minCapacityTons} T</span>
                </div>
              )}
              {order.packageCount && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-neutral-400" />
                  Packages: <span className="font-semibold text-navy-800">{order.packageCount}</span>
                </div>
              )}
              {order.dimensions && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-neutral-400" />
                  Dimensions: <span className="font-semibold text-navy-800">{order.dimensions}</span>
                </div>
              )}
            </div>

            {(order.isFragile || order.isTemperatureSensitive || order.specialHandlingNotes) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-surface-border pt-4">
                {order.isFragile && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> Fragile
                  </span>
                )}
                {order.isTemperatureSensitive && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-skyline-200 bg-skyline-50 px-2.5 py-0.5 text-xs font-semibold text-skyline-700">
                    <Snowflake className="h-3 w-3" /> Temperature sensitive
                  </span>
                )}
                {order.specialHandlingNotes && (
                  <p className="w-full text-xs text-neutral-500">{order.specialHandlingNotes}</p>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-surface-border pt-5 text-center">
              {order.pricingType === "FIXED" ? (
                <div className="col-span-3">
                  <p className="text-xs text-neutral-500">Fixed price</p>
                  <p className="text-lg font-bold text-navy-800">{formatINR(order.proposedRate)}</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-neutral-500">Minimum</p>
                    <p className="text-base font-bold text-navy-800">{formatINR(order.minRate ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-skyline-50 py-1">
                    <p className="text-xs text-skyline-700">Anchor price</p>
                    <p className="text-base font-bold text-skyline-700">{formatINR(order.proposedRate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Maximum</p>
                    <p className="text-base font-bold text-navy-800">{formatINR(order.maxRate ?? 0)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-800">Tracking</h3>
              <Wallet className="h-4 w-4 text-neutral-400" />
            </div>
            {order.status === "IN_TRANSIT" || order.status === "DELIVERED" ? (
              <p className="mt-2 text-sm text-neutral-600">
                {order.status === "DELIVERED" ? "This shipment has been delivered." : "This shipment is currently in transit."}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowTrackingNote(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 shadow-soft transition-colors hover:bg-surface-muted"
                >
                  <Navigation className="h-4 w-4" />
                  Track shipment
                </button>
                {showTrackingNote && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Live tracking will be available once the shipment is in transit.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {order.acceptedTransporter && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
              <h3 className="text-sm font-bold text-navy-800">Assigned transporter</h3>
              <p className="mt-2 text-base font-bold text-navy-800">{order.acceptedTransporter.name}</p>
              <p className="text-xs text-neutral-600">
                {order.acceptedTransporter.vehicleType} · {order.acceptedTransporter.vehicleNumber}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-navy-800">
                <Phone className="h-4 w-4 text-emerald-600" />
                {order.acceptedTransporter.phone}
              </div>
            </div>
          )}

          <TransporterRecommendations
            orderId={order.id}
            orderIsPending={order.status === "PENDING"}
            onSelect={handleAccept}
            refreshKey={recommendationsRefreshKey}
          />

          <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-navy-700" />
              <h3 className="text-sm font-bold text-navy-800">
                Bids received ({order.bids.length})
              </h3>
            </div>

            {order.bids.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No bids yet — check back soon.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedBids.map((bid) => (
                  <BidCompareCard key={bid.id} bid={bid} orderIsPending={order.status === "PENDING"} onAccept={handleAccept} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-navy-800">{value}</p>
    </div>
  );
}
