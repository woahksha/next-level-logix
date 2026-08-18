"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/transporter/DashboardShell";
import { useTransporter } from "@/hooks/useTransporter";

export default function TransporterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, isAuthenticated } = useTransporter();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/transporter/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <p className="text-sm text-neutral-500">Loading your dashboard…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect effect above will kick in; render nothing meanwhile.
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
