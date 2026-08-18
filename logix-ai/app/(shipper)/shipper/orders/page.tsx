"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useShipper } from "@/hooks/useShipper";
import { OrderCard } from "@/components/shipper/OrderCard";
import type { OrderSummary } from "@/types/shipper";

export default function MyOrdersPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">My Orders</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {orders ? `${orders.length} order${orders.length === 1 ? "" : "s"} posted so far.` : "Loading…"}
        </p>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      {orders === null ? (
        <p className="text-sm text-neutral-500">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-600">You haven&apos;t posted any orders yet.</p>
          <Link href="/shipper/orders/new" className="mt-3 inline-block text-sm font-semibold text-skyline-600 hover:text-skyline-700">
            Post your first shipment →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
