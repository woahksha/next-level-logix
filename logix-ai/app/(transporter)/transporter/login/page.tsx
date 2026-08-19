"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Sparkles } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useTransporter } from "@/hooks/useTransporter";
import { DEMO_TRANSPORTER } from "@/data/transporter-mock";
import { firebaseAuth } from "@/lib/firebase";

function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

function firebaseErrorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "auth/invalid-phone-number") return "Enter a valid phone number.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
  if (code === "auth/invalid-verification-code") return "That verification code is incorrect.";
  return "Could not verify your phone number. Please try again.";
}

export default function TransporterLoginPage() {
  const router = useRouter();
  const { login, loginWithDemoAccount } = useTransporter();
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => recaptcha.current?.clear();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedPhone = toE164(phone);
    if (!normalizedPhone) {
      setError("Enter a valid 10-digit Indian phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (!confirmation) {
        recaptcha.current ??= new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
          size: "invisible",
        });
        const result = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, recaptcha.current);
        setConfirmation(result);
        return;
      }

      await confirmation.confirm(verificationCode.trim());
      await login({ ...DEMO_TRANSPORTER, phone: normalizedPhone });
      router.push("/transporter/dashboard");
    } catch (verificationError) {
      setError(firebaseErrorMessage(verificationError));
      recaptcha.current?.clear();
      recaptcha.current = null;
    } finally {
      setSubmitting(false);
    }
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
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Verification code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={!confirmation}
                required={Boolean(confirmation)}
              />
            </label>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? "Please wait…" : confirmation ? "Verify and log in" : "Send verification code"}
            </Button>
            {confirmation && (
              <button
                type="button"
                className="w-full text-xs font-semibold text-skyline-700 hover:text-skyline-800"
                onClick={() => {
                  setConfirmation(null);
                  setVerificationCode("");
                  recaptcha.current?.clear();
                  recaptcha.current = null;
                }}
              >
                Use a different number
              </button>
            )}
            <div id="recaptcha-container" />
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
