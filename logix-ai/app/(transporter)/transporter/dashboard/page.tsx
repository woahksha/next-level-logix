"use client";

import Link from "next/link";
import { IndianRupee, Star, Gavel, Gauge, Route as RouteIcon, PackageCheck, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ShipmentCard } from "@/components/transporter/ShipmentCard";
import { EmptyMileCard } from "@/components/transporter/EmptyMileCard";
import { useTransporter } from "@/hooks/useTransporter";
import { MOCK_SHIPMENTS, EARNINGS_SUMMARY } from "@/data/transporter-mock";
import { formatINR } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TransporterOverviewPage() {
  const { profile, bids } = useTransporter();

  if (!profile) return null;

  const activeBidsCount = bids.filter((b) => b.status === "UNDER_REVIEW" || b.status === "LEADING").length;
  const activeLoadsCount = bids.filter((b) => b.status === "ACCEPTED").length + 1; // +1 for the in-progress demo trip
  const recommended = MOCK_SHIPMENTS.filter((s) => s.isBackhaulMatch).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-navy-800 to-navy-700 p-6 text-white shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-navy-100">{getGreeting()},</p>
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-navy-100">
              {profile.vehicleCategory} · {profile.vehicleNumber} · {profile.vehicleCapacityTons}T capacity · currently in {profile.currentLocation}
            </p>
          </div>
          <Badge tone={profile.kycStatus === "VERIFIED" ? "success" : "warning"} className="bg-white/10 text-white border-white/20">
            KYC {profile.kycStatus === "VERIFIED" ? "Verified" : profile.kycStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={IndianRupee} label="Total earnings" value={formatINR(EARNINGS_SUMMARY.thisMonthINR, { compact: true })} hint="This month" accent="emerald" />
        <StatCard icon={PackageCheck} label="Active loads" value={String(activeLoadsCount)} hint="In progress" accent="navy" />
        <StatCard icon={Gavel} label="Active bids" value={String(activeBidsCount)} hint="Awaiting shipper response" accent="navy" />
        <StatCard icon={Gauge} label="Truck utilization" value="78%" hint="Loaded vs. idle days" accent="skyline" />
        <StatCard icon={RouteIcon} label="Empty KM reduced" value="1,240 km" hint="Via backhaul matching" accent="skyline" />
        <StatCard icon={Star} label="Rating" value={profile.rating ? profile.rating.toFixed(1) : "New"} hint={`${profile.totalTrips} trips completed`} accent="emerald" />
      </div>

      <EmptyMileCard />

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-800">Recommended Loads</h2>
          <Link href="/transporter/dashboard/shipments" className="inline-flex items-center gap-1 text-sm font-semibold text-skyline-600 hover:text-skyline-700">
            View all shipments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Backhaul-matched loads along your preferred route, ranked by fit.
        </p>
        <div className="mt-4 grid gap-4">
          {recommended.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      </div>
    </div>
  );
}
