// Standalone sanity tests for lib/recommendations.ts — run with:
//   npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/test-recommendations.ts
// Same no-framework, exit-code-1-on-failure style as scripts/test-pricing.ts.
// All inputs here are synthetic — this exercises the pure scoring engine
// only, not the DB-backed API route.

import {
  calculateTransporterMatchScore,
  getEligibleTransporters,
  rankTransporters,
  MATCH_WEIGHTS,
  type OrderMatchInput,
  type TransporterCandidateInput,
} from "../lib/recommendations";

declare const process: { exit: (code: number) => void };

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

const NOW = new Date("2026-08-16T10:00:00Z");

const baseOrder: OrderMatchInput = {
  pickupLocation: "Delhi",
  dropLocation: "Mumbai",
  weightKg: 5000,
  minCapacityTons: 5,
  truckTypeRequired: "Container Truck",
  isTemperatureSensitive: false,
  distanceKm: 1150,
  deliveryDeadline: "2026-08-25T00:00:00Z",
  pickupDateTime: "2026-08-17T09:00:00Z",
  pricingType: "FIXED",
  proposedRate: 40000,
  now: NOW,
};

const baseCandidate: TransporterCandidateInput = {
  transporterId: "t1",
  bidId: "b1",
  name: "Rajesh Logistics",
  vehicleType: "Container Truck",
  vehicleCapacityTons: 18,
  rating: 4.9,
  totalTrips: 120,
  kycStatus: "VERIFIED",
  preferredRouteFrom: "Delhi",
  preferredRouteTo: "Mumbai",
  bidAmount: 39500,
  deliveredOnRouteCount: 4,
  currentlyBusy: false,
};

// TEST 1: Exact truck capacity match (comfortable) -> strong capacity score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.capacity.score >= 80, `TEST 1: comfortable capacity should score high, got ${r.factors.capacity.score}`);
}

// TEST 2: Insufficient capacity -> hard filtered (excluded), score 0
{
  const candidate = { ...baseCandidate, vehicleCapacityTons: 2 };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.eligible === false, "TEST 2: insufficient capacity must be ineligible");
  assert(r.matchScore === 0, "TEST 2: excluded transporter must have matchScore 0");
}

// TEST 3: Exact truck type match -> full truckType score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.truckType.score === 100, `TEST 3: exact truck type match should be 100, got ${r.factors.truckType.score}`);
}

// TEST 4: Truck type mismatch (different group) -> low score, not excluded (unless temp-sensitive+refrigerated rule)
{
  const candidate = { ...baseCandidate, vehicleType: "Mini Truck" };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.eligible === true, "TEST 4: cross-group truck type mismatch should not hard-exclude");
  assert(r.factors.truckType.score < 60, `TEST 4: mismatched truck type should score low, got ${r.factors.truckType.score}`);
}

// TEST 4b: Temperature-sensitive shipment requiring Refrigerated Truck -> hard filter on mismatch
{
  const order: OrderMatchInput = { ...baseOrder, truckTypeRequired: "Refrigerated Truck", isTemperatureSensitive: true };
  const candidate = { ...baseCandidate, vehicleType: "Container Truck" };
  const r = calculateTransporterMatchScore(candidate, order);
  assert(r.eligible === false, "TEST 4b: non-refrigerated truck must be excluded for temperature-sensitive cargo");
}

// TEST 5: Nearby transporter (same base city as pickup) -> excellent proximity score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.pickupProximity.score === 100, `TEST 5: same-city base should score 100, got ${r.factors.pickupProximity.score}`);
}

// TEST 6: Far transporter -> low proximity score
{
  const candidate = { ...baseCandidate, preferredRouteFrom: "Chennai", preferredRouteTo: "Kolkata" };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.pickupProximity.score < 50, `TEST 6: far base city should score low, got ${r.factors.pickupProximity.score}`);
}

// TEST 7: Preferred route match -> strong preferredRoute score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.preferredRoute.score === 100, `TEST 7: exact preferred route match should be 100, got ${r.factors.preferredRoute.score}`);
}

