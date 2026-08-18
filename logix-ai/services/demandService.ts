// ==================================================
// Logix AI — Demand Intelligence & Timing Service
// ==================================================
//
// Same philosophy as lib/pricing.ts: a transparent, deterministic,
// RULE-BASED engine — NOT a trained machine-learning model. Every
// number below is a configurable constant/mock historical figure, and
// every output can be traced back to a rule in this file.
//
// This is a hackathon prototype. Historical booking/truck-availability
// figures are DEMO DATA, not live numbers. Every result carries an
// explicit `isSimulated: true` flag and a human-readable disclaimer so
// the UI can never present this as connected to real bookings.
//
//   UI  ->  demand service (this file)  ->  historical mock data + lib/pricing.ts rules
//
// Reuses lib/pricing.ts wherever possible (seasonal periods, high-demand
// route list, truck rate table, demand multipliers) so the two engines
// never disagree about what "high demand" or "festival season" means.
// ==================================================

import {
  SEASONAL_PERIODS,
  HIGH_DEMAND_ROUTES,
  TRUCK_RATE_PER_KM,
  DEFAULT_RATE_PER_KM,
  DEMAND_MULTIPLIERS,
} from "@/lib/pricing";
import { haversineDistanceKm } from "@/lib/geo";

// --------------------------------------------------
// Types
// --------------------------------------------------

/** Four-tier scale (pricing.ts only needs three; forecasting wants to be able to flag a "VERY HIGH" spike). */
export type ForecastDemandLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
export type DemandTrend = "UP" | "DOWN" | "STABLE";

export interface RouteDemandForecast {
  pickupCity: string;
  dropCity: string;
  route: string; // "Delhi → Mumbai"
  distanceKm: number | null;
  currentDemand: ForecastDemandLevel;
  forecastDemand: ForecastDemandLevel; // next 7 days
  trend: DemandTrend;
  trendPercent: number; // signed
  isHighDemandRoute: boolean;
  activeOrUpcomingSeasonalPeriods: string[];
  potentialRatePerKm: number;
  /** Representative potential earnings for this route at the current recommended rate. Null if the city pair isn't in the geo dataset. */
  potentialRate: number | null;
  avgDailyShipments: number;
  avgAvailableTrucks: number;
  explanation: string;
  isSimulated: true;
}

export interface PositioningRecommendation {
  route: string;
  expectedDemand: ForecastDemandLevel;
  potentialRate: number | null;
  recommendation: string;
  isSimulated: true;
}

export interface LeaveOptionEstimate {
  label: "Leave now" | "Leave tomorrow 7 AM";
  departAt: string; // ISO string, easy to render/serialize
  estimatedDemand: ForecastDemandLevel;
  revenue: number;
  travelTimeHours: number;
  fuelCost: number;
  tollCost: number;
  waitingCost: number;
  profit: number;
}

export interface LeaveNowVsLaterResult {
  ok: true;
  pickupCity: string;
  dropCity: string;
  route: string;
  distanceKm: number;
  now: LeaveOptionEstimate;
  later: LeaveOptionEstimate;
  recommendedOption: "now" | "later";
  additionalProfit: number; // always >= 0, profit of the recommended option minus the other
  explanation: string;
  disclaimer: string;
  isSimulated: true;
}

export interface LeaveNowVsLaterUnavailable {
  ok: false;
  reason: string;
}

export type LeaveNowVsLaterOutcome = LeaveNowVsLaterResult | LeaveNowVsLaterUnavailable;

// --------------------------------------------------
// Configuration — demo/prototype constants
// --------------------------------------------------

export const DEMO_DATA_DISCLAIMER =
  "Simulated demand forecast based on demo historical data — not yet connected to live bookings.";

/**
 * Demo historical booking/capacity averages per route (shipments posted
 * per day vs. trucks typically available). This is the "historical mock
 * data" the forecast is built on — swap for a real bookings/telemetry
 * feed later without touching the scoring logic below.
 */
