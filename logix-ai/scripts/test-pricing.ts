// Standalone sanity tests for lib/pricing.ts — run with:
//   npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/test-pricing.ts
// No test framework dependency required; exits with code 1 on failure so
// it can be wired into CI later if a real test runner is added.

import { calculatePriceEstimate, calculateMatchProbability, PriceEstimate } from "../lib/pricing";

// Avoids requiring @types/node just for this standalone script.
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

function expectOk(result: ReturnType<typeof calculatePriceEstimate>, label: string): PriceEstimate {
  assert(result.ok === true, `${label} — expected ok:true, got ${JSON.stringify(result)}`);
  return result as PriceEstimate;
}

const NOW = new Date("2026-08-16T10:00:00Z"); // matches "today" in the app

// TEST 1: Normal route -> reasonable base price
{
  const r = expectOk(
    calculatePriceEstimate({
      distanceKm: 500,
      truckType: "Open Truck",
      weightKg: 4000,
      pickupCity: "Pune",
      dropCity: "Nagpur",
      deliveryDeadline: "2026-08-25",
      now: NOW,
    }),
    "TEST 1"
  );
  assert(r.recommendedRate > 0 && Number.isFinite(r.recommendedRate), "TEST 1: recommendedRate finite/positive");
  assert(r.recommendedRate > 10000 && r.recommendedRate < 30000, `TEST 1: reasonable base price, got ${r.recommendedRate}`);
}

// TEST 2-5: demo high-demand routes
const demoRoutes: [string, string][] = [
  ["Delhi", "Mumbai"],
  ["Delhi", "Jaipur"],
  ["Bengaluru", "Chennai"],
  ["Delhi", "Ahmedabad"],
];
demoRoutes.forEach(([from, to], i) => {
  const r = expectOk(
    calculatePriceEstimate({
      distanceKm: 800,
      truckType: "Container Truck",
      weightKg: 5000,
      pickupCity: from,
      dropCity: to,
      deliveryDeadline: "2026-09-01",
      now: NOW,
    }),
    `TEST ${i + 2}`
  );
  assert(r.demandLevel === "HIGH", `TEST ${i + 2}: ${from} -> ${to} should be HIGH demand, got ${r.demandLevel}`);
  // case-insensitivity check
  const r2 = expectOk(
    calculatePriceEstimate({
      distanceKm: 800,
      truckType: "Container Truck",
      weightKg: 5000,
      pickupCity: from.toLowerCase(),
      dropCity: to.toUpperCase(),
      deliveryDeadline: "2026-09-01",
      now: NOW,
    }),
    `TEST ${i + 2} (case-insensitive)`
  );
  assert(r2.demandLevel === "HIGH", `TEST ${i + 2}: case-insensitive match should still be HIGH`);
});

// TEST 6: Urgent delivery (<24h) -> price increases
{
  const base = expectOk(
    calculatePriceEstimate({
      distanceKm: 600,
      truckType: "Open Truck",
      weightKg: 3000,
      pickupCity: "Pune",
      dropCity: "Indore",
      deliveryDeadline: "2026-09-10",
      now: NOW,
    }),
    "TEST 6 base"
  );
  const urgent = expectOk(
    calculatePriceEstimate({
      distanceKm: 600,
      truckType: "Open Truck",
      weightKg: 3000,
      pickupCity: "Pune",
      dropCity: "Indore",
      deliveryDeadline: "2026-08-16T18:00:00Z", // 8 hours from NOW
      now: NOW,
    }),
    "TEST 6 urgent"
  );
  assert(urgent.recommendedRate > base.recommendedRate, "TEST 6: urgent delivery should increase price");
  assert(urgent.isUrgent === true, "TEST 6: isUrgent flag should be true");
}

// TEST 7: Fragile cargo -> modifier applies
{
  const base = expectOk(
    calculatePriceEstimate({ distanceKm: 400, truckType: "Mini Truck", weightKg: 1000, now: NOW }),
    "TEST 7 base"
  );
  const fragile = expectOk(
    calculatePriceEstimate({ distanceKm: 400, truckType: "Mini Truck", weightKg: 1000, isFragile: true, now: NOW }),
    "TEST 7 fragile"
  );
  assert(fragile.recommendedRate > base.recommendedRate, "TEST 7: fragile cargo should increase price");
}

// TEST 8: Temperature-sensitive cargo -> modifier applies
{
  const base = expectOk(
    calculatePriceEstimate({ distanceKm: 400, truckType: "Refrigerated Truck", weightKg: 1000, now: NOW }),
    "TEST 8 base"
  );
  const cold = expectOk(
    calculatePriceEstimate(
      { distanceKm: 400, truckType: "Refrigerated Truck", weightKg: 1000, isTemperatureSensitive: true, now: NOW },
    ),
    "TEST 8 cold"
  );
  assert(cold.recommendedRate > base.recommendedRate, "TEST 8: temperature-sensitive cargo should increase price");
}

