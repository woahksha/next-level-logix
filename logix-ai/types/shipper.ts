// Types for the shipper dashboard, order posting, and bid comparison UI.
// These map directly onto the Prisma Order/Bid/User models — this phase
// is wired to the real database (see app/api/*), unlike the transporter
// prototype types in types/transporter.ts.

export type OrderStatus = "PENDING" | "BID_ACCEPTED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type PricingType = "FIXED" | "NEGOTIABLE";
export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface ShipperProfileData {
  id: string; // real User.id — required for every API call made on this shipper's behalf
  name: string;
  email: string;
  phone: string;
  companyName: string;
  gstNumber?: string | null;
  address: string;
  kycStatus: KycStatus;
  rating: number;
  totalOrders: number;
}

// Shape returned by GET /api/orders (list view — no bid detail needed)
export interface OrderSummary {
  id: string;
  pickupLocation: string;
  dropLocation: string;
  distanceKm: number;
  productType: string;
  weightKg: number;
  truckTypeRequired: string;
  pricingType: PricingType;
  proposedRate: number;
  minRate: number | null;
  maxRate: number | null;
  deliveryDeadline: string;
  pickupDateTime: string;
  status: OrderStatus;
  createdAt: string;
  bidCount: number;
  shipper?: {
    name: string;
    companyName: string;
    rating: number;
  };
  acceptedTransporter?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
  } | null;
  acceptedBidAmount?: number | null;
}

export interface BidWithTransporter {
  id: string;
  orderId: string;
  bidAmount: number;
  status: BidStatus;
  createdAt: string;
  transporter: {
    id: string;
    name: string;
    phone: string | null; // only populated once this bid is ACCEPTED
    rating: number;
    totalTrips: number;
    vehicleType: string;
    vehicleNumber: string;
    vehicleCapacity: number;
    kycStatus: KycStatus;
  };
}

// Shape returned by GET /api/orders/[id] (full detail + bids for comparison)
export interface OrderDetail extends OrderSummary {
  pickupAddress: string;
  dropAddress: string;
  volume: number | null;
  packageCount: number | null;
  dimensions: string | null;
  isFragile: boolean;
  isTemperatureSensitive: boolean;
  specialHandlingNotes: string | null;
  minCapacityTons: number | null;
  bids: BidWithTransporter[];
}

// Shape returned by GET /api/orders/[id]/recommendations — mirrors
// MatchFactorScore / TransporterMatchResult from lib/recommendations.ts,
// kept as separate UI-facing types so components don't import server-only
// engine types directly.
export interface RecommendationFactor {
  score: number;
  weight: number;
  label: string;
  detail: string;
  isNeutral: boolean;
}

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

export interface RecommendedTransporter {
  transporterId: string;
  bidId: string | null;
  name: string;
  vehicleType: string;
  vehicleCapacityTons: number;
  rating: number;
  totalTrips: number;
  kycStatus: KycStatus;
  bidAmount: number | null;
  matchScore: number;
  factors: Record<MatchFactorKey, RecommendationFactor>;
  reasons: string[];
  limitations: string[];
}

export interface OrderFormValues {
  pickupCity: string;
  pickupAddress: string;
  pickupDate: string; // yyyy-mm-dd
  pickupTime: string; // HH:mm
  dropCity: string;
  dropAddress: string;
  deliveryDeadline: string; // yyyy-mm-dd
  productType: string;
  weightKg: string;
  volume: string;
  packageCount: string;
  dimensions: string;
  isFragile: boolean;
  isTemperatureSensitive: boolean;
  specialHandlingNotes: string;
  truckTypeRequired: string;
  minCapacityTons: string;
  pricingType: PricingType;
  fixedPrice: string;
  minPrice: string;
  maxPrice: string;
}
