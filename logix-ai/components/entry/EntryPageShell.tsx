import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CtaLink {
  label: string;
  href: string;
}

export function EntryPageShell({
  audienceLabel,
  headline,
  description,
  icon: HeroIcon,
  accent,
  benefits,
  ctaLabel,
  primaryCta,
  secondaryCta,
}: {
  audienceLabel: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  accent: "skyline" | "navy";
  benefits: Benefit[];
  ctaLabel: string;
  /** When provided, renders a functional call-to-action instead of the "coming in Phase 2" placeholder. */
  primaryCta?: CtaLink;
  /** Optional second link shown alongside the primary CTA (e.g. "New here? Register"). */
  secondaryCta?: CtaLink;
}) {
  const accentBg =
    accent === "skyline"
      ? "from-skyline-500 to-navy-700"
      : "from-navy-700 to-navy-900";

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-surface-border">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </Container>
      </header>

      <section className="relative overflow-hidden bg-navy-800">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:44px_44px] opacity-40" />
        <Container className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow border-white/20 bg-white/10 text-skyline-200 backdrop-blur-sm">
              For {audienceLabel}
            </span>
            <div
              className={cn(
                "mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-soft",
                accentBg
              )}
            >
              <HeroIcon className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {headline}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
              {description}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                  <benefit.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy-800">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {primaryCta ? (
            <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-surface-border bg-surface-muted p-8 text-center sm:p-10">
              <h2 className="text-xl font-bold text-navy-800">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
                Log in to your {audienceLabel.toLowerCase()} account, or create
                a new one in a couple of minutes.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  href={primaryCta.href}
                  size="lg"
                  variant={accent === "skyline" ? "secondary" : "primary"}
                >
                  {primaryCta.label}
                </Button>
                {secondaryCta && (
                  <Button href={secondaryCta.href} size="lg" variant="outline">
                    {secondaryCta.label}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-14 max-w-xl rounded-3xl border border-surface-border bg-surface-muted p-8 text-center sm:p-10">
              <h2 className="text-xl font-bold text-navy-800">
                Sign-up & dashboard coming in Phase 2
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
                This is a foundation preview. The full {audienceLabel.toLowerCase()}{" "}
                experience — accounts, listings and matching — is built in the
                next development phase.
              </p>
              <Button
                className="mt-6"
                size="lg"
                variant={accent === "skyline" ? "secondary" : "primary"}
                disabled
              >
                {ctaLabel}
              </Button>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
