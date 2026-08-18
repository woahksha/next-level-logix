import { RequireShipperAuth } from "@/components/shipper/RequireShipperAuth";

export default function ShipperOrdersLayout({ children }: { children: React.ReactNode }) {
  return <RequireShipperAuth>{children}</RequireShipperAuth>;
}
