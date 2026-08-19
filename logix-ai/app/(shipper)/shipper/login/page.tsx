"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Sparkles } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useShipper } from "@/hooks/useShipper";
import { firebaseAuth } from "@/lib/firebase";

function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return null;
}

function firebaseErrorMessage(error: unknown) {
  console.log("Firebase error:", error);
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "auth/invalid-phone-number") return "Enter a valid phone number.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
  if (code === "auth/invalid-verification-code") return "That verification code is incorrect.";
  return "Could not verify your phone number. Please try again.";
}

export default function ShipperLoginPage() {
  const router = useRouter();
  const { login, loginWithDemoAccount } = useShipper();
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [name, setName] = useState("");
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
      const result = await login(normalizedPhone, name || undefined);
      if (!result.ok) {
        setError(result.error ?? "Login failed. Please try again.");
        return;
      }
      router.push("/shipper/dashboard");
    } catch (verificationError) {
      setError(firebaseErrorMessage(verificationError));
      recaptcha.current?.clear();
      recaptcha.current = null;
    } finally {
      setSubmitting(false);
    }
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
                disabled={Boolean(confirmation)}
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
            {confirmation && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Verification code</span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-navy-800 outline-none transition-colors focus:border-skyline-400"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </label>
            )}

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