// TEST 8: No preferred route -> neutral score, not penalized to zero
{
  const candidate = { ...baseCandidate, preferredRouteFrom: null, preferredRouteTo: null };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.preferredRoute.isNeutral === true, "TEST 8: missing preferred route should be neutral");
  assert(r.factors.preferredRoute.score === 50, `TEST 8: neutral preferred route score should be 50, got ${r.factors.preferredRoute.score}`);
}

// TEST 9: High rating -> high rating score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.rating.score >= 90, `TEST 9: 4.9 rating should score >=90, got ${r.factors.rating.score}`);
}

// TEST 10: Low rating -> low rating score
{
  const candidate = { ...baseCandidate, rating: 2.5 };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.rating.score <= 20, `TEST 10: 2.5 rating should score low, got ${r.factors.rating.score}`);
}

// TEST 11: Route experience present -> above-neutral score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.routeExperience.score > 50, `TEST 11: 4 delivered trips on route should score >50, got ${r.factors.routeExperience.score}`);
  assert(r.factors.routeExperience.isNeutral === false, "TEST 11: route experience with data must not be neutral");
}

// TEST 12: No route history -> neutral score, and NOT listed as a ✓ reason
{
  const candidate = { ...baseCandidate, deliveredOnRouteCount: 0 };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.routeExperience.isNeutral === true, "TEST 12: zero route history must be neutral");
  assert(!r.reasons.includes("Route experience"), "TEST 12: neutral route experience must not appear as a ✓ reason");
}

// TEST 13: Deadline compatible (ample time) -> high deadline score
{
  const order: OrderMatchInput = { ...baseOrder, deliveryDeadline: "2026-09-15T00:00:00Z" };
  const r = calculateTransporterMatchScore(baseCandidate, order);
  assert(r.factors.deadline.score >= 65, `TEST 13: ample time should score >=65, got ${r.factors.deadline.score}`);
}

// TEST 14: Deadline incompatible (already passed) -> very low deadline score
{
  const order: OrderMatchInput = { ...baseOrder, deliveryDeadline: "2026-08-01T00:00:00Z" };
  const r = calculateTransporterMatchScore(baseCandidate, order);
  assert(r.factors.deadline.score <= 30, `TEST 14: passed deadline should score low, got ${r.factors.deadline.score}`);
}

// TEST 15: Competitive price -> high price score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.price.score >= 60, `TEST 15: near-recommended bid should score reasonably high, got ${r.factors.price.score}`);
}

// TEST 16: Expensive price -> low price score
{
  const candidate = { ...baseCandidate, bidAmount: 90000 };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.price.score < 60, `TEST 16: overpriced bid should score low, got ${r.factors.price.score}`);
}

// TEST 17: Available transporter -> full availability score
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.factors.availability.score === 100, `TEST 17: available transporter should score 100, got ${r.factors.availability.score}`);
}

// TEST 18: Unavailable (busy) transporter -> low availability score
{
  const candidate = { ...baseCandidate, currentlyBusy: true };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(r.factors.availability.score < 30, `TEST 18: busy transporter should score low, got ${r.factors.availability.score}`);
}

// TEST 19: High overall match -> strong candidate scores well overall
{
  const r = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r.matchScore >= 75, `TEST 19: strong candidate should have a high overall matchScore, got ${r.matchScore}`);
}

// TEST 20: Low overall match -> weak candidate scores poorly overall
{
  const weakCandidate: TransporterCandidateInput = {
    ...baseCandidate,
    vehicleType: "Mini Truck",
    rating: 2.5,
    preferredRouteFrom: "Chennai",
    preferredRouteTo: "Kolkata",
    deliveredOnRouteCount: 0,
    bidAmount: 90000,
    currentlyBusy: true,
  };
  const r = calculateTransporterMatchScore(weakCandidate, baseOrder);
  assert(r.matchScore <= 45, `TEST 20: weak candidate should have a low overall matchScore, got ${r.matchScore}`);
}

