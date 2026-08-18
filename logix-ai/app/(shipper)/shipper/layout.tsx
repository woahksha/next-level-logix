import { ShipperProvider } from "@/lib/shipper-store";

export default function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShipperProvider>{children}</ShipperProvider>;
}
