import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ==================================================
// GET /api/bids?transporterId=X — "My Bids" for a transporter.
// ==================================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transporterId = searchParams.get("transporterId");

  if (!transporterId) {
    return NextResponse.json({ error: "transporterId is required." }, { status: 400 });
  }

  const bids = await prisma.bid.findMany({
    where: { transporterId },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        include: { shipper: { include: { shipperProfile: true } } },
      },
    },
  });

  const result = bids.map((bid) => ({
    id: bid.id,
    orderId: bid.orderId,
    bidAmount: bid.bidAmount,
    status: bid.status,
    createdAt: bid.createdAt,
    order: {
      id: bid.order.id,
      pickupLocation: bid.order.pickupLocation,
      dropLocation: bid.order.dropLocation,
      distanceKm: bid.order.distanceKm,
      productType: bid.order.productType,
      truckTypeRequired: bid.order.truckTypeRequired,
      proposedRate: bid.order.proposedRate,
      minRate: bid.order.minRate,
      maxRate: bid.order.maxRate,
      status: bid.order.status,
      shipperCompany: bid.order.shipper.shipperProfile?.companyName ?? bid.order.shipper.name,
    },
  }));

  return NextResponse.json({ bids: result });
}
