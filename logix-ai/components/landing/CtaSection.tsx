import { PackageSearch, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CtaSection() {
  return (
    <section className="bg-surface-muted py-20 sm:py-24">
      <Container>
        <div className="rounded-3xl border border-surface-border bg-white p-10 text-center shadow-card sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight text-navy-800 sm:text-4xl">
            Ready to stop wasting empty miles?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Tell us who you are, and Logix AI will show you the right side of
            the marketplace.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/transporter" variant="primary" size="lg" icon={Truck} iconPosition="left">
              I&rsquo;m a Transporter
            </Button>
            <Button href="/shipper" variant="secondary" size="lg" icon={PackageSearch} iconPosition="left">
              I&rsquo;m a Shipper
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
