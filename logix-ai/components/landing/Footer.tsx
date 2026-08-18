import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-white py-10">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Logix AI. Built for hackathon
          demo purposes.
        </p>
      </Container>
    </footer>
  );
}
