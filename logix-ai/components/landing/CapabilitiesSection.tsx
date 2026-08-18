import { Container } from "@/components/ui/Container";
import {
  Route,
  LineChart,
  IndianRupee,
  Gauge,
  ShieldCheck,
  Target,
} from "lucide-react";

const capabilities = [
  {
    icon: Route,
    title: "Backhaul Optimization",
    description:
      "Surfaces return-trip cargo so trucks rarely travel empty after a delivery.",
  },
  {
    icon: IndianRupee,
    title: "Competitive Price Recommendations",
    description:
      "Suggests fair, data-informed freight rates in INR for every route.",
  },
  {
    icon: LineChart,
    title: "Route Demand Prediction",
    description:
      "Highlights which corridors will need capacity next, ahead of time.",
  },
  {
    icon: Gauge,
    title: "Maximised Earnings",
    description:
      "Helps transporters plan routes that keep trucks loaded, mile after mile.",
  },
  {
    icon: Target,
    title: "Smart Shipper Matching",
    description:
      "Connects shippers to verified, suitable transporters in moments.",
  },
  {
    icon: ShieldCheck,
    title: "Fewer Empty Kilometres",
    description:
      "Every optimized match reduces wasted fuel, time and emissions.",
  },
];

export function CapabilitiesSection() {
  return (
    <section className="bg-navy-900 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow border-white/15 bg-white/5 text-skyline-300">
            What Logix AI Does
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built to make every kilometre count
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-skyline-500/15 text-skyline-300">
                <cap.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-200">
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
