// ==================================================
// Logix AI — Dynamic Pricing Intelligence Engine
// ==================================================
//
// This is a transparent, deterministic, RULE-BASED pricing engine.
// It is NOT a trained machine-learning model — every number below is a
// configurable constant, and every output can be traced back to one of
// the rules in this file. The UI must always present this feature as
// "Logix AI Estimate" with the disclaimer:
//   "Prototype estimate based on current rules and demo data."
//
// The engine is intentionally kept independent of React/Next.js/Prisma
// so it can run on the client (live form previews) or the server
// (API routes), and so a real trained model could later be swapped in
// behind the same `calculatePriceEstimate` / `calculateMatchProbability`
// function signatures without touching any UI code.
//
//   UI  ->  pricing engine (this file)  ->  rules / configuration
//
// ==================================================

// --------------------------------------------------
// Types
// --------------------------------------------------

export type DemandLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PricingInput {
  distanceKm?: number | null;
  truckType?: string | null;
  productType?: string | null;
  weightKg?: number | null;
  isFragile?: boolean | null;
  isTemperatureSensitive?: boolean | null;
  specialHandlingNotes?: string | null;
  pickupCity?: string | null;
  dropCity?: string | null;
  deliveryDeadline?: string | Date | null;
  /** Overridable "current time" — mainly for deterministic testing. */
  now?: Date;
}

export interface PriceEstimate {
  ok: true;
  minRate: number;
  recommendedRate: number;
  maxRate: number;
  ratePerKm: number;
  demandLevel: DemandLevel;
  isHighDemandRoute: boolean;
  isUrgent: boolean;
  isDeadlinePassed: boolean;
  activeSeasonalPeriods: string[];
  /** Rule-based probability (0-100) that a bid placed at recommendedRate would be competitive. */
  baselineMatchProbability: number;
  /** Human-readable, combined explanation of every factor that moved the price. */
  explanation: string;
  /** The same explanation, broken into individual factor sentences. */
  factors: string[];
}

export interface PricingUnavailable {
  ok: false;
  reason: string;
}

export type PricingResult = PriceEstimate | PricingUnavailable;

export interface CompetitivenessResult {
  matchProbability: number; // 0-100
  label: "Excellent match" | "Competitive" | "Below recommended range" | "Above competitive range";
}

// --------------------------------------------------
// Configuration — every number here is a demo/prototype
// constant and is safe to tune without touching the logic below.
// --------------------------------------------------

/** ₹ per km, by the project's existing truck-type list (data/shipper-mock.ts). */
export const TRUCK_RATE_PER_KM: Record<string, number> = {
  "Mini Truck": 24,
  "Open Truck": 30,
  "Container Truck": 38,
  "Refrigerated Truck": 46,
  Trailer: 52,
};
export const DEFAULT_RATE_PER_KM = 32; // used for an unrecognised/unset truck type

/** Cargo weight tiers → modest price bump for heavier loads. Checked from heaviest down. */
export const WEIGHT_MODIFIER_TIERS: { minKg: number; modifier: number }[] = [
  { minKg: 18000, modifier: 1.12 },
  { minKg: 10000, modifier: 1.06 },
  { minKg: 0, modifier: 1.0 },
];

export const FRAGILE_MODIFIER = 1.05;
export const TEMPERATURE_SENSITIVE_MODIFIER = 1.08;
export const SPECIAL_HANDLING_MODIFIER = 1.03;

/** A handful of product types that typically need extra care/compliance. Everything else defaults to 1.0. */
export const PRODUCT_TYPE_MODIFIERS: Record<string, number> = {
  Pharmaceuticals: 1.06,
  Electronics: 1.04,
  Chemicals: 1.07,
};

/** Delivery due in under this many hours counts as "urgent". */
export const URGENCY_THRESHOLD_HOURS = 24;
export const URGENCY_MULTIPLIER = 1.15;