export interface RouteHistoricalStats {
  pickupCity: string;
  dropCity: string;
  avgDailyShipments: number;
  avgAvailableTrucks: number;
}

export const DEMAND_ROUTES: [string, string][] = [
  ["Delhi", "Mumbai"],
  ["Delhi", "Jaipur"],
  ["Mumbai", "Pune"],
  ["Delhi", "Ahmedabad"],
  ["Bengaluru", "Hyderabad"],
];

export const ROUTE_HISTORICAL_STATS: RouteHistoricalStats[] = [
  { pickupCity: "Delhi", dropCity: "Mumbai", avgDailyShipments: 46, avgAvailableTrucks: 30 },
  { pickupCity: "Delhi", dropCity: "Jaipur", avgDailyShipments: 34, avgAvailableTrucks: 27 },
  { pickupCity: "Mumbai", dropCity: "Pune", avgDailyShipments: 52, avgAvailableTrucks: 49 },
  { pickupCity: "Delhi", dropCity: "Ahmedabad", avgDailyShipments: 29, avgAvailableTrucks: 25 },
  { pickupCity: "Bengaluru", dropCity: "Hyderabad", avgDailyShipments: 22, avgAvailableTrucks: 27 },
];

/** Fallback historical profile for any route not in the demo table above (e.g. a shipment between two cities the demo routes don't cover). */
export const DEFAULT_HISTORICAL_STATS: Omit<RouteHistoricalStats, "pickupCity" | "dropCity"> = {
  avgDailyShipments: 25,
  avgAvailableTrucks: 25,
};

/** Extends pricing.ts's 3-tier DEMAND_MULTIPLIERS with a "VERY HIGH" spike tier. */
export const FORECAST_DEMAND_MULTIPLIERS: Record<ForecastDemandLevel, number> = {
  "VERY HIGH": 1.22,
  HIGH: DEMAND_MULTIPLIERS.HIGH,
  MEDIUM: DEMAND_MULTIPLIERS.MEDIUM,
  LOW: DEMAND_MULTIPLIERS.LOW,
};

/** Demand-score thresholds that map the shipment/truck ratio (+ bumps) onto the four-tier scale. */
export const DEMAND_SCORE_THRESHOLDS = { veryHigh: 1.55, high: 1.15, medium: 0.85 };

/** ₹ per km fuel estimate — matches the figure already used elsewhere in the app (lib/transporter-mappers.ts, BidForm.tsx). */
export const FUEL_COST_PER_KM = 12;
/** ₹ per km toll/misc estimate — matches BidForm.tsx's estimateProfit(). */
export const TOLL_COST_PER_KM = 3;
/** ₹ per hour of idle truck/driver time while waiting to depart later. */
export const HOURLY_IDLE_COST = 150;

/** Average road speed assumptions (km/h) — early departures assume lighter traffic. */
export const AVG_SPEED_KMPH_NOW = 45;
export const AVG_SPEED_KMPH_EARLY_MORNING = 50;

/**
 * Modest, deterministic overnight demand adjustment applied to the
 * "leave tomorrow 7 AM" option: early-morning departures tend to catch
 * freshly posted loads before the rest of the market does, a little
 * more so on historically high-demand corridors. This is a documented
 * assumption for the prototype, not a measured effect.
 */
export const EARLY_DEPARTURE_DEMAND_BUMP = { highDemandRoute: 1.06, other: 1.02 };

// --------------------------------------------------
// Small helpers
// --------------------------------------------------

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function routeLabel(pickupCity: string, dropCity: string): string {
  return `${pickupCity} → ${dropCity}`;
}

function isHighDemandRouteMatch(pickupCity: string, dropCity: string): boolean {
  const a = normalizeCity(pickupCity);
  const b = normalizeCity(dropCity);
  return HIGH_DEMAND_ROUTES.some(([x, y]) => {
    const nx = normalizeCity(x);
    const ny = normalizeCity(y);
    return (a === nx && b === ny) || (a === ny && b === nx);
  });
}

