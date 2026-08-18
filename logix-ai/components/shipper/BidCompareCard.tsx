"use client";

import { useState } from "react";
import { Star, Truck, Weight, CheckCircle2, Phone, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import type { BidWithTransporter } from "@/types/shipper";

export function BidCompareCard({
  bid,
  orderIsPending,
  onAccept,
}: {
  bid: BidWithTransporter;
  orderIsPending: boolean;
  onAccept: (bidId: string) => Promise<void>;
}) {
  const [accepting, setAccepting] = useState(false);

  const isAccepted = bid.status === "ACCEPTED";
  const isRejected = bid.status === "REJECTED";

  return (
    <div
      className={`rounded-2xl border p-5 shadow-soft ${
        isAccepted ? "border-emerald-300 bg-emerald-50" : isRejected ? "border-surface-border bg-surface-muted opacity-60" : "border-surface-border bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-navy-800">{bid.transporter.name}</p>
            {bid.transporter.kycStatus === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {bid.transporter.rating.toFixed(1)} rating · {bid.transporter.totalTrips} trips completed
          </span>
        </div>
        {isAccepted && <Badge tone="success">Accepted</Badge>}
        {isRejected && <Badge tone="neutral">Not selected</Badge>}
        {bid.status === "PENDING" && <Badge tone="warning">Pending</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-border pt-4 text-xs text-neutral-600 sm:grid-cols-3">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-neutral-400" />
          {bid.transporter.vehicleType} · {bid.transporter.vehicleNumber}
        </div>
        <div className="flex items-center gap-1.5">
          <Weight className="h-3.5 w-3.5 text-neutral-400" />
          {bid.transporter.vehicleCapacity} T capacity
        </div>
      </div>

      {isAccepted && bid.transporter.phone && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white p-3 text-sm font-semibold text-navy-800">
          <Phone className="h-4 w-4 text-emerald-600" />
          {bid.transporter.phone}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
        <div>
          <p className="text-xs text-neutral-500">Bid amount</p>
          <p className="text-xl font-extrabold text-navy-800">{formatINR(bid.bidAmount)}</p>
        </div>
        {orderIsPending && bid.status === "PENDING" && (
          <Button
            size="sm"
            disabled={accepting}
            onClick={async () => {
              setAccepting(true);
              await onAccept(bid.id);
              setAccepting(false);
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {accepting ? "Accepting…" : "Accept Bid"}
          </Button>
        )}
      </div>
    </div>
  );
}