/** Demo high-demand corridors (city names are normalised before comparing). */
export const HIGH_DEMAND_ROUTES: [string, string][] = [
  ["Delhi", "Mumbai"],
  ["Delhi", "Jaipur"],
  ["Bengaluru", "Chennai"],
  ["Delhi", "Ahmedabad"],
];

export const DEMAND_MULTIPLIERS: Record<DemandLevel, number> = {
  HIGH: 1.12,
  MEDIUM: 1.0,
  LOW: 0.95,
};

/**
 * Demo seasonal/festival windows. Dates are explicit (year-specific) so the
 * engine never "assumes" it's permanently festival season — update this
 * list each year with that year's real festival dates.
 */
export const SEASONAL_PERIODS: { name: string; start: string; end: string; multiplier: number }[] = [
  { name: "Raksha Bandhan", start: "2026-08-26", end: "2026-08-29", multiplier: 1.05 },
  { name: "Dussehra", start: "2026-10-18", end: "2026-10-21", multiplier: 1.06 },
  { name: "Diwali", start: "2026-11-06", end: "2026-11-10", multiplier: 1.1 },
  { name: "Wedding season", start: "2026-11-15", end: "2027-02-15", multiplier: 1.08 },
];

/** Recommended price sits between these two bounds around the calculated rate. */
export const RANGE_SPREAD = { min: 0.93, max: 1.08 };

/** Safety clamp so no combination of modifiers can produce an absurd price. */
export const TOTAL_MULTIPLIER_BOUNDS = { min: 0.85, max: 1.6 };

/** Match-probability thresholds used to derive a human label. */
export const MATCH_PROBABILITY_THRESHOLDS = { excellent: 85, competitive: 65 };

// --------------------------------------------------
// Small helpers
// --------------------------------------------------

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// --------------------------------------------------
// Demand
// --------------------------------------------------

export function getDemandLevel(
  pickupCity: string | null | undefined,
  dropCity: string | null | undefined,
  distanceKm: number
): { level: DemandLevel; isHighDemandRoute: boolean } {
  if (pickupCity && dropCity) {
    const a = normalizeCity(pickupCity);
    const b = normalizeCity(dropCity);
    const isHighDemand = HIGH_DEMAND_ROUTES.some(([x, y]) => {
      const nx = normalizeCity(x);
      const ny = normalizeCity(y);
      return (a === nx && b === ny) || (a === ny && b === nx);
    });
    if (isHighDemand) return { level: "HIGH", isHighDemandRoute: true };
  }

  // No demo high-demand match — fall back to a simple, deterministic
  // distance-based signal so every route still gets a sensible demand
  // level instead of always defaulting to the same value.
  if (distanceKm >= 200) return { level: "MEDIUM", isHighDemandRoute: false };
  return { level: "LOW", isHighDemandRoute: false };
}

// --------------------------------------------------
// Urgency
// --------------------------------------------------

export function getUrgencyInfo(
  deliveryDeadline: string | Date | null | undefined,
  now: Date
): { multiplier: number; isUrgent: boolean; isDeadlinePassed: boolean } {
  if (!deliveryDeadline) return { multiplier: 1, isUrgent: false, isDeadlinePassed: false };

  const deadline = deliveryDeadline instanceof Date ? deliveryDeadline : new Date(deliveryDeadline);
  if (Number.isNaN(deadline.getTime())) {
    // Invalid date string — fail safe rather than propagate NaN.
    return { multiplier: 1, isUrgent: false, isDeadlinePassed: false };
  }

  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    // Deadline already passed — treat as urgent, but never crash or
    // produce a runaway multiplier.
    return { multiplier: URGENCY_MULTIPLIER, isUrgent: true, isDeadlinePassed: true };
  }
  if (diffHours < URGENCY_THRESHOLD_HOURS) {
    return { multiplier: URGENCY_MULTIPLIER, isUrgent: true, isDeadlinePassed: false };
  }
  return { multiplier: 1, isUrgent: false, isDeadlinePassed: false };
}

