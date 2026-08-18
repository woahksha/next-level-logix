// Foundational domain types for Logix AI.
// These describe the shape of our two-sided marketplace and will be
// wired up to real Prisma models + API routes in later phases.

export type UserRole = "TRANSPORTER" | "SHIPPER";

export interface TruckSummary {
  id: string;
  ownerName: string;
  vehicleType: string;
  capacityTons: number;
  currentCity: string;
  destinationCity?: string;
  availableFrom: string; // ISO date
  ratePerKm?: number;
}

export interface ShipmentSummary {
  id: string;
  shipperName: string;
  originCity: string;
  destinationCity: string;
  cargoType: string;
  weightTons: number;
  pickupDate: string; // ISO date
  budgetINR?: number;
}

export interface MatchSummary {
  id: string;
  truckId: string;
  shipmentId: string;
  matchScore: number; // 0-100
  suggestedPriceINR: number;
}
