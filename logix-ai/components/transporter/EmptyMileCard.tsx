import Link from "next/link";
import { Zap, TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

export function EmptyMileCard() {
  return (
    <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-navy-800 to-navy-700 p-6 text-white shadow-soft sm:p-8">
      <div className="flex items-center gap-2 text-skyline-300">
        <Zap className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">Backhaul optimization</span>
      </div>
      <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
        Turn Empty Miles Into Profitable Miles
      </h2>
      <p className="mt-1 text-sm text-navy-100">Current trip: Delhi → Mumbai</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-1.5 text-rose-300">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Without Logix AI</span>
          </div>
          <p className="mt-2 text-sm text-navy-100">Return journey: 1,420 km empty</p>
          <p className="mt-1 text-lg font-extrabold text-rose-300">− {formatINR(24000)}</p>
          <p className="text-xs text-navy-200">Estimated empty-trip loss</p>
        </div>

        <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Logix AI recommendation</span>
          </div>
          <p className="mt-2 text-sm text-navy-100">Mumbai → Pune shipment available</p>
          <p className="mt-1 text-xs text-navy-200">Additional distance: 85 km</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-300">+ {formatINR(18500)}</p>
          <p className="text-xs text-navy-200">Additional earnings · 1,335 km empty km reduced</p>
        </div>
      </div>

      <Link
        href="/transporter/dashboard/shipments/shp-008"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 shadow-soft transition-colors hover:bg-skyline-50"
      >
        View this backhaul match
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
