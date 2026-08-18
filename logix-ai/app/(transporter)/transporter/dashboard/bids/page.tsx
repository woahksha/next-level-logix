"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useTransporter } from "@/hooks/useTransporter";
import { formatINR } from "@/lib/utils";

type ApiBidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface ApiBid {
  id: string;
  orderId: string;
  bidAmount: number;
  status: ApiBidStatus;
  createdAt: string;
  order: {
    id: string;
    pickupLocation: string;
    dropLocation: string;
    distanceKm: number;
    productType: string;
    truckTypeRequired: string;
    proposedRate: number;
    status: string;
    shipperCompany: string;
  };
}

const statusTone: Record<ApiBidStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
};

const statusLabel: Record<ApiBidStatus, string> = {
  PENDING: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export default function ActiveBidsPage() {
  const { transporterId, withdrawBid } = useTransporter();
  const [bids, setBids] = useState<ApiBid[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transporterId) return;
    let cancelled = false;
    fetch(`/api/bids?transporterId=${transporterId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setBids(data.bids ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your bids.");
      });
    return () => {
      cancelled = true;
    };
  }, [transporterId]);

  async function handleWithdraw(bidId: string) {
    const result = await withdrawBid(bidId);
    if (result.ok) {
      setBids((prev) => (prev ? prev.filter((b) => b.id !== bidId) : prev));
    } else {
      setError(result.error ?? "Could not withdraw bid.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Active Bids</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track the status of every bid you&apos;ve placed on available shipments.
        </p>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      {bids === null ? (
        <p className="text-sm text-neutral-500">Loading your bids…</p>
      ) : bids.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center">
          <Gavel className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-600">You haven&apos;t placed any bids yet.</p>
          <Link
            href="/transporter/dashboard/shipments"
            className="mt-3 inline-block text-sm font-semibold text-skyline-600 hover:text-skyline-700"
          >
            Browse available shipments →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bids.map((bid) => {
            const estimatedProfit = bid.bidAmount - Math.round(bid.order.distanceKm * 12) - Math.round(bid.order.distanceKm * 3);
            const canModify = bid.status === "PENDING";

            return (
              <div key={bid.id} className="rounded-2xl border border-surface-border bg-white p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-navy-800">
                      {bid.order.pickupLocation} → {bid.order.dropLocation}
                      <Badge tone={statusTone[bid.status]}>{statusLabel[bid.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {bid.order.shipperCompany} · {bid.order.productType} · {bid.order.truckTypeRequired}
                    </p>
                  </div>
                  {bid.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
                      <Clock className="h-3.5 w-3.5" />
                      Awaiting shipper response
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-border pt-4 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-neutral-400">Your bid</p>
                    <p className="mt-0.5 font-bold text-navy-800">{formatINR(bid.bidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Asking price</p>
                    <p className="mt-0.5 font-semibold text-neutral-600">{formatINR(bid.order.proposedRate)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Estimated profit</p>
                    <p className={`mt-0.5 font-bold ${estimatedProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {formatINR(estimatedProfit)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-surface-border pt-4">
                  <Link
                    href={`/transporter/dashboard/shipments/${bid.order.id}`}
                    className="text-sm font-semibold text-skyline-600 hover:text-skyline-700"
                  >
                    {canModify ? "Modify bid" : "View shipment"}
                  </Link>
                  {canModify && (
                    <button
                      onClick={() => handleWithdraw(bid.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-surface-muted"
                    >
                      <X className="h-3.5 w-3.5" />
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
