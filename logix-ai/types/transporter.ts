// Types for the transporter onboarding, dashboard, bidding, and
// earnings prototype. These are prototype/UI-state types — they map
// loosely to the Prisma models but are kept independent since this
// phase runs entirely on mock client-side data (no API wiring yet).

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type DocStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED";
export type DemandLevel = "High" | "Medium" | "Low";
export type BidStatus =
  | "UNDER_REVIEW"
  | "LEADING"
  | "OUTBID"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface PreferredRoute {
  from: string;
  to: string;
}

export interface TransporterProfileData {
  // Personal details
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  // Driving licence / KYC
  drivingLicenseNumber: string;
  licenceUploadStatus: DocStatus;
  panNumber: string;
  aadhaarStatus: DocStatus;
  kycStatus: KycStatus;

  // Vehicle / truck details
  vehicleType: string;
  vehicleCategory: string;
  vehicleNumber: string;
  vehicleCapacityTons: number;
  vehicleDimensions: string;
  currentLocation: string;
  preferredOperatingArea: string;

  // Payment details (masked/mock for the prototype)
  bankAccountNumberMasked: string;
  ifsc: string;
  upiId: string;
  preferredPaymentMethod: "UPI" | "Bank Transfer";

  // Preferences (optional — improve matching, never block browsing)
  preferredLanguage: string;
  preferredRadiusKm: number;
  maxAdditionalDistanceKm: number;
  preferredRoutes: PreferredRoute[];
  preferredCities: string[];
  minAcceptablePaymentINR: number;

  // Kept for backwards compatibility with earlier single-route UI
  preferredRouteFrom: string;
  preferredRouteTo: string;

  // Profile stats (mock)
  rating: number;
  totalTrips: number;
  memberSince: string;
}

export interface AIPriceEstimate {
  minRate: number;
  recommendedRate: number;
  maxRate: number;
  demandLevel: DemandLevel;
  ratePerKm: number;
  explanation: string;
}

export interface ShipmentListing {
  id: string;
  shipperName: string;
  shipperCompany: string;
  shipperRating: number;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  productType: string;
  truckTypeRequired: string;
  weightKg: number;
  pickupWindow: string;
  deliveryDeadline: string;
  paymentTerms: string;
  minRate: number;
  recommendedRate: number;
  maxRate: number;
  isBackhaulMatch: boolean;
  backhaulNote?: string;
  demandLevel: DemandLevel;
  postedAgo: string;
  fuelEstimateINR: number;
  returnLoadProbabilityPercent: number;
  /**
   * The Logix AI Estimate — a market-rate suggestion from the rule-based
   * pricing engine (lib/pricing.ts). This is advisory only: it is
   * intentionally kept separate from minRate/recommendedRate/maxRate
   * above (which stay tied to the shipper's actual posted price and
   * continue to bound what a transporter is allowed to bid) so the AI
   * suggestion can never silently block a transporter from bidding what
   * the shipper actually offered. Optional because older/mock
   * ShipmentListing objects (data/transporter-mock.ts) predate the
   * pricing engine.
   */
  aiEstimate?: AIPriceEstimate;
}

export interface BidRecord {
  id: string;
  shipmentId: string;
  bidAmount: number;
  status: BidStatus;
  createdAt: string;
  expiresInHours: number;
}

export interface ReviewEntry {
  id: string;
  fromCompany: string;
  score: number;
  comment: string;
  date: string;
}

export interface RouteDemand {
  route: string;
  demandLevel: DemandLevel;
  trend: string;
  expectedDemandPercent: number;
  avgRatePerKm: number;
}

export interface EarningsWeek {
  label: string;
  earningsINR: number;
}

export interface TripRecord {
  id: string;
  route: string;
  shipperCompany: string;
  completedOn: string;
  earningsINR: number;
  fuelCostINR: number;
  tollCostINR: number;
  netProfitINR: number;
  wasBackhaul: boolean;
  distanceKm: number;
}
