// ==================================================
// Logix AI — Intelligent Transporter Recommendations
// ==================================================
//
// Same philosophy as lib/pricing.ts and services/demandService.ts: a
// transparent, deterministic, RULE-BASED scoring engine — NOT a trained
// machine-learning model. Every number below is a configurable constant,
// and every output (the "AI Match Score") can be traced back to one of
// the weighted factors in this file.
//
// This file is intentionally kept independent of React/Next.js/Prisma —
// it takes plain-object candidates in and returns plain-object results
// out — so it can be unit-tested standalone (see
// scripts/test-recommendations.ts) and so a future
// `MLRecommendationEngine` could implement the same
// `RecommendationEngine` shape without any UI/API changes.
//
//   Order + Bids  ->  API route builds candidates  ->  this engine
//   (rule-based weighted scoring)  ->  RecommendationResult[]  ->  UI
//
// ==================================================

import { haversineDistanceKm } from "@/lib/geo";
import { calculatePriceEstimate, calculateMatchProbability } from "@/lib/pricing";

// --------------------------------------------------
// Types
// --------------------------------------------------

export type MatchFactorKey =
  | "capacity"
  | "truckType"
  | "pickupProximity"
  | "destinationCompatibility"
  | "routeExperience"
  | "rating"
  | "deadline"
  | "price"
  | "preferredRoute"
  | "availability";

export interface MatchFactorScore {
  /** 0-100, normalized score for this factor alone. */
  score: number;
  /** Fractional weight (0-1) this factor contributes to the total. */
  weight: number;
  /** Short label for the UI, e.g. "Capacity match". */
  label: string;
  /** Human-readable explanation of why this factor scored the way it did. */
  detail: string;
  /**
   * True when there wasn't enough data to genuinely evaluate this factor,
   * so a neutral score was used instead of a real signal. The UI must not
   * render this as a positive "✓" reason.
   */
  isNeutral: boolean;
}

/** The information the engine needs about one candidate transporter. */
export interface TransporterCandidateInput {
  transporterId: string;
  bidId?: string | null;
  name: string;
  vehicleType: string;
  /** Truck capacity in TONS (matches TransporterProfile.vehicleCapacity). */
  vehicleCapacityTons: number;
  rating: number;
  totalTrips: number;
  kycStatus: string;
  preferredRouteFrom?: string | null;
  preferredRouteTo?: string | null;
  /** This transporter's bid amount on the order, if they've bid. */
  bidAmount?: number | null;
  /**
   * Number of DELIVERED orders on this exact pickup->drop route where this
   * transporter's bid was ACCEPTED. Real derived data (from Bid + Order),
   * never fabricated — see app/api/orders/[id]/recommendations/route.ts.
   */
  deliveredOnRouteCount: number;
  /**
   * Whether this transporter currently has another order assigned to them
   * (status BID_ACCEPTED or IN_TRANSIT). Derived from real Bid/Order data
   * as a proxy for "availability" since no explicit availability field
   * exists on TransporterProfile — see NO DATABASE REDESIGN note below.
   */
  currentlyBusy: boolean;
}

/** The information the engine needs about the shipment being matched. */
export interface OrderMatchInput {
  pickupLocation: string;
  dropLocation: string;
  weightKg: number;
  minCapacityTons?: number | null;
  truckTypeRequired: string;
  isTemperatureSensitive?: boolean;
  distanceKm: number;
  deliveryDeadline: string | Date;
  pickupDateTime?: string | Date | null;
  pricingType: "FIXED" | "NEGOTIABLE";
  proposedRate: number;
  minRate?: number | null;
  maxRate?: number | null;
  /** Overridable "now" — for deterministic testing only. */
  now?: Date;
}

export interface TransporterMatchResult {
  transporterId: string;
  bidId?: string | null;
  name: string;
  matchScore: number; // 0-100, null-safe, deterministic
  eligible: boolean;
  exclusionReason?: string;
  factors: Record<MatchFactorKey, MatchFactorScore>;
  /** Explainability check-list — only factors that genuinely scored well. */
  reasons: string[];
  /** Data-limitation notes — shown instead of a false positive claim. */
  limitations: string[];
}

