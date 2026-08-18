import { Container } from "@/components/ui/Container";
import {
  PackageSearch,
  Sparkles,
  Network,
  Truck,
  BadgeCheck,
  ArrowDown,
  ArrowRight,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: PackageSearch,
    title: "Shipper",
    description: "Posts cargo — origin, destination, weight & pickup date.",
  },
  {
    icon: Sparkles,
    title: "Logix AI",
    description: "Reads live demand and available truck capacity.",
  },
  {
    icon: Network,
    title: "Intelligent Matching",
    description: "Scores & ranks the best truck-to-shipment fits.",
  },
  {
    icon: Truck,
    title: "Transporter",
    description: "Accepts the match and fills otherwise-empty capacity.",
  },
  {
    icon: BadgeCheck,
    title: "Optimized Delivery",
    description: "Cargo moves efficiently — fewer empty kilometres.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">
            <Workflow className="h-3.5 w-3.5" />
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
            From cargo post to optimized delivery
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            One continuous flow connects every shipment with the right
            truck &mdash; automatically.
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="mt-16 hidden items-stretch justify-center gap-3 lg:flex">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3">
              <FlowNode step={step} index={i} />
              {i < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 shrink-0 text-skyline-400" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile / tablet: vertical flow */}
        <div className="mt-12 flex flex-col items-center gap-3 lg:hidden">
          {steps.map((step, i) => (
            <div key={step.title} className="flex w-full max-w-sm flex-col items-center gap-3">
              <FlowNode step={step} index={i} className="w-full" />
              {i < steps.length - 1 && (
                <ArrowDown className="h-5 w-5 shrink-0 text-skyline-400" />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FlowNode({
  step,
  index,
  className,
}: {
  step: (typeof steps)[number];
  index: number;
  className?: string;
}) {
  const isMatchingCore = step.title === "Intelligent Matching";

  return (
    <div
      className={cn(
        "flex w-40 flex-col items-center gap-3 rounded-2xl border p-5 text-center shadow-soft transition-transform hover:-translate-y-1",
        isMatchingCore
          ? "border-skyline-300 bg-gradient-to-b from-skyline-50 to-white"
          : "border-surface-border bg-white",
        className
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          isMatchingCore
            ? "bg-gradient-to-br from-skyline-500 to-navy-700 text-white"
            : "bg-navy-50 text-navy-700"
        )}
      >
        <step.icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Step {index + 1}
        </p>
        <p className="mt-0.5 text-sm font-bold text-navy-800">{step.title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          {step.description}
        </p>
      </div>
    </div>
  );
}
