"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useTransporter } from "@/hooks/useTransporter";
import { DEMO_TRANSPORTER } from "@/data/transporter-mock";

export default function TransporterLoginPage() {
  const router = useRouter();
  const { login, loginWithDemoAccount } = useTransporter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prototype-only mock auth: any non-empty phone/password logs you in
    // as the demo transporter account. Real authentication is a later phase.
    setSubmitting(true);
    await login({ ...DEMO_TRANSPORTER, phone: phone || DEMO_TRANSPORTER.phone });
    setSubmitting(false);
    router.push("/transporter/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-surface-border">
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

      <Container className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <span className="section-eyebrow">Transporter login</span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-800">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Log in to see available shipments and manage your bids.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Phone number</span>
              <input
                className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                placeholder="98100 00001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              Log in
            </Button>
          </form>

          <div className="mt-4 rounded-2xl border border-dashed border-skyline-200 bg-skyline-50 p-4 text-center">
            <p className="text-xs text-skyline-800">
              Judging the hackathon demo? Skip the form and jump straight into a
              populated dashboard.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={async () => {
                setSubmitting(true);
                await loginWithDemoAccount();
                setSubmitting(false);
                router.push("/transporter/dashboard");
              }}
              type="button"
              disabled={submitting}
            >
              <Sparkles className="h-4 w-4" />
              Quick demo login
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-600">
            New transporter?{" "}
            <Link href="/transporter/onboarding" className="font-semibold text-navy-800 hover:text-skyline-600">
              Create an account
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
