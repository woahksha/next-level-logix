"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneCall } from "lucide-react";

export function CallShipperButton({ shipperCompany }: { shipperCompany: string }) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowToast(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 shadow-soft transition-colors hover:bg-navy-50"
      >
        <Phone className="h-4 w-4" />
        Call Shipper
      </button>

      {showToast && (
        <div
          role="status"
          className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-10 flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-800 px-4 py-3 text-sm font-semibold text-white shadow-soft"
        >
          <PhoneCall className="h-4 w-4 shrink-0 text-skyline-300" />
          Demo call initiated to {shipperCompany}.
        </div>
      )}
    </div>
  );
}