// TEST 9: High-demand route + urgent delivery -> combined modifiers work
{
  const plain = expectOk(
    calculatePriceEstimate({
      distanceKm: 1400,
      truckType: "Trailer",
      weightKg: 8000,
      pickupCity: "Delhi",
      dropCity: "Mumbai",
      deliveryDeadline: "2026-09-20",
      now: NOW,
    }),
    "TEST 9 plain"
  );
  const combined = expectOk(
    calculatePriceEstimate({
      distanceKm: 1400,
      truckType: "Trailer",
      weightKg: 8000,
      pickupCity: "Delhi",
      dropCity: "Mumbai",
      deliveryDeadline: "2026-08-16T20:00:00Z",
      now: NOW,
    }),
    "TEST 9 combined"
  );
  assert(combined.demandLevel === "HIGH", "TEST 9: still HIGH demand");
  assert(combined.isUrgent === true, "TEST 9: still urgent");
  assert(combined.recommendedRate > plain.recommendedRate, "TEST 9: combined modifiers compound the price");
}

// TEST 10: Competitive transporter bid -> high match probability
{
  const est = expectOk(calculatePriceEstimate({ distanceKm: 500, truckType: "Open Truck", weightKg: 3000, now: NOW }), "TEST 10 est");
  const { matchProbability, label } = calculateMatchProbability(est.recommendedRate, est);
  assert(matchProbability >= 90, `TEST 10: bid at recommended rate should have high probability, got ${matchProbability}`);
  assert(label === "Excellent match", `TEST 10: expected Excellent match, got ${label}`);
}

// TEST 11: Very expensive transporter bid -> lower match probability
{
  const est = expectOk(calculatePriceEstimate({ distanceKm: 500, truckType: "Open Truck", weightKg: 3000, now: NOW }), "TEST 11 est");
  const { matchProbability, label } = calculateMatchProbability(est.maxRate * 3, est);
  assert(matchProbability < 30, `TEST 11: very high bid should have low probability, got ${matchProbability}`);
  assert(label === "Above competitive range", `TEST 11: expected Above competitive range, got ${label}`);
}

// TEST 12: Very low transporter bid -> appropriate competitiveness result
{
  const est = expectOk(calculatePriceEstimate({ distanceKm: 500, truckType: "Open Truck", weightKg: 3000, now: NOW }), "TEST 12 est");
  const { matchProbability, label } = calculateMatchProbability(est.minRate * 0.2, est);
  assert(matchProbability < 75, `TEST 12: very low bid should not be "excellent", got ${matchProbability}`);
  assert(label === "Below recommended range", `TEST 12: expected Below recommended range, got ${label}`);
}

// TEST 13: Invalid/missing values -> no NaN/Infinity/crash
{
  const missingDistance = calculatePriceEstimate({ truckType: "Open Truck", now: NOW });
  assert(missingDistance.ok === false, "TEST 13: missing distance should be handled safely (ok:false)");

  const zeroDistance = calculatePriceEstimate({ distanceKm: 0, truckType: "Open Truck", now: NOW });
  assert(zeroDistance.ok === false, "TEST 13: zero distance should be handled safely (ok:false)");

  const badEverything = calculatePriceEstimate({
    distanceKm: 300,
    truckType: "Flying Truck", // unknown
    productType: "Unobtainium", // unknown
    weightKg: -50, // invalid
    deliveryDeadline: "not-a-date", // invalid
    pickupCity: "Nowhere",
    dropCity: "Nowhere2",
    now: NOW,
  });
  const ok13 = expectOk(badEverything, "TEST 13 badEverything");
  assert(Number.isFinite(ok13.recommendedRate), "TEST 13: recommendedRate must be finite with bad inputs");
  assert(Number.isFinite(ok13.minRate) && Number.isFinite(ok13.maxRate), "TEST 13: min/max must be finite");

  const pastDeadline = calculatePriceEstimate({
    distanceKm: 300,
    truckType: "Open Truck",
    deliveryDeadline: "2020-01-01",
    now: NOW,
  });
  const ok13b = expectOk(pastDeadline, "TEST 13 pastDeadline");
  assert(ok13b.isDeadlinePassed === true, "TEST 13: past deadline should be flagged, not crash");
  assert(Number.isFinite(ok13b.recommendedRate), "TEST 13: past deadline must still produce a finite price");

  const nanBid = calculateMatchProbability(NaN, { minRate: 100, recommendedRate: 200, maxRate: 300 });
  assert(Number.isFinite(nanBid.matchProbability), "TEST 13: NaN bid must not produce NaN probability");

  const zeroRange = calculateMatchProbability(500, { minRate: 0, recommendedRate: 0, maxRate: 0 });
  assert(Number.isFinite(zeroRange.matchProbability), "TEST 13: zero-range estimate must not produce NaN/Infinity");
}

// TEST 14: Price is always minimum <= recommended <= maximum
{
  const scenarios: Parameters<typeof calculatePriceEstimate>[0][] = [
    { distanceKm: 50, truckType: "Mini Truck", weightKg: 200, now: NOW },
    { distanceKm: 2500, truckType: "Trailer", weightKg: 20000, isFragile: true, isTemperatureSensitive: true, pickupCity: "Delhi", dropCity: "Mumbai", deliveryDeadline: "2026-08-16T12:00:00Z", now: NOW },
    { distanceKm: 100, truckType: "Refrigerated Truck", weightKg: 500, now: NOW },
    { distanceKm: 900, truckType: "Container Truck", weightKg: 12000, productType: "Chemicals", now: NOW },
  ];
  scenarios.forEach((s, i) => {
    const r = expectOk(calculatePriceEstimate(s), `TEST 14.${i}`);
    assert(r.minRate <= r.recommendedRate, `TEST 14.${i}: minRate <= recommendedRate`);
    assert(r.recommendedRate <= r.maxRate, `TEST 14.${i}: recommendedRate <= maxRate`);
  });
}

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
