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
import type { BidRecord, BidStatus, TransporterProfileData } from "@/types/transporter";
import { DEMO_TRANSPORTER } from "@/data/transporter-mock";

const STORAGE_KEY = "logixai_transporter_session";

interface TransporterSession {
  isAuthenticated: boolean;
  profile: TransporterProfileData | null;
  transporterId: string | null;
  bids: BidRecord[];
}

interface TransporterContextValue extends TransporterSession {
  hydrated: boolean;
  login: (profile: TransporterProfileData) => Promise<void>;
  loginWithDemoAccount: () => Promise<void>;
  completeOnboarding: (profile: TransporterProfileData) => Promise<void>;
  logout: () => void;
  refreshBids: () => Promise<void>;
  placeBid: (shipmentId: string, bidAmount: number) => Promise<{ ok: boolean; error?: string }>;
  modifyBid: (bidId: string, newAmount: number) => Promise<{ ok: boolean; error?: string }>;
  withdrawBid: (bidId: string) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (patch: Partial<TransporterProfileData>) => void;
}

const TransporterContext = createContext<TransporterContextValue | null>(null);

const emptySession: TransporterSession = {
  isAuthenticated: false,
  profile: null,
  transporterId: null,
  bids: [],
};

// Backend Bid.status (PENDING/ACCEPTED/REJECTED) -> the richer UI-only
// BidStatus used across the existing transporter bidding screens.
function toUiBidStatus(status: string): BidStatus {
  if (status === "ACCEPTED") return "ACCEPTED";
  if (status === "REJECTED") return "REJECTED";
  return "UNDER_REVIEW";
}

function serverBidToRecord(bid: any): BidRecord {
  return {
    id: bid.id,
    shipmentId: bid.orderId,
    bidAmount: bid.bidAmount,
    status: toUiBidStatus(bid.status),
    createdAt: bid.createdAt,
    expiresInHours: bid.status === "PENDING" ? 12 : 0,
  };
}

export function TransporterProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TransporterSession>(emptySession);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TransporterSession;
        setSession(parsed);
      }
    } catch {
      // ignore corrupt storage, start fresh
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: TransporterSession) => {
    setSession(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — prototype still works in-memory for the tab
    }
  }, []);

  // Finds-or-creates the real User+TransporterProfile row backing this
  // session, then pulls that transporter's real bids from the database.
  const syncWithApi = useCallback(async (profile: TransporterProfileData) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: profile.phone, role: "TRANSPORTER", name: profile.name }),
      });
      const data = await res.json();
      if (!res.ok) return { transporterId: null, bids: [] as BidRecord[] };

      const transporterId: string = data.user.id;
      const bidsRes = await fetch(`/api/bids?transporterId=${transporterId}`);
      const bidsData = await bidsRes.json().catch(() => ({ bids: [] }));
      const bids: BidRecord[] = (bidsData.bids ?? []).map(serverBidToRecord);
      return { transporterId, bids };
    } catch {
      return { transporterId: null, bids: [] as BidRecord[] };
    }
  }, []);

  const login = useCallback(
    async (profile: TransporterProfileData) => {
      const { transporterId, bids } = await syncWithApi(profile);
      persist({ isAuthenticated: true, profile, transporterId, bids });
    },
    [persist, syncWithApi]
  );

  const loginWithDemoAccount = useCallback(async () => {
    const { transporterId, bids } = await syncWithApi(DEMO_TRANSPORTER);
    persist({ isAuthenticated: true, profile: DEMO_TRANSPORTER, transporterId, bids });
  }, [persist, syncWithApi]);

  const completeOnboarding = useCallback(
    async (profile: TransporterProfileData) => {
      const { transporterId, bids } = await syncWithApi(profile);
      persist({ isAuthenticated: true, profile, transporterId, bids });
    },
    [persist, syncWithApi]
  );

  const logout = useCallback(() => {
    persist(emptySession);
  }, [persist]);

  const refreshBids = useCallback(async () => {
    if (!session.transporterId) return;
    try {
      const res = await fetch(`/api/bids?transporterId=${session.transporterId}`);
      const data = await res.json();
      persist({ ...session, bids: (data.bids ?? []).map(serverBidToRecord) });
    } catch {
      // best-effort refresh — keep existing local bids on failure
    }
  }, [persist, session]);

  const placeBid = useCallback(
    async (shipmentId: string, bidAmount: number) => {
      if (!session.transporterId) {
        return { ok: false, error: "You need to be logged in to bid." };
      }
      try {
        const res = await fetch(`/api/orders/${shipmentId}/bids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transporterId: session.transporterId, bidAmount }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Could not place bid." };

        const newRecord = serverBidToRecord(data.bid);
        const withoutOld = session.bids.filter((b) => b.id !== newRecord.id);
        persist({ ...session, bids: [newRecord, ...withoutOld] });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the server. Please try again." };
      }
    },
    [persist, session]
  );

  const modifyBid = useCallback(
    async (bidId: string, newAmount: number) => {
      try {
        const res = await fetch(`/api/bids/${bidId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bidAmount: newAmount }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Could not modify bid." };

        persist({
          ...session,
          bids: session.bids.map((b) => (b.id === bidId ? serverBidToRecord(data.bid) : b)),
        });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the server. Please try again." };
      }
    },
    [persist, session]
  );

  const withdrawBid = useCallback(
    async (bidId: string) => {
      try {
        const res = await fetch(`/api/bids/${bidId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error ?? "Could not withdraw bid." };
        }
        persist({ ...session, bids: session.bids.filter((b) => b.id !== bidId) });
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the server. Please try again." };
      }
    },
    [persist, session]
  );

  const updateProfile = useCallback(
    (patch: Partial<TransporterProfileData>) => {
      if (!session.profile) return;
      persist({ ...session, profile: { ...session.profile, ...patch } });
    },
    [persist, session]
  );

  const value = useMemo<TransporterContextValue>(
    () => ({
      ...session,
      hydrated,
      login,
      loginWithDemoAccount,
      completeOnboarding,
      logout,
      refreshBids,
      placeBid,
      modifyBid,
      withdrawBid,
      updateProfile,
    }),
    [
      session,
      hydrated,
      login,
      loginWithDemoAccount,
      completeOnboarding,
      logout,
      refreshBids,
      placeBid,
      modifyBid,
      withdrawBid,
      updateProfile,
    ]
  );

  return (
    <TransporterContext.Provider value={value}>
      {children}
    </TransporterContext.Provider>
  );
}

export function useTransporter() {
  const ctx = useContext(TransporterContext);
  if (!ctx) {
    throw new Error("useTransporter must be used within a TransporterProvider");
  }
  return ctx;
}