function findHistoricalStats(pickupCity: string, dropCity: string): RouteHistoricalStats {
  const a = normalizeCity(pickupCity);
  const b = normalizeCity(dropCity);
  const match = ROUTE_HISTORICAL_STATS.find((r) => {
    const rx = normalizeCity(r.pickupCity);
    const ry = normalizeCity(r.dropCity);
    return (a === rx && b === ry) || (a === ry && b === rx);
  });
  if (match) return match;
  return { pickupCity, dropCity, ...DEFAULT_HISTORICAL_STATS };
}

/** Which configured seasonal periods overlap a given [from, to] window (inclusive). */
function seasonalPeriodsInWindow(from: Date, to: Date): { name: string; multiplier: number }[] {
  return SEASONAL_PERIODS.filter((period) => {
    const start = new Date(`${period.start}T00:00:00`);
    const end = new Date(`${period.end}T23:59:59`);
    return start <= to && end >= from;
  });
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function scoreToLevel(score: number): ForecastDemandLevel {
  if (score >= DEMAND_SCORE_THRESHOLDS.veryHigh) return "VERY HIGH";
  if (score >= DEMAND_SCORE_THRESHOLDS.high) return "HIGH";
  if (score >= DEMAND_SCORE_THRESHOLDS.medium) return "MEDIUM";
  return "LOW";
}

/**
 * Core demand score for a route at a point in time: how tight shipment
 * volume is relative to available truck capacity, bumped by the demo
 * high-demand-route list and any active/upcoming festival seasonality.
 */
function computeDemandScore(
  stats: RouteHistoricalStats,
  opts: { isHighDemandRoute: boolean; seasonalMultiplier: number }
): number {
  const ratio = stats.avgDailyShipments / Math.max(stats.avgAvailableTrucks, 1);
  let score = ratio;
  if (opts.isHighDemandRoute) score *= 1.15;
  score *= opts.seasonalMultiplier;
  return score;
}

function seasonalMultiplierFor(periods: { multiplier: number }[]): number {
  if (periods.length === 0) return 1;
  return periods.reduce((acc, p) => acc * p.multiplier, 1);
}

// --------------------------------------------------
// 1. Route demand forecast
// --------------------------------------------------

/**
 * Current + 7-day-forward demand forecast for the demo route set (or any
 * pickup/drop pair, if provided explicitly). Every number is derived
 * from the demo historical stats + lib/pricing.ts's seasonal/high-demand
 * configuration — nothing here is a live signal.
 */
export function getRouteDemandForecast(
  routes: [string, string][] = DEMAND_ROUTES,
  now: Date = new Date(),
  truckType: string = "Open Truck"
): RouteDemandForecast[] {
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return routes.map(([pickupCity, dropCity]) => {
    const stats = findHistoricalStats(pickupCity, dropCity);
    const isHighDemandRoute = isHighDemandRouteMatch(pickupCity, dropCity);

    const activeNow = seasonalPeriodsInWindow(now, now);
    const activeOrUpcoming = seasonalPeriodsInWindow(now, sevenDaysOut);

    const currentScore = computeDemandScore(stats, {
      isHighDemandRoute,
      seasonalMultiplier: seasonalMultiplierFor(activeNow),
    });
    const forecastScore = computeDemandScore(stats, {
      isHighDemandRoute,
      seasonalMultiplier: seasonalMultiplierFor(activeOrUpcoming),
    });

    const currentDemand = scoreToLevel(currentScore);
    const forecastDemand = scoreToLevel(forecastScore);

    const trendPercent = Math.round(((forecastScore - currentScore) / Math.max(currentScore, 0.01)) * 100);
    const trend: DemandTrend = trendPercent > 3 ? "UP" : trendPercent < -3 ? "DOWN" : "STABLE";

    const distanceKm = haversineDistanceKm(pickupCity, dropCity);
    const ratePerKm = TRUCK_RATE_PER_KM[truckType] ?? DEFAULT_RATE_PER_KM;
    const potentialRate = distanceKm != null ? Math.round(distanceKm * ratePerKm) : null;

    const factors: string[] = [];
    if (activeOrUpcoming.length > 0) {
      factors.push(`Demo seasonal demand increase from ${activeOrUpcoming.map((p) => p.name).join(", ")}.`);
    }
    if (isHighDemandRoute) {
      factors.push(`${routeLabel(pickupCity, dropCity)} is a historically high-demand corridor.`);
    }
    if (stats.avgDailyShipments > stats.avgAvailableTrucks) {
      factors.push("Available trucks are limited relative to shipment volume on this route.");
    } else if (stats.avgAvailableTrucks > stats.avgDailyShipments * 1.15) {
      factors.push("Truck supply is comfortably ahead of shipment volume on this route.");
    }
    if (factors.length === 0) {
      factors.push("Demand is tracking close to its historical average for this corridor.");
    }

    return {
      pickupCity,
      dropCity,
      route: routeLabel(pickupCity, dropCity),
      distanceKm,
      currentDemand,
      forecastDemand,
      trend,
      trendPercent,
      isHighDemandRoute,
      activeOrUpcomingSeasonalPeriods: activeOrUpcoming.map((p) => p.name),
      potentialRatePerKm: ratePerKm,
      potentialRate,
      avgDailyShipments: stats.avgDailyShipments,
      avgAvailableTrucks: stats.avgAvailableTrucks,
      explanation: factors.join(" "),
      isSimulated: true,
    };
  });
}

// --------------------------------------------------
// 2. "Where should I position my truck?"
// --------------------------------------------------

export function getPositioningRecommendations(
  routes: [string, string][] = DEMAND_ROUTES,
  now: Date = new Date(),
  truckType: string = "Open Truck"
): PositioningRecommendation[] {
  const forecasts = getRouteDemandForecast(routes, now, truckType);

  return forecasts
    .slice()
    .sort((a, b) => FORECAST_DEMAND_MULTIPLIERS[b.forecastDemand] - FORECAST_DEMAND_MULTIPLIERS[a.forecastDemand])
    .map((f) => {
      let recommendation: string;
      if (f.forecastDemand === "VERY HIGH" || f.forecastDemand === "HIGH") {
        recommendation = "Consider positioning your truck toward this route.";
      } else if (f.forecastDemand === "MEDIUM") {
        recommendation = "A reasonable backup option if your preferred routes are quiet.";
      } else {
        recommendation = "Demand here is currently on the softer side — not a priority right now.";
      }
      return {
        route: f.route,
        expectedDemand: f.forecastDemand,
        potentialRate: f.potentialRate,
        recommendation,
        isSimulated: true,
      };
    });
}

// --------------------------------------------------
// 3. "Leave now vs. leave tomorrow 7 AM"
// --------------------------------------------------

export interface LeaveNowVsLaterInput {
  pickupCity: string;
  dropCity: string;
  truckType?: string | null;
  /** Overridable "current time" — mainly for deterministic testing. */
  now?: Date;
}

function nextDayAt7AM(now: Date): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d;
}

