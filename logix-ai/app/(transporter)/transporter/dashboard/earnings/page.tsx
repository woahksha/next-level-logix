"use client";

import { IndianRupee, Fuel, Route as RouteIcon, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { EarningsTrendChart } from "@/components/transporter/EarningsTrendChart";
import { StatCard } from "@/components/ui/StatCard";
import { MOCK_EARNINGS_TREND, EARNINGS_SUMMARY } from "@/data/transporter-mock";
import { formatINR } from "@/lib/utils";

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy-800">Earnings & Profit</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your income, costs, and net profit across trips.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Today's earnings" value={formatINR(EARNINGS_SUMMARY.todayINR)} accent="emerald" />
        <StatCard icon={TrendingUp} label="This week" value={formatINR(EARNINGS_SUMMARY.thisWeekINR)} accent="skyline" />
        <StatCard icon={TrendingUp} label="This month" value={formatINR(EARNINGS_SUMMARY.thisMonthINR)} accent="skyline" />
        <StatCard icon={Wallet} label="Avg. per trip" value={formatINR(EARNINGS_SUMMARY.avgPerTripINR)} accent="navy" />
        <StatCard icon={Fuel} label="Est. fuel cost" value={formatINR(EARNINGS_SUMMARY.fuelCostEstimateINR)} hint="This month" accent="navy" />
        <StatCard icon={RouteIcon} label="Est. toll cost" value={formatINR(EARNINGS_SUMMARY.tollCostEstimateINR)} hint="This month" accent="navy" />
        <StatCard icon={PiggyBank} label="Net profit" value={formatINR(EARNINGS_SUMMARY.netProfitINR)} hint="After fuel & toll" accent="emerald" />
        <StatCard icon={RouteIcon} label="Backhaul earnings" value={formatINR(EARNINGS_SUMMARY.backhaulEarningsINR)} hint="From return-leg loads" accent="emerald" />
      </div>

      <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Last 6 weeks</p>
            <p className="text-2xl font-extrabold text-navy-800">
              {formatINR(MOCK_EARNINGS_TREND.reduce((sum, w) => sum + w.earningsINR, 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Weekly average</p>
            <p className="text-lg font-bold text-skyline-700">
              {formatINR(Math.round(MOCK_EARNINGS_TREND.reduce((sum, w) => sum + w.earningsINR, 0) / MOCK_EARNINGS_TREND.length))}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <EarningsTrendChart data={MOCK_EARNINGS_TREND} />
        </div>
      </div>
    </div>
  );
}
