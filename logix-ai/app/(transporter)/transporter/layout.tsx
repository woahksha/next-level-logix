import { TransporterProvider } from "@/lib/transporter-store";

export default function TransporterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TransporterProvider>{children}</TransporterProvider>;
}
