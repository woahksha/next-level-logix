import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS } from "@/utils/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-navy-800"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/transporter" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Transporter
          </Button>
          <Button href="/shipper" variant="primary" size="sm">
            Shipper
          </Button>
        </div>
      </Container>
    </header>
  );
}
