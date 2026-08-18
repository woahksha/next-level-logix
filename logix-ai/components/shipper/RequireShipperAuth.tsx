"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShipperDashboardShell } from "@/components/shipper/DashboardShell";
import { useShipper } from "@/hooks/useShipper";

export function RequireShipperAuth({ children }: { children: React.ReactNode }) {
  const { hydrated, isAuthenticated } = useShipper();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/shipper/login");
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
    return null;
  }

  return <ShipperDashboardShell>{children}</ShipperDashboardShell>;
}