/**
 * A decision-support prototype comparing leaving immediately vs. waiting
 * until tomorrow 7 AM, for a given pickup/drop pair. This is NOT a real
 * routing/telematics engine — travel-time, fuel, and idle-cost figures
 * are transparent rule-of-thumb estimates (see the constants above).
 */
export function getLeaveNowVsLaterComparison(input: LeaveNowVsLaterInput): LeaveNowVsLaterOutcome {
  const distanceKm = haversineDistanceKm(input.pickupCity, input.dropCity);
  if (distanceKm == null || distanceKm <= 0) {
    return { ok: false, reason: "This route isn't recognised in the demo city dataset yet." };
  }

  const now = input.now ?? new Date();
  const departLater = nextDayAt7AM(now);
  const waitHours = clamp((departLater.getTime() - now.getTime()) / (1000 * 60 * 60), 0.1, 48);

  const truckType = input.truckType?.trim() || "Open Truck";
  const ratePerKm = TRUCK_RATE_PER_KM[truckType] ?? DEFAULT_RATE_PER_KM;
  const basePrice = distanceKm * ratePerKm;

  const stats = findHistoricalStats(input.pickupCity, input.dropCity);
  const isHighDemandRoute = isHighDemandRouteMatch(input.pickupCity, input.dropCity);

  const seasonalNow = seasonalPeriodsInWindow(now, now);
  const seasonalLater = seasonalPeriodsInWindow(departLater, departLater);

  const scoreNow = computeDemandScore(stats, {
    isHighDemandRoute,
    seasonalMultiplier: seasonalMultiplierFor(seasonalNow),
  });
  const earlyBump = isHighDemandRoute ? EARLY_DEPARTURE_DEMAND_BUMP.highDemandRoute : EARLY_DEPARTURE_DEMAND_BUMP.other;
  const scoreLater =
    computeDemandScore(stats, { isHighDemandRoute, seasonalMultiplier: seasonalMultiplierFor(seasonalLater) }) *
    earlyBump;

  const demandNow = scoreToLevel(scoreNow);
  const demandLater = scoreToLevel(scoreLater);

  const revenueNow = Math.round(basePrice * FORECAST_DEMAND_MULTIPLIERS[demandNow]);
  const revenueLater = Math.round(basePrice * FORECAST_DEMAND_MULTIPLIERS[demandLater]);

  const fuelCost = Math.round(distanceKm * FUEL_COST_PER_KM);
  const tollCost = Math.round(distanceKm * TOLL_COST_PER_KM);
  const waitingCost = Math.round(waitHours * HOURLY_IDLE_COST);

  const travelTimeNow = Math.round((distanceKm / AVG_SPEED_KMPH_NOW) * 10) / 10;
  const travelTimeLater = Math.round((distanceKm / AVG_SPEED_KMPH_EARLY_MORNING) * 10) / 10;

  const profitNow = revenueNow - fuelCost - tollCost;
  const profitLater = revenueLater - fuelCost - tollCost - waitingCost;

  const nowOption: LeaveOptionEstimate = {
    label: "Leave now",
    departAt: now.toISOString(),
    estimatedDemand: demandNow,
    revenue: revenueNow,
    travelTimeHours: travelTimeNow,
    fuelCost,
    tollCost,
    waitingCost: 0,
    profit: profitNow,
  };
  const laterOption: LeaveOptionEstimate = {
    label: "Leave tomorrow 7 AM",
    departAt: departLater.toISOString(),
    estimatedDemand: demandLater,
    revenue: revenueLater,
    travelTimeHours: travelTimeLater,
    fuelCost,
    tollCost,
    waitingCost,
    profit: profitLater,
  };

  const recommendedOption: "now" | "later" = profitLater > profitNow ? "later" : "now";
  const additionalProfit = Math.abs(profitLater - profitNow);

  const explanation =
    recommendedOption === "later"
      ? `Demand is expected to be ${demandLater.toLowerCase()} by tomorrow 7 AM, and the higher rate still outweighs ${waitHours.toFixed(
          1
        )}h of estimated idle cost.`
      : "Waiting doesn't clear the estimated idle cost on this route right now — leaving immediately looks like the better move.";

  return {
    ok: true,
    pickupCity: input.pickupCity,
    dropCity: input.dropCity,
    route: routeLabel(input.pickupCity, input.dropCity),
    distanceKm,
    now: nowOption,
    later: laterOption,
    recommendedOption,
    additionalProfit,
    explanation,
    disclaimer: "Decision-support prototype estimate, not a real routing engine — based on demo rules and demo data.",
    isSimulated: true,
  };
}
