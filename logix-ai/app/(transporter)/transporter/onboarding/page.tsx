import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { OnboardingWizard } from "@/components/transporter/OnboardingWizard";

export default function TransporterOnboardingPage() {
  return (
    <main className="min-h-screen bg-surface-muted">
      <header className="border-b border-surface-border bg-white">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/transporter"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Container>
      </header>

      <Container className="py-10 sm:py-14">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <span className="section-eyebrow">Transporter registration</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-800 sm:text-3xl">
            Set up your transporter profile
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Takes about 2 minutes. You can update these details later from your dashboard.
          </p>
        </div>

        <OnboardingWizard />
      </Container>
    </main>
  );
}
