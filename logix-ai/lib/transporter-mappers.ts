import type { ShipmentListing, DemandLevel } from "@/types/transporter";
import { calculatePriceEstimate, type DemandLevel as PricingDemandLevel } from "@/lib/pricing";

// Maps a real Order (from /api/orders or /api/orders/[id]) onto the
// existing ShipmentListing shape so the pre-built transporter UI
// (ShipmentCard, BidForm, AIPricingCard, LeaveNowVsLaterCard) keeps
// working unchanged, now backed by real database records instead of
// data/transporter-mock.ts.
//
// Pricing (min/recommended/max rate, demand level, and the explanation
// text) comes from the Logix AI Estimate rule-based pricing engine in
// lib/pricing.ts — see that file for the full rule set. A couple of
// ShipmentListing fields (backhaul match, fuel estimate, return-load
// probability) remain cosmetic/prototype flavour that isn't backed by
// any real matching logic, same as before.
const DEMAND_LEVEL_LABEL: Record<PricingDemandLevel, DemandLevel> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function mapOrderToShipmentListing(order: any): ShipmentListing {
  const estimate = calculatePriceEstimate({
    distanceKm: order.distanceKm,
    truckType: order.truckTypeRequired,
    productType: order.productType,
    weightKg: order.weightKg,
    isFragile: order.isFragile,
    isTemperatureSensitive: order.isTemperatureSensitive,
    specialHandlingNotes: order.specialHandlingNotes,
    pickupCity: order.pickupLocation,
    dropCity: order.dropLocation,
    deliveryDeadline: order.deliveryDeadline,
  });

  // minRate/recommendedRate/maxRate stay tied to what the shipper actually
  // posted (as before) — this is the real, enforceable bid range. The
  // Logix AI Estimate below is a separate, independent market-rate
  // suggestion; it never overrides what a transporter is allowed to bid.
  const isFixed = order.pricingType === "FIXED";
  const minRate = order.minRate ?? (isFixed ? Math.round(order.proposedRate * 0.95) : order.proposedRate);
  const maxRate = order.maxRate ?? (isFixed ? Math.round(order.proposedRate * 1.05) : order.proposedRate);

  // The engine only returns ok:false when distanceKm is missing/invalid,
  // which shouldn't happen for a real, already-created order.
  const demandLevel: DemandLevel = estimate.ok ? DEMAND_LEVEL_LABEL[estimate.demandLevel] : "Medium";
  const aiEstimate = estimate.ok
    ? {
        minRate: estimate.minRate,
        recommendedRate: estimate.recommendedRate,
        maxRate: estimate.maxRate,
        demandLevel: DEMAND_LEVEL_LABEL[estimate.demandLevel],
        ratePerKm: estimate.ratePerKm,
        explanation: estimate.explanation,
      }
    : undefined;

  return {
    id: order.id,
    shipperName: order.shipper?.name ?? "Shipper",
    shipperCompany: order.shipper?.companyName ?? "—",
    shipperRating: order.shipper?.rating ?? 0,
    pickupLocation: order.pickupLocation,
    dropLocation: order.dropLocation,
    distanceKm: order.distanceKm,
    productType: order.productType,
    truckTypeRequired: order.truckTypeRequired,
    weightKg: order.weightKg,
    pickupWindow: new Date(order.pickupDateTime).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    deliveryDeadline: new Date(order.deliveryDeadline).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    paymentTerms: "30% advance on acceptance, balance on delivery",
    minRate,
    recommendedRate: order.proposedRate,
    maxRate,
    isBackhaulMatch: false,
    demandLevel,
    postedAgo: relativeTime(order.createdAt),
    fuelEstimateINR: Math.round(order.distanceKm * 12),
    returnLoadProbabilityPercent: 40,
    aiEstimate,
  };
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
