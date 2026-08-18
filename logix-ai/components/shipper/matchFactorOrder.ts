import type { MatchFactorKey } from "@/types/shipper";

// Stable display order for the "Why was this transporter recommended?"
// breakdown — mirrors the weighting order in lib/recommendations.ts
// (MATCH_WEIGHTS), highest-weighted factors first.
export const MATCH_FACTOR_LABELS_ORDER: MatchFactorKey[] = [
  "capacity",
  "truckType",
  "pickupProximity",
  "destinationCompatibility",
  "routeExperience",
  "rating",
  "deadline",
  "price",
  "preferredRoute",
  "availability",
];
