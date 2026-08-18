import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ==================================================
// GET /api/orders/[id]
// Full order detail + every bid received, for the shipper's order
// detail / bid-comparison screen. Also used by the transporter's
// shipment detail + bid screen (bids array is simply empty/irrelevant
// there).
//
// Contact-info rule: a transporter's phone number is only included
// once THEIR bid has been ACCEPTED — enforced here server-side, not
// just hidden in the UI, so it can never leak before acceptance.
// ==================================================
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      shipper: { include: { shipperProfile: true } },
      bids: {
        orderBy: { bidAmount: "asc" },
        include: { transporter: { include: { transporterProfile: true } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const acceptedBid = order.bids.find((b) => b.status === "ACCEPTED");

  const result = {
    id: order.id,
    pickupLocation: order.pickupLocation,
    pickupAddress: order.pickupAddress,
    pickupDateTime: order.pickupDateTime,
    dropLocation: order.dropLocation,
    dropAddress: order.dropAddress,
    distanceKm: order.distanceKm,
    productType: order.productType,
    weightKg: order.weightKg,
    volume: order.volume,
    packageCount: order.packageCount,
    dimensions: order.dimensions,
    isFragile: order.isFragile,
    isTemperatureSensitive: order.isTemperatureSensitive,
    specialHandlingNotes: order.specialHandlingNotes,
    truckTypeRequired: order.truckTypeRequired,
    minCapacityTons: order.minCapacityTons,
    pricingType: order.pricingType,
    proposedRate: order.proposedRate,
    minRate: order.minRate,
    maxRate: order.maxRate,
    deliveryDeadline: order.deliveryDeadline,
    status: order.status,
    createdAt: order.createdAt,
    bidCount: order.bids.length,
    shipper: {
      name: order.shipper.name,
      companyName: order.shipper.shipperProfile?.companyName ?? order.shipper.name,
      rating: order.shipper.shipperProfile?.rating ?? 0,
    },
    acceptedTransporter: acceptedBid
      ? {
          name: acceptedBid.transporter.name,
          phone: acceptedBid.transporter.phone,
          vehicleType: acceptedBid.transporter.transporterProfile?.vehicleType ?? "",
          vehicleNumber: acceptedBid.transporter.transporterProfile?.vehicleNumber ?? "",
        }
      : null,
    acceptedBidAmount: acceptedBid?.bidAmount ?? null,
    bids: order.bids.map((bid) => ({
      id: bid.id,
      orderId: bid.orderId,
      bidAmount: bid.bidAmount,
      status: bid.status,
      createdAt: bid.createdAt,
      transporter: {
        id: bid.transporter.id,
        name: bid.transporter.name,
        // Contact info only becomes available once this specific bid is accepted.
        phone: bid.status === "ACCEPTED" ? bid.transporter.phone : null,
        rating: bid.transporter.transporterProfile?.rating ?? 0,
        totalTrips: bid.transporter.transporterProfile?.totalTrips ?? 0,
        vehicleType: bid.transporter.transporterProfile?.vehicleType ?? "",
        vehicleNumber: bid.transporter.transporterProfile?.vehicleNumber ?? "",
        vehicleCapacity: bid.transporter.transporterProfile?.vehicleCapacity ?? 0,
        kycStatus: bid.transporter.transporterProfile?.kycStatus ?? "PENDING",
      },
    })),
  };

  return NextResponse.json({ order: result });
}
