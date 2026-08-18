import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Truck, Weight, CalendarClock, Building2, Star, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { mapOrderToShipmentListing } from "@/lib/transporter-mappers";
import { Badge } from "@/components/ui/Badge";
import { LeaveNowVsLaterCard } from "@/components/transporter/LeaveNowVsLaterCard";
import { AIPricingCard } from "@/components/transporter/AIPricingCard";
import { BidForm } from "@/components/transporter/BidForm";
import { CallShipperButton } from "@/components/transporter/CallShipperButton";
import { formatINR } from "@/lib/utils";
import { getLeaveNowVsLaterComparison } from "@/services/demandService";

const demandTone = {
  High: "success",
  Medium: "warning",
  Low: "neutral",
} as const;

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { shipper: { include: { shipperProfile: true } } },
  });
  if (!order) notFound();

  const shipment = mapOrderToShipmentListing({
    id: order.id,
    pickupLocation: order.pickupLocation,
    dropLocation: order.dropLocation,
    distanceKm: order.distanceKm,
    productType: order.productType,
    truckTypeRequired: order.truckTypeRequired,
    weightKg: order.weightKg,
    isFragile: order.isFragile,
    isTemperatureSensitive: order.isTemperatureSensitive,
    specialHandlingNotes: order.specialHandlingNotes,
    pickupDateTime: order.pickupDateTime,
    deliveryDeadline: order.deliveryDeadline,
    pricingType: order.pricingType,
    proposedRate: order.proposedRate,
    minRate: order.minRate,
    maxRate: order.maxRate,
    createdAt: order.createdAt,
    shipper: {
      name: order.shipper.name,
      companyName: order.shipper.shipperProfile?.companyName ?? order.shipper.name,
      rating: order.shipper.shipperProfile?.rating ?? 0,
    },
  });

  const leaveComparison = getLeaveNowVsLaterComparison({
    pickupCity: shipment.pickupLocation,
    dropCity: shipment.dropLocation,
    truckType: shipment.truckTypeRequired,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/transporter/dashboard/shipments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shipments
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xl font-extrabold text-navy-800">
                <MapPin className="h-5 w-5 text-skyline-500" />
                {shipment.pickupLocation}
                <span className="text-neutral-300">→</span>
                {shipment.dropLocation}
              </div>
              <div className="flex gap-2">
                {shipment.isBackhaulMatch && <Badge tone="info">Backhaul match</Badge>}
                <Badge tone={demandTone[shipment.demandLevel]}>{shipment.demandLevel} demand</Badge>
              </div>
            </div>

            {shipment.backhaulNote && (
              <p className="mt-2 text-sm font-medium text-skyline-700">{shipment.backhaulNote}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neutral-400" />
                Posted by <span className="font-semibold text-navy-800">{shipment.shipperCompany}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {shipment.shipperRating.toFixed(1)} shipper rating
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-surface-border pt-5 sm:grid-cols-4">
              <Detail icon={MapPin} label="Distance" value={`${shipment.distanceKm} km`} />
              <Detail icon={Package} label="Cargo type" value={shipment.productType} />
              <Detail icon={Truck} label="Truck required" value={shipment.truckTypeRequired} />
              <Detail icon={Weight} label="Load" value={`${(shipment.weightKg / 1000).toLocaleString("en-IN")} tons`} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-surface-border pt-4 text-sm text-neutral-600 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neutral-400" />
                Pickup: <span className="font-semibold text-navy-800">{shipment.pickupWindow}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neutral-400" />
                Delivery deadline: <span className="font-semibold text-navy-800">{shipment.deliveryDeadline}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Wallet className="h-4 w-4 text-neutral-400" />
                Payment terms: <span className="font-semibold text-navy-800">{shipment.paymentTerms}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-surface-border pt-5 text-center">
              <div>
                <p className="text-xs text-neutral-500">Min bid allowed</p>
                <p className="text-base font-bold text-navy-800">{formatINR(shipment.minRate)}</p>
              </div>
              <div className="rounded-xl bg-skyline-50 py-1">
                <p className="text-xs text-skyline-700">Shipper&apos;s asking price</p>
                <p className="text-base font-bold text-skyline-700">{formatINR(shipment.recommendedRate)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Max bid allowed</p>
                <p className="text-base font-bold text-navy-800">{formatINR(shipment.maxRate)}</p>
              </div>
            </div>
          </div>

          <AIPricingCard shipment={shipment} />

          <LeaveNowVsLaterCard comparison={leaveComparison} />
        </div>

        <div className="space-y-4">
          <BidForm shipment={shipment} />
          <CallShipperButton shipperCompany={shipment.shipperCompany} />
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-navy-800">{value}</p>
    </div>
  );
}