// --------------------------------------------------
// Seasonality
// --------------------------------------------------

export function getSeasonalInfo(now: Date): { multiplier: number; activePeriods: string[] } {
  const active = SEASONAL_PERIODS.filter((period) => {
    const start = new Date(`${period.start}T00:00:00`);
    const end = new Date(`${period.end}T23:59:59`);
    return now >= start && now <= end;
  });

  if (active.length === 0) return { multiplier: 1, activePeriods: [] };

  // Multiple overlapping periods stack, but stay bounded by TOTAL_MULTIPLIER_BOUNDS
  // further down the pipeline.
  const multiplier = active.reduce((acc, p) => acc * p.multiplier, 1);
  return { multiplier, activePeriods: active.map((p) => p.name) };
}

// --------------------------------------------------
// Weight / cargo modifiers
// --------------------------------------------------

function getWeightModifier(weightKg: number | null): number {
  if (!weightKg || weightKg <= 0) return 1;
  const tier = WEIGHT_MODIFIER_TIERS.find((t) => weightKg >= t.minKg);
  return tier ? tier.modifier : 1;
}

function getCargoModifier(input: PricingInput): { modifier: number; usedSpecialHandling: boolean } {
  let modifier = 1;
  if (input.isFragile) modifier *= FRAGILE_MODIFIER;
  if (input.isTemperatureSensitive) modifier *= TEMPERATURE_SENSITIVE_MODIFIER;

  const usedSpecialHandling = Boolean(input.specialHandlingNotes && input.specialHandlingNotes.trim());
  if (usedSpecialHandling) modifier *= SPECIAL_HANDLING_MODIFIER;

  if (input.productType && PRODUCT_TYPE_MODIFIERS[input.productType]) {
    modifier *= PRODUCT_TYPE_MODIFIERS[input.productType];
  }

  return { modifier, usedSpecialHandling };
}

// --------------------------------------------------
// Main entry point
// --------------------------------------------------

export function calculatePriceEstimate(input: PricingInput): PricingResult {
  const distanceKm = safeNumber(input.distanceKm);
  if (distanceKm == null || distanceKm <= 0) {
    return { ok: false, reason: "A valid distance is required to calculate a price estimate." };
  }

  const now = input.now ?? new Date();

  const truckType = input.truckType?.trim() || "";
  const ratePerKm = (truckType && TRUCK_RATE_PER_KM[truckType]) || DEFAULT_RATE_PER_KM;
  const basePrice = distanceKm * ratePerKm;

  const weightKg = safeNumber(input.weightKg);
  const weightModifier = getWeightModifier(weightKg);

  const { modifier: cargoModifier, usedSpecialHandling } = getCargoModifier(input);

  const demandInfo = getDemandLevel(input.pickupCity, input.dropCity, distanceKm);
  const demandMultiplier = DEMAND_MULTIPLIERS[demandInfo.level];

  const urgencyInfo = getUrgencyInfo(input.deliveryDeadline, now);
  const seasonalInfo = getSeasonalInfo(now);

  const rawMultiplier =
    weightModifier * cargoModifier * demandMultiplier * urgencyInfo.multiplier * seasonalInfo.multiplier;
  const totalMultiplier = clamp(rawMultiplier, TOTAL_MULTIPLIER_BOUNDS.min, TOTAL_MULTIPLIER_BOUNDS.max);

  const recommendedRate = Math.round(basePrice * totalMultiplier);
  const minRate = Math.round(recommendedRate * RANGE_SPREAD.min);
  const maxRate = Math.round(recommendedRate * RANGE_SPREAD.max);

  const baselineMatchProbability = calculateMatchProbability(recommendedRate, {
    minRate,
    recommendedRate,
    maxRate,
  }).matchProbability;

  const routeLabel = input.pickupCity && input.dropCity ? `${input.pickupCity} → ${input.dropCity}` : "This route";

  const factors: string[] = [];
  if (demandInfo.level === "HIGH") {
    factors.push(`${routeLabel} is currently showing elevated demand.`);
  } else if (demandInfo.level === "LOW") {
    factors.push(`${routeLabel} currently has lighter demand, keeping pricing conservative.`);
  }
  if (urgencyInfo.isDeadlinePassed) {
    factors.push("The requested delivery deadline has already passed, so this is being treated as urgent.");
  } else if (urgencyInfo.isUrgent) {
    factors.push("Delivery is within 24 hours, so an urgency premium has been applied.");
  }
  if (input.isTemperatureSensitive) {
    factors.push("Temperature-sensitive cargo requires additional handling.");
  }
  if (input.isFragile) {
    factors.push("Fragile cargo requires additional care during transit.");
  }
  if (usedSpecialHandling) {
    factors.push("Special handling instructions add a modest premium.");
  }
  if (weightModifier > 1) {
    factors.push("Heavier cargo increases the base rate.");
  }
  if (seasonalInfo.activePeriods.length > 0) {
    factors.push(`Pricing reflects seasonal demand from ${seasonalInfo.activePeriods.join(", ")}.`);
  }
  if (!truckType || !TRUCK_RATE_PER_KM[truckType]) {
    factors.push("Truck type wasn't recognised, so a standard per-km rate was used.");
  }
  if (factors.length === 0) {
    factors.push(`Standard pricing applies for this ${Math.round(distanceKm)} km route.`);
  }

  return {
    ok: true,
    minRate,
    recommendedRate,
    maxRate,
    ratePerKm,
    demandLevel: demandInfo.level,
    isHighDemandRoute: demandInfo.isHighDemandRoute,
    isUrgent: urgencyInfo.isUrgent,
    isDeadlinePassed: urgencyInfo.isDeadlinePassed,
    activeSeasonalPeriods: seasonalInfo.activePeriods,
    baselineMatchProbability,
    explanation: factors.join(" "),
    factors,
  };
}

