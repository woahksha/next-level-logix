import type { Metadata } from "next";
import { Truck, Route, IndianRupee, TrendingUp } from "lucide-react";
import { EntryPageShell } from "@/components/entry/EntryPageShell";

export const metadata: Metadata = {
  title: "For Transporters — Logix AI",
  description:
    "Fill your empty capacity with matched cargo and maximise your earnings on every route.",
};

export default function TransporterEntryPage() {
  return (
    <EntryPageShell
      audienceLabel="Transporters"
      icon={Truck}
      accent="skyline"
      headline="Turn your empty truck into extra income"
      description="List your available capacity and let Logix AI match you with nearby shipments — especially on your return trips."
      ctaLabel="Continue as Transporter"
      primaryCta={{ label: "Continue as Transporter", href: "/transporter/login" }}
      secondaryCta={{ label: "Create an account", href: "/transporter/onboarding" }}
      benefits={[
        {
          icon: Route,
          title: "Fill backhaul trips",
          description:
            "Get matched with cargo heading your way, so return journeys stop running empty.",
        },
        {
          icon: IndianRupee,
          title: "Fair, competitive rates",
          description:
            "See AI-recommended pricing in INR so you never undercharge for a load.",
        },
        {
          icon: TrendingUp,
          title: "Plan around demand",
          description:
            "Know which routes are in demand before you decide where to head next.",
        },
      ]}
    />
  );
}
