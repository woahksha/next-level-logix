import type { Metadata } from "next";
import { PackageSearch, ShieldCheck, Clock, IndianRupee } from "lucide-react";
import { EntryPageShell } from "@/components/entry/EntryPageShell";

export const metadata: Metadata = {
  title: "For Shippers — Logix AI",
  description:
    "Find reliable, suitable transporters for your cargo — matched and priced intelligently.",
};

export default function ShipperEntryPage() {
  return (
    <EntryPageShell
      audienceLabel="Shippers"
      icon={PackageSearch}
      accent="navy"
      headline="Find the right truck for your cargo, faster"
      description="Post your shipment details and Logix AI matches you with suitable, available transporters near your pickup point."
      ctaLabel="Continue as Shipper"
      primaryCta={{ label: "Continue as Shipper", href: "/shipper/login" }}
      benefits={[
        {
          icon: Clock,
          title: "Faster matching",
          description:
            "Stop waiting on informal broker networks — see available trucks in moments.",
        },
        {
          icon: ShieldCheck,
          title: "Reliable transporters",
          description:
            "Get matched with transporters suited to your cargo type and route.",
        },
        {
          icon: IndianRupee,
          title: "Transparent pricing",
          description:
            "See a fair, data-informed price estimate in INR before you commit.",
        },
      ]}
    />
  );
}
