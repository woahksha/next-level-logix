"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackagePlus, Package, Gavel, Truck, PackageCheck, IndianRupee, Clock, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useShipper } from "@/hooks/useShipper";
import { formatINR } from "@/lib/utils";
import type { OrderSummary } from "@/types/shipper";
import { statusTone, statusLabel } from "@/components/shipper/status";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ShipperDashboardPage() {
  const { profile } = useShipper();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetch(`/api/orders?shipperId=${profile.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  const loaded = orders ?? [];
  const activeShipments = loaded.filter((o) => o.status === "PENDING" || o.status === "BID_ACCEPTED" || o.status === "IN_TRANSIT").length;
  const pendingBids = loaded.filter((o) => o.status === "PENDING").reduce((sum, o) => sum + o.bidCount, 0);
  const inTransit = loaded.filter((o) => o.status === "IN_TRANSIT").length;
  const delivered = loaded.filter((o) => o.status === "DELIVERED").length;
  const totalSpending = loaded
    .filter((o) => o.status === "BID_ACCEPTED" || o.status === "IN_TRANSIT" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.acceptedBidAmount ?? o.proposedRate), 0);

  const deliveredOrders = loaded.filter((o) => o.status === "DELIVERED");
  const avgDeliveryDays =
    deliveredOrders.length > 0
      ? Math.round(
          (deliveredOrders.reduce((sum, o) => {
            const created = new Date(o.createdAt).getTime();
            const deadline = new Date(o.deliveryDeadline).getTime();
            return sum + Math.max(0, (deadline - created) / (1000 * 60 * 60 * 24));
          }, 0) /
            deliveredOrders.length) *
            10
        ) / 10
      : null;

  const recentOrders = loaded.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-navy-800 to-navy-700 p-6 text-white shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-navy-100">{getGreeting()},</p>
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-navy-100">{profile.companyName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={profile.kycStatus === "VERIFIED" ? "success" : "warning"} className="bg-white/10 text-white border-white/20">
              KYC {profile.kycStatus === "VERIFIED" ? "Verified" : profile.kycStatus}
            </Badge>
            <Button href="/shipper/orders/new" variant="secondary">
              <PackagePlus className="h-4 w-4" />
              Post an order
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Package} label="Active shipments" value={String(activeShipments)} hint="Open, awaiting, or moving" accent="navy" />
        <StatCard icon={Gavel} label="Pending bids" value={String(pendingBids)} hint="Across open orders" accent="navy" />
        <StatCard icon={Truck} label="In transit" value={String(inTransit)} hint="On the road now" accent="skyline" />
        <StatCard icon={PackageCheck} label="Delivered" value={String(delivered)} hint="Completed orders" accent="emerald" />
        <StatCard icon={IndianRupee} label="Total spending" value={formatINR(totalSpending, { compact: true })} hint="Accepted orders" accent="emerald" />
        <StatCard icon={Clock} label="Avg. delivery window" value={avgDeliveryDays != null ? `${avgDeliveryDays} days` : "—"} hint="Pickup to deadline" accent="skyline" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-800">Recent orders</h2>
          <Link href="/shipper/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-skyline-600 hover:text-skyline-700">
            View all orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {orders === null ? (
          <p className="mt-4 text-sm text-neutral-500">Loading your orders…</p>
        ) : recentOrders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-sm font-medium text-neutral-600">You haven&apos;t posted any orders yet.</p>
            <Link href="/shipper/orders/new" className="mt-3 inline-block text-sm font-semibold text-skyline-600 hover:text-skyline-700">
              Post your first shipment →
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/shipper/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white p-4 shadow-soft transition-shadow hover:shadow-card"
              >
                <div>
                  <p className="text-sm font-bold text-navy-800">
                    {order.pickupLocation} → {order.dropLocation}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {order.productType} · {order.distanceKm} km · {order.bidCount} bid{order.bidCount === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={statusTone[order.status]}>{statusLabel[order.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