// TEST 21: Correct ranking order (best matchScore first)
{
  const strong = baseCandidate;
  const weak: TransporterCandidateInput = { ...baseCandidate, transporterId: "t2", bidId: "b2", rating: 2.8, currentlyBusy: true };
  const { ranked } = rankTransporters([weak, strong], baseOrder);
  assert(ranked[0].transporterId === "t1", "TEST 21: stronger candidate should rank first");
  assert(ranked[0].matchScore >= ranked[1].matchScore, "TEST 21: ranked list must be sorted descending by matchScore");
}

// TEST 22: Score is deterministic (same inputs -> same output)
{
  const r1 = calculateTransporterMatchScore(baseCandidate, baseOrder);
  const r2 = calculateTransporterMatchScore(baseCandidate, baseOrder);
  assert(r1.matchScore === r2.matchScore, "TEST 22: identical inputs must produce identical matchScore");
}

// TEST 23: Score remains between 0 and 100 across many scenarios
{
  const scenarios: TransporterCandidateInput[] = [
    baseCandidate,
    { ...baseCandidate, vehicleCapacityTons: 1000, rating: 5, deliveredOnRouteCount: 999 },
    { ...baseCandidate, vehicleCapacityTons: 0, rating: 0, bidAmount: 0 },
    { ...baseCandidate, bidAmount: -50 },
  ];
  scenarios.forEach((c, i) => {
    const r = calculateTransporterMatchScore(c, baseOrder);
    assert(r.matchScore >= 0 && r.matchScore <= 100, `TEST 23.${i}: matchScore out of bounds: ${r.matchScore}`);
  });
}

// TEST 24: No NaN anywhere in the result
{
  const candidate = { ...baseCandidate, rating: NaN as unknown as number, vehicleCapacityTons: NaN as unknown as number };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  assert(Number.isFinite(r.matchScore), "TEST 24: matchScore must never be NaN");
  (Object.keys(r.factors) as (keyof typeof r.factors)[]).forEach((key) => {
    assert(Number.isFinite(r.factors[key].score), `TEST 24: factor ${key} score must never be NaN`);
  });
}

// TEST 25: No Infinity anywhere in the result
{
  const order: OrderMatchInput = { ...baseOrder, distanceKm: Infinity };
  const r = calculateTransporterMatchScore(baseCandidate, order);
  assert(Number.isFinite(r.matchScore), "TEST 25: matchScore must never be Infinity");
}

// TEST 26: Explanation matches actual factors — no ✓ reason for a neutral factor
{
  const candidate: TransporterCandidateInput = {
    ...baseCandidate,
    preferredRouteFrom: null,
    preferredRouteTo: null,
    deliveredOnRouteCount: 0,
    bidAmount: null,
  };
  const r = calculateTransporterMatchScore(candidate, baseOrder);
  const neutralLabels = ["Preferred route", "Route experience", "Price competitiveness"];
  neutralLabels.forEach((label) => {
    assert(!r.reasons.includes(label), `TEST 26: neutral factor "${label}" must not appear as a ✓ reason`);
  });
  assert(r.limitations.length >= neutralLabels.length, "TEST 26: neutral factors must be reflected in limitations");
}

// TEST 27: Hard filters work correctly via getEligibleTransporters
{
  const insufficient = { ...baseCandidate, transporterId: "t3", vehicleCapacityTons: 1 };
  const ok = { ...baseCandidate, transporterId: "t4" };
  const { eligible, excluded } = getEligibleTransporters([insufficient, ok], baseOrder);
  assert(eligible.length === 1 && eligible[0].transporterId === "t4", "TEST 27: only the capacity-sufficient candidate should be eligible");
  assert(excluded.length === 1 && excluded[0].candidate.transporterId === "t3", "TEST 27: insufficient-capacity candidate should be excluded with a reason");
}

// Bonus: weights sum to 1.00 (config sanity, not a numbered spec test but cheap to check)
{
  const total = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
  assert(Math.abs(total - 1) < 1e-9, `MATCH_WEIGHTS must sum to 1.00, got ${total}`);
}

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
