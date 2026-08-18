"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShipperProfileData } from "@/types/shipper";
import { DEMO_SHIPPER } from "@/data/shipper-mock";

const STORAGE_KEY = "logixai_shipper_session";

interface ShipperSession {
  isAuthenticated: boolean;
  profile: ShipperProfileData | null;
}

interface ShipperContextValue extends ShipperSession {
  hydrated: boolean;
  login: (phone: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithDemoAccount: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const ShipperContext = createContext<ShipperContextValue | null>(null);

const emptySession: ShipperSession = { isAuthenticated: false, profile: null };

function toProfile(user: any): ShipperProfileData {
  const p = user.shipperProfile ?? {};
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    companyName: p.companyName ?? user.name,
    gstNumber: p.gstNumber ?? null,
    address: p.address ?? "",
    kycStatus: p.kycStatus ?? "PENDING",
    rating: p.rating ?? 0,
    totalOrders: p.totalOrders ?? 0,
  };
}

export function ShipperProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ShipperSession>(emptySession);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw) as ShipperSession);
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: ShipperSession) => {
    setSession(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — still works in-memory for the tab
    }
  }, []);

  const login = useCallback(
    async (phone: string, name?: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, role: "SHIPPER", name }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Login failed." };
        persist({ isAuthenticated: true, profile: toProfile(data.user) });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the server. Please try again." };
      }
    },
    [persist]
  );

  const loginWithDemoAccount = useCallback(() => login(DEMO_SHIPPER.phone, DEMO_SHIPPER.name), [login]);

  const logout = useCallback(() => {
    persist(emptySession);
  }, [persist]);

  const value = useMemo<ShipperContextValue>(
    () => ({ ...session, hydrated, login, loginWithDemoAccount, logout }),
    [session, hydrated, login, loginWithDemoAccount, logout]
  );

  return <ShipperContext.Provider value={value}>{children}</ShipperContext.Provider>;
}

export function useShipper() {
  const ctx = useContext(ShipperContext);
  if (!ctx) throw new Error("useShipper must be used within a ShipperProvider");
  return ctx;
}