// --------------------------------------------------
// Configuration — single source of truth for the weights.
// Starting weights from the product brief, kept as-is: they sum to 1.00
// and are safe to tune without touching any scoring logic below.
// --------------------------------------------------

export const MATCH_WEIGHTS: Record<MatchFactorKey, number> = {
  capacity: 0.2,
  truckType: 0.15,
  pickupProximity: 0.15,
  destinationCompatibility: 0.15,
  routeExperience: 0.1,
  rating: 0.1,
  deadline: 0.05,
  price: 0.05,
  preferredRoute: 0.03,
  availability: 0.02,
};

export const MATCH_FACTOR_LABELS: Record<MatchFactorKey, string> = {
  capacity: "Capacity match",
  truckType: "Truck type",
  pickupProximity: "Pickup proximity",
  destinationCompatibility: "Destination/route match",
  routeExperience: "Route experience",
  rating: "Transporter rating",
  deadline: "Deadline compatibility",
  price: "Price competitiveness",
  preferredRoute: "Preferred route",
  availability: "Availability",
};

/** A factor scoring at/above this line is genuinely "strong" and may be shown as a ✓ reason. */
const STRONG_THRESHOLD = 80;

/** Average road speed assumption used only for the deadline-feasibility estimate (demo constant). */
const ASSUMED_AVG_SPEED_KMPH = 40;

// --------------------------------------------------
// Small helpers
// --------------------------------------------------

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeCity(city: string | null | undefined): string {
  return (city ?? "").trim().toLowerCase();
}

function sameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeCity(a);
  const nb = normalizeCity(b);
  return Boolean(na) && Boolean(nb) && na === nb;
}

// --------------------------------------------------
// Factor 1 — Capacity
// --------------------------------------------------

const TRUCK_TYPE_GROUP: Record<string, "light" | "heavy" | "special"> = {
  "Mini Truck": "light",
  "Open Truck": "light",
  "Container Truck": "heavy",
  Trailer: "heavy",
  "Refrigerated Truck": "special",
};

