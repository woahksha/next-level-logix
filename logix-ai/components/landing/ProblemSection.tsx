import { Container } from "@/components/ui/Container";
import { AlertTriangle, TrendingDown, Search, IndianRupee } from "lucide-react";

const problems = [
  {
    icon: TrendingDown,
    audience: "Transporters",
    title: "Trucks return empty",
    description:
      "After a delivery, most trucks travel back with unused capacity instead of carrying another load — burning fuel and time for zero revenue.",
  },
  {
    icon: Search,
    audience: "Shippers",
    title: "Hard to find reliable capacity",
    description:
      "Shippers struggle to discover available, trustworthy trucks at the right time and place, often relying on slow, informal networks of brokers.",
  },
  {
    icon: IndianRupee,
    audience: "Both sides",
    title: "Prices aren't transparent",
    description:
      "Without visibility into demand and available capacity, pricing is inconsistent — transporters undercharge, and shippers overpay.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-surface-muted py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">
            <AlertTriangle className="h-3.5 w-3.5" />
            The Problem
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
            Empty miles are a loss for everyone
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
            India&rsquo;s road freight industry runs on fragmented, offline
            coordination. That gap between empty capacity and waiting cargo
            costs the whole supply chain time and money.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="group rounded-2xl border border-surface-border bg-white p-7 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-white">
                <problem.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-skyline-600">
                {problem.audience}
              </p>
              <h3 className="mt-2 text-lg font-bold text-navy-800">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
