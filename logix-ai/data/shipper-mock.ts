import { CITY_NAMES } from "@/lib/geo";

// Demo account used by the "Quick demo login" button — matches the
// seeded shipper "Priya Mehta" from prisma/seed.ts so the dashboard
// lands on a populated account with real orders and bids.
export const DEMO_SHIPPER = {
  name: "Priya Mehta",
  phone: "9820000001",
};

export const PRODUCT_TYPE_OPTIONS = [
  "Textiles",
  "Electronics",
  "Pharmaceuticals",
  "Auto Parts",
  "Agricultural Produce",
  "Furniture",
  "FMCG Goods",
  "Packaged Food",
  "Steel Coils",
  "Machinery Parts",
  "Chemicals",
  "Other",
] as const;

export const TRUCK_TYPE_OPTIONS = [
  "Mini Truck",
  "Open Truck",
  "Container Truck",
  "Refrigerated Truck",
  "Trailer",
] as const;

export const SHIPPER_CITIES = CITY_NAMES;
