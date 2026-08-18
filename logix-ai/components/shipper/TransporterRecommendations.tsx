"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { TransporterRecommendationCard } from "@/components/shipper/TransporterRecommendationCard";
import type { RecommendedTransporter } from "@/types/shipper";

/**
 * "Intelligent Transporter Recommendations" — shows the AI Match Score
 * for every transporter who has bid on this order, ranked best-first.
 * Reuses the existing bid/accept workflow: "Select Transporter" here
 * calls the same accept handler as the "Bids received" list below it.
 */
export function TransporterRecommendations({
  orderId,
  orderIsPending,
  onSelect,
  refreshKey,
}: {
  orderId: string;
  orderIsPending: boolean;
  onSelect: (bidId: string) => Promise<void>;
  /** Bump this to force a re-fetch (e.g. after a bid is accepted elsewhere). */
  refreshKey?: number;
}) {
  const [recommendations, setRecommendations] = useState<RecommendedTransporter[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}/recommendations`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Could not load transporter recommendations.");
          return;
        }
        setRecommendations(data.recommendations ?? []);
        setMessage(data.message ?? null);
      } catch {
        if (!cancelled) setError("Could not load transporter recommendations.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, orderIsPending, refreshKey]);

  if (!orderIsPending) return null;

  return (
    <div className="rounded-2xl border border-skyline-200 bg-gradient-to-br from-skyline-50/60 to-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyline-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-navy-800">AI Recommended Transporters</h3>
          <p className="text-[11px] text-neutral-500">Ranked by Logix AI Match Score</p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

      {!error && recommendations === null && (
        <p className="mt-3 text-sm text-neutral-500">Finding the best matches…</p>
      )}

      {!error && recommendations !== null && recommendations.length === 0 && (
        <p className="mt-3 text-sm text-neutral-500">
          {message ?? "Complete your shipment details to see transporter recommendations."}
        </p>
      )}

      {!error && recommendations !== null && recommendations.length > 0 && (
        <div className="mt-4 space-y-3">
          {recommendations.map((rec, i) => (
            <TransporterRecommendationCard
              key={rec.transporterId}
              recommendation={rec}
              rank={i + 1}
              orderIsPending={orderIsPending}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