export function scoreCapacity(
  vehicleCapacityTons: number,
  order: Pick<OrderMatchInput, "weightKg" | "minCapacityTons">
): MatchFactorScore {
  const capacityKg = Math.max(0, vehicleCapacityTons) * 1000;
  const requiredKg = Math.max(order.weightKg || 0, (order.minCapacityTons || 0) * 1000);

  if (requiredKg <= 0) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.capacity,
      label: MATCH_FACTOR_LABELS.capacity,
      detail: "No cargo weight was specified for this shipment.",
      isNeutral: true,
    };
  }

  const ratio = capacityKg / requiredKg;

  if (ratio < 1) {
    return {
      score: 0,
      weight: MATCH_WEIGHTS.capacity,
      label: MATCH_FACTOR_LABELS.capacity,
      detail: `Truck capacity (${vehicleCapacityTons}T) is below the ${(requiredKg / 1000).toFixed(1)}T required for this shipment.`,
      isNeutral: false,
    };
  }
  if (ratio < 1.1) {
    return {
      score: 60,
      weight: MATCH_WEIGHTS.capacity,
      label: MATCH_FACTOR_LABELS.capacity,
      detail: `Truck capacity (${vehicleCapacityTons}T) barely covers the required ${(requiredKg / 1000).toFixed(1)}T.`,
      isNeutral: false,
    };
  }
  if (ratio < 1.3) {
    return {
      score: 80,
      weight: MATCH_WEIGHTS.capacity,
      label: MATCH_FACTOR_LABELS.capacity,
      detail: `Truck capacity (${vehicleCapacityTons}T) comfortably covers the required ${(requiredKg / 1000).toFixed(1)}T.`,
      isNeutral: false,
    };
  }
  return {
    score: ratio < 2 ? 95 : 100,
    weight: MATCH_WEIGHTS.capacity,
    label: MATCH_FACTOR_LABELS.capacity,
    detail: `Truck capacity (${vehicleCapacityTons}T) covers the required ${(requiredKg / 1000).toFixed(1)}T with strong headroom.`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 2 — Truck type
// --------------------------------------------------

export function scoreTruckType(
  vehicleType: string,
  order: Pick<OrderMatchInput, "truckTypeRequired" | "isTemperatureSensitive">
): MatchFactorScore {
  const required = order.truckTypeRequired;

  if (order.isTemperatureSensitive && required === "Refrigerated Truck" && vehicleType !== "Refrigerated Truck") {
    return {
      score: 0,
      weight: MATCH_WEIGHTS.truckType,
      label: MATCH_FACTOR_LABELS.truckType,
      detail: "This shipment is temperature-sensitive and requires a Refrigerated Truck.",
      isNeutral: false,
    };
  }

  if (vehicleType === required) {
    return {
      score: 100,
      weight: MATCH_WEIGHTS.truckType,
      label: MATCH_FACTOR_LABELS.truckType,
      detail: `Exact truck type match (${vehicleType}).`,
      isNeutral: false,
    };
  }

  const sameGroup = TRUCK_TYPE_GROUP[vehicleType] && TRUCK_TYPE_GROUP[vehicleType] === TRUCK_TYPE_GROUP[required];
  if (sameGroup) {
    return {
      score: 55,
      weight: MATCH_WEIGHTS.truckType,
      label: MATCH_FACTOR_LABELS.truckType,
      detail: `${vehicleType} is a compatible substitute for the requested ${required}.`,
      isNeutral: false,
    };
  }

  return {
    score: 20,
    weight: MATCH_WEIGHTS.truckType,
    label: MATCH_FACTOR_LABELS.truckType,
    detail: `${vehicleType} does not closely match the requested ${required}.`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 3 — Pickup proximity
// --------------------------------------------------

export function scorePickupProximity(
  baseCity: string | null | undefined,
  pickupCity: string
): MatchFactorScore & { distanceKm: number | null } {
  if (!baseCity) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.pickupProximity,
      label: MATCH_FACTOR_LABELS.pickupProximity,
      detail: "Transporter's base location isn't on file — neutral score used.",
      isNeutral: true,
      distanceKm: null,
    };
  }

  if (sameCity(baseCity, pickupCity)) {
    return {
      score: 100,
      weight: MATCH_WEIGHTS.pickupProximity,
      label: MATCH_FACTOR_LABELS.pickupProximity,
      detail: `Transporter is based in ${pickupCity}, right at the pickup point.`,
      isNeutral: false,
      distanceKm: 0,
    };
  }

  const distanceKm = haversineDistanceKm(baseCity, pickupCity);
  if (distanceKm == null) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.pickupProximity,
      label: MATCH_FACTOR_LABELS.pickupProximity,
      detail: "Distance to pickup could not be calculated — neutral score used.",
      isNeutral: true,
      distanceKm: null,
    };
  }

  let score: number;
  if (distanceKm <= 5) score = 100;
  else if (distanceKm <= 25) score = 90;
  else if (distanceKm <= 75) score = 70;
  else if (distanceKm <= 150) score = 50;
  else if (distanceKm <= 300) score = 30;
  else score = 15;

  return {
    score,
    weight: MATCH_WEIGHTS.pickupProximity,
    label: MATCH_FACTOR_LABELS.pickupProximity,
    detail: `Transporter's base (${baseCity}) is ~${Math.round(distanceKm)} km from the pickup point (${pickupCity}).`,
    isNeutral: false,
    distanceKm,
  };
}

// --------------------------------------------------
// Factor 4 — Destination compatibility
// --------------------------------------------------

