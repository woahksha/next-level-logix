import { ArrowRight, PackageSearch, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { BRAND } from "@/utils/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-800">
      {/* Background grid + glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-40" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-skyline-500/20 blur-3xl" />

      <Container className="relative py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="section-eyebrow border-white/20 bg-white/10 text-skyline-200 backdrop-blur-sm">
            <Truck className="h-3.5 w-3.5" />
            Intelligent Logistics Marketplace &mdash; India
          </span>

          <h1 className="mt-6 animate-fade-up text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {BRAND.name}
          </h1>

          <p
            className="mt-4 animate-fade-up text-xl font-semibold text-skyline-300 sm:text-2xl"
            style={{ animationDelay: "0.08s" }}
          >
            &ldquo;{BRAND.tagline}&rdquo;
          </p>

          <p
            className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-navy-100 sm:text-lg"
            style={{ animationDelay: "0.16s" }}
          >
            {BRAND.description}
          </p>

          <div
            className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "0.24s" }}
          >
            <Button href="/transporter" variant="secondary" size="lg" icon={Truck} iconPosition="left">
              I&rsquo;m a Transporter
            </Button>
            <Button
              href="/shipper"
              variant="outline"
              size="lg"
              icon={PackageSearch}
              iconPosition="left"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10"
            >
              I&rsquo;m a Shipper
            </Button>
          </div>

          <a
            href="#how-it-works"
            className="mt-12 inline-flex animate-fade-up items-center gap-1.5 text-sm font-medium text-navy-200 transition-colors hover:text-white"
            style={{ animationDelay: "0.32s" }}
          >
            See how the matching works
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}