// --------------------------------------------------
// Match probability (transporter bidding)
// --------------------------------------------------

/**
 * Rule-based probability (0-100) that a given bid amount is competitive,
 * relative to the recommended price range. Always finite and clamped.
 */
export function calculateMatchProbability(
  bidAmount: number,
  range: { minRate: number; recommendedRate: number; maxRate: number }
): CompetitivenessResult {
  const { minRate, recommendedRate, maxRate } = range;
  const bid = safeNumber(bidAmount);

  if (bid == null || bid <= 0 || recommendedRate <= 0) {
    return { matchProbability: 0, label: "Below recommended range" };
  }

  let probability: number;

  if (bid <= recommendedRate) {
    if (bid >= minRate) {
      const span = Math.max(recommendedRate - minRate, 1);
      const t = (bid - minRate) / span;
      probability = 75 + t * 20; // 75 -> 95
    } else {
      const deficitRatio = (minRate - bid) / Math.max(minRate, 1);
      probability = Math.max(75 - deficitRatio * 100, 5);
    }
  } else {
    if (bid <= maxRate) {
      const span = Math.max(maxRate - recommendedRate, 1);
      const t = (bid - recommendedRate) / span;
      probability = 95 - t * 35; // 95 -> 60
    } else {
      const excessRatio = (bid - maxRate) / Math.max(maxRate, 1);
      probability = Math.max(60 - excessRatio * 100, 5);
    }
  }

  probability = Math.round(clamp(probability, 0, 100));

  let label: CompetitivenessResult["label"];
  if (bid > maxRate) {
    label = "Above competitive range";
  } else if (bid < minRate) {
    label = "Below recommended range";
  } else if (probability >= MATCH_PROBABILITY_THRESHOLDS.excellent) {
    label = "Excellent match";
  } else if (probability >= MATCH_PROBABILITY_THRESHOLDS.competitive) {
    label = "Competitive";
  } else {
    label = "Below recommended range";
  }

  return { matchProbability: probability, label };
}
