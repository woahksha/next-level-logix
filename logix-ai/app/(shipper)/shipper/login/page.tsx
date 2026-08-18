"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useShipper } from "@/hooks/useShipper";

export default function ShipperLoginPage() {
  const router = useRouter();
  const { login, loginWithDemoAccount } = useShipper();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    // Prototype-only mock auth (no password check) — same pattern as the
    // transporter login. Any phone number logs you in, creating a real
    // shipper account on first use.
    const result = await login(phone, name || undefined);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed. Please try again.");
      return;
    }
    router.push("/shipper/dashboard");
  }

  async function handleDemoLogin() {
    setSubmitting(true);
    setError(null);
    const result = await loginWithDemoAccount();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed. Please try again.");
      return;
    }
    router.push("/shipper/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-surface-border">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/shipper"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Container>
      </header>

      <Container className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <span className="section-eyebrow">Shipper login</span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-800">Welcome back</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Log in to post shipments and compare transporter bids.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Phone number</span>
              <input
                className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                placeholder="98200 00001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Company / your name</span>
              <input
                className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                placeholder="Only needed the first time you log in"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Password</span>
              <input
                type="password"
                className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="mt-4 rounded-2xl border border-dashed border-skyline-200 bg-skyline-50 p-4 text-center">
            <p className="text-xs text-skyline-800">
              Judging the hackathon demo? Skip the form and jump straight into a populated
              shipper account.
            </p>
            <Button variant="outline" className="mt-3" onClick={handleDemoLogin} type="button" disabled={submitting}>
              <Sparkles className="h-4 w-4" />
              Quick demo login
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
