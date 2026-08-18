import { RequireShipperAuth } from "@/components/shipper/RequireShipperAuth";

export default function ShipperDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RequireShipperAuth>{children}</RequireShipperAuth>;
}