export function scoreDestinationCompatibility(
  preferredRouteTo: string | null | undefined,
  dropCity: string
): MatchFactorScore {
  if (!preferredRouteTo) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.destinationCompatibility,
      label: MATCH_FACTOR_LABELS.destinationCompatibility,
      detail: "Transporter has no destination preference on file — neutral score used.",
      isNeutral: true,
    };
  }

  if (sameCity(preferredRouteTo, dropCity)) {
    return {
      score: 100,
      weight: MATCH_WEIGHTS.destinationCompatibility,
      label: MATCH_FACTOR_LABELS.destinationCompatibility,
      detail: `${dropCity} matches this transporter's preferred destination.`,
      isNeutral: false,
    };
  }

  return {
    score: 35,
    weight: MATCH_WEIGHTS.destinationCompatibility,
    label: MATCH_FACTOR_LABELS.destinationCompatibility,
    detail: `${dropCity} is outside this transporter's preferred destination (${preferredRouteTo}).`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 5 — Route experience
// --------------------------------------------------

export function scoreRouteExperience(deliveredOnRouteCount: number): MatchFactorScore {
  if (!deliveredOnRouteCount || deliveredOnRouteCount <= 0) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.routeExperience,
      label: MATCH_FACTOR_LABELS.routeExperience,
      detail: "No completed deliveries on this exact route yet — neutral score used.",
      isNeutral: true,
    };
  }
  if (deliveredOnRouteCount === 1) {
    return {
      score: 70,
      weight: MATCH_WEIGHTS.routeExperience,
      label: MATCH_FACTOR_LABELS.routeExperience,
      detail: "Transporter has completed 1 delivery on this exact route.",
      isNeutral: false,
    };
  }
  if (deliveredOnRouteCount <= 3) {
    return {
      score: 85,
      weight: MATCH_WEIGHTS.routeExperience,
      label: MATCH_FACTOR_LABELS.routeExperience,
      detail: `Transporter has completed ${deliveredOnRouteCount} deliveries on this exact route.`,
      isNeutral: false,
    };
  }
  return {
    score: 100,
    weight: MATCH_WEIGHTS.routeExperience,
    label: MATCH_FACTOR_LABELS.routeExperience,
    detail: `Transporter has completed ${deliveredOnRouteCount} deliveries on this exact route.`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 6 — Transporter rating
// --------------------------------------------------

export function scoreRating(rating: number): MatchFactorScore {
  if (!rating || rating <= 0) {
    return {
      score: 40,
      weight: MATCH_WEIGHTS.rating,
      label: MATCH_FACTOR_LABELS.rating,
      detail: "No rating history yet — a modest neutral score was used.",
      isNeutral: true,
    };
  }

  let score: number;
  if (rating >= 4.8) score = 100;
  else if (rating >= 4.5) score = 90;
  else if (rating >= 4.0) score = 75;
  else if (rating >= 3.5) score = 55;
  else if (rating >= 3.0) score = 35;
  else score = 15;

  return {
    score,
    weight: MATCH_WEIGHTS.rating,
    label: MATCH_FACTOR_LABELS.rating,
    detail: `Transporter rating is ${rating.toFixed(1)} / 5.`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 7 — Deadline compatibility
// --------------------------------------------------

export function scoreDeadline(
  order: Pick<OrderMatchInput, "distanceKm" | "deliveryDeadline" | "pickupDateTime" | "now">,
  pickupProximityKm: number | null
): MatchFactorScore {
  const now = order.now ?? new Date();
  const deadline = order.deliveryDeadline instanceof Date ? order.deliveryDeadline : new Date(order.deliveryDeadline);
  if (Number.isNaN(deadline.getTime())) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.deadline,
      label: MATCH_FACTOR_LABELS.deadline,
      detail: "Delivery deadline could not be evaluated — neutral score used.",
      isNeutral: true,
    };
  }

  const start = order.pickupDateTime
    ? order.pickupDateTime instanceof Date
      ? order.pickupDateTime
      : new Date(order.pickupDateTime)
    : now;
  const referenceStart = Number.isNaN(start.getTime()) ? now : start;

  const availableHours = (deadline.getTime() - referenceStart.getTime()) / (1000 * 60 * 60);
  const totalTravelKm = (pickupProximityKm ?? 0) + Math.max(order.distanceKm || 0, 0);
  const estimatedHours = totalTravelKm / ASSUMED_AVG_SPEED_KMPH;

  if (availableHours <= 0 || estimatedHours <= 0) {
    return {
      score: availableHours <= 0 ? 20 : 70,
      weight: MATCH_WEIGHTS.deadline,
      label: MATCH_FACTOR_LABELS.deadline,
      detail: availableHours <= 0 ? "The delivery deadline has already passed." : "Not enough route data to estimate travel time.",
      isNeutral: estimatedHours <= 0 && availableHours > 0,
    };
  }

  const margin = availableHours / estimatedHours;
  let score: number;
  if (margin >= 1.5) score = 100;
  else if (margin >= 1.15) score = 85;
  else if (margin >= 1.0) score = 65;
  else if (margin >= 0.8) score = 35;
  else score = 10;

  return {
    score,
    weight: MATCH_WEIGHTS.deadline,
    label: MATCH_FACTOR_LABELS.deadline,
    detail:
      score >= 65
        ? "Transporter should comfortably meet the delivery deadline based on estimated travel time."
        : "Meeting the delivery deadline looks tight based on estimated travel time.",
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 8 — Price competitiveness (reuses lib/pricing.ts)
// --------------------------------------------------

export function scorePrice(
  bidAmount: number | null | undefined,
  order: OrderMatchInput
): MatchFactorScore {
  if (bidAmount == null || bidAmount <= 0) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.price,
      label: MATCH_FACTOR_LABELS.price,
      detail: "No bid amount yet — neutral score used.",
      isNeutral: true,
    };
  }

  const estimate = calculatePriceEstimate({
    distanceKm: order.distanceKm,
    truckType: order.truckTypeRequired,
    weightKg: order.weightKg,
    isTemperatureSensitive: order.isTemperatureSensitive,
    pickupCity: order.pickupLocation,
    dropCity: order.dropLocation,
    deliveryDeadline: order.deliveryDeadline,
    now: order.now,
  });

  // Fall back to the order's own posted range if the pricing engine can't
  // produce an estimate (only happens with an invalid/missing distance,
  // which shouldn't occur for a real, already-created order).
  const range = estimate.ok
    ? { minRate: estimate.minRate, recommendedRate: estimate.recommendedRate, maxRate: estimate.maxRate }
    : {
        minRate: order.minRate ?? Math.round(order.proposedRate * 0.95),
        recommendedRate: order.proposedRate,
        maxRate: order.maxRate ?? Math.round(order.proposedRate * 1.05),
      };

  const { matchProbability, label } = calculateMatchProbability(bidAmount, range);

  return {
    score: matchProbability,
    weight: MATCH_WEIGHTS.price,
    label: MATCH_FACTOR_LABELS.price,
    detail: `Bid is "${label}" against the Logix AI estimated competitive range.`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 9 — Preferred route
// --------------------------------------------------

export function scorePreferredRoute(
  preferredRouteFrom: string | null | undefined,
  preferredRouteTo: string | null | undefined,
  order: Pick<OrderMatchInput, "pickupLocation" | "dropLocation">
): MatchFactorScore {
  if (!preferredRouteFrom || !preferredRouteTo) {
    return {
      score: 50,
      weight: MATCH_WEIGHTS.preferredRoute,
      label: MATCH_FACTOR_LABELS.preferredRoute,
      detail: "Transporter hasn't set a preferred route — neutral score used.",
      isNeutral: true,
    };
  }

  const fromMatch = sameCity(preferredRouteFrom, order.pickupLocation);
  const toMatch = sameCity(preferredRouteTo, order.dropLocation);

  if (fromMatch && toMatch) {
    return {
      score: 100,
      weight: MATCH_WEIGHTS.preferredRoute,
      label: MATCH_FACTOR_LABELS.preferredRoute,
      detail: `Matches transporter's preferred route (${preferredRouteFrom} → ${preferredRouteTo}).`,
      isNeutral: false,
    };
  }
  if (fromMatch || toMatch) {
    return {
      score: 65,
      weight: MATCH_WEIGHTS.preferredRoute,
      label: MATCH_FACTOR_LABELS.preferredRoute,
      detail: `Partially matches transporter's preferred route (${preferredRouteFrom} → ${preferredRouteTo}).`,
      isNeutral: false,
    };
  }
  return {
    score: 30,
    weight: MATCH_WEIGHTS.preferredRoute,
    label: MATCH_FACTOR_LABELS.preferredRoute,
    detail: `Outside transporter's preferred route (${preferredRouteFrom} → ${preferredRouteTo}).`,
    isNeutral: false,
  };
}

// --------------------------------------------------
// Factor 10 — Availability
// --------------------------------------------------

export function scoreAvailability(currentlyBusy: boolean): MatchFactorScore {
  if (currentlyBusy) {
    return {
      score: 15,
      weight: MATCH_WEIGHTS.availability,
      label: MATCH_FACTOR_LABELS.availability,
      detail: "Transporter currently has another shipment in progress.",
      isNeutral: false,
    };
  }
  return {
    score: 100,
    weight: MATCH_WEIGHTS.availability,
    label: MATCH_FACTOR_LABELS.availability,
    detail: "Transporter has no other active shipment right now.",
    isNeutral: false,
  };
}

// --------------------------------------------------
// Hard filters
// --------------------------------------------------

export function getEligibleTransporters(
  candidates: TransporterCandidateInput[],
  order: OrderMatchInput
): { eligible: TransporterCandidateInput[]; excluded: { candidate: TransporterCandidateInput; reason: string }[] } {
  const eligible: TransporterCandidateInput[] = [];
  const excluded: { candidate: TransporterCandidateInput; reason: string }[] = [];

  for (const candidate of candidates) {
    const capacityFactor = scoreCapacity(candidate.vehicleCapacityTons, order);
    if (capacityFactor.score === 0 && !capacityFactor.isNeutral) {
      excluded.push({ candidate, reason: "Truck capacity is insufficient for this shipment." });
      continue;
    }

    const truckTypeFactor = scoreTruckType(candidate.vehicleType, order);
    if (truckTypeFactor.score === 0 && !truckTypeFactor.isNeutral) {
      excluded.push({ candidate, reason: truckTypeFactor.detail });
      continue;
    }

    eligible.push(candidate);
  }

  return { eligible, excluded };
}

// --------------------------------------------------
// Main scoring entry point
// --------------------------------------------------

export function calculateTransporterMatchScore(
  candidate: TransporterCandidateInput,
  order: OrderMatchInput
): TransporterMatchResult {
  const capacity = scoreCapacity(candidate.vehicleCapacityTons, order);
  const truckType = scoreTruckType(candidate.vehicleType, order);

  // Hard-filtered candidates still get a full (zeroed-out) result so the
  // caller can explain the exclusion — but eligible=false short-circuits
  // the rest of the pipeline.
  if ((capacity.score === 0 && !capacity.isNeutral) || (truckType.score === 0 && !truckType.isNeutral)) {
    const exclusionReason =
      capacity.score === 0 && !capacity.isNeutral ? capacity.detail : truckType.detail;
    const emptyFactors = {
      capacity,
      truckType,
      pickupProximity: { score: 0, weight: MATCH_WEIGHTS.pickupProximity, label: MATCH_FACTOR_LABELS.pickupProximity, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      destinationCompatibility: { score: 0, weight: MATCH_WEIGHTS.destinationCompatibility, label: MATCH_FACTOR_LABELS.destinationCompatibility, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      routeExperience: { score: 0, weight: MATCH_WEIGHTS.routeExperience, label: MATCH_FACTOR_LABELS.routeExperience, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      rating: { score: 0, weight: MATCH_WEIGHTS.rating, label: MATCH_FACTOR_LABELS.rating, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      deadline: { score: 0, weight: MATCH_WEIGHTS.deadline, label: MATCH_FACTOR_LABELS.deadline, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      price: { score: 0, weight: MATCH_WEIGHTS.price, label: MATCH_FACTOR_LABELS.price, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      preferredRoute: { score: 0, weight: MATCH_WEIGHTS.preferredRoute, label: MATCH_FACTOR_LABELS.preferredRoute, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
      availability: { score: 0, weight: MATCH_WEIGHTS.availability, label: MATCH_FACTOR_LABELS.availability, detail: "Not evaluated — transporter is ineligible for this shipment.", isNeutral: true },
    } as Record<MatchFactorKey, MatchFactorScore>;

    return {
      transporterId: candidate.transporterId,
      bidId: candidate.bidId,
      name: candidate.name,
      matchScore: 0,
      eligible: false,
      exclusionReason,
      factors: emptyFactors,
      reasons: [],
      limitations: [exclusionReason],
    };
  }

  const pickupProximity = scorePickupProximity(candidate.preferredRouteFrom, order.pickupLocation);
  const destinationCompatibility = scoreDestinationCompatibility(candidate.preferredRouteTo, order.dropLocation);
  const routeExperience = scoreRouteExperience(candidate.deliveredOnRouteCount);
  const rating = scoreRating(candidate.rating);
  const deadline = scoreDeadline(order, pickupProximity.distanceKm);
  const price = scorePrice(candidate.bidAmount, order);
  const preferredRoute = scorePreferredRoute(candidate.preferredRouteFrom, candidate.preferredRouteTo, order);
  const availability = scoreAvailability(candidate.currentlyBusy);

  const factors: Record<MatchFactorKey, MatchFactorScore> = {
    capacity,
    truckType,
    pickupProximity,
    destinationCompatibility,
    routeExperience,
    rating,
    deadline,
    price,
    preferredRoute,
    availability,
  };

  const totalScore = (Object.keys(factors) as MatchFactorKey[]).reduce(
    (sum, key) => sum + factors[key].score * factors[key].weight,
    0
  );
  const matchScore = Math.round(clamp(totalScore, 0, 100));

  const { reasons, limitations } = generateRecommendationReasons(factors);

  return {
    transporterId: candidate.transporterId,
    bidId: candidate.bidId,
    name: candidate.name,
    matchScore,
    eligible: true,
    factors,
    reasons,
    limitations,
  };
}

// --------------------------------------------------
// Explanation generator
// --------------------------------------------------

/**
 * Turns a factor map into a ✓ reasons list and a limitations list. A
 * reason is only ever included when the factor genuinely scored well —
 * never for a neutral/missing-data factor, even if the raw score happens
 * to be mid-range. This keeps the explanation honest and in sync with
 * the actual score (see PROJECT SPEC — EXPLAINABILITY).
 */
export function generateRecommendationReasons(
  factors: Record<MatchFactorKey, MatchFactorScore>
): { reasons: string[]; limitations: string[] } {
  const reasons: string[] = [];
  const limitations: string[] = [];

  (Object.keys(factors) as MatchFactorKey[]).forEach((key) => {
    const factor = factors[key];
    if (factor.isNeutral) {
      limitations.push(factor.detail);
    } else if (factor.score >= STRONG_THRESHOLD) {
      reasons.push(factor.label);
    }
  });

  return { reasons, limitations };
}

// --------------------------------------------------
// Ranking
// --------------------------------------------------

export function rankTransporters(
  candidates: TransporterCandidateInput[],
  order: OrderMatchInput
): { ranked: TransporterMatchResult[]; excluded: TransporterMatchResult[] } {
  const results = candidates.map((candidate) => calculateTransporterMatchScore(candidate, order));

  const ranked = results
    .filter((r) => r.eligible)
    .sort((a, b) => b.matchScore - a.matchScore);
  const excluded = results.filter((r) => !r.eligible);

  return { ranked, excluded };
}
