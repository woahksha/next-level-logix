import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  rankTransporters,
  type OrderMatchInput,
  type TransporterCandidateInput,
} from "@/lib/recommendations";

// ==================================================
// GET /api/orders/[id]/recommendations
//
// Ranks the transporters who have bid on this order using the
// Intelligent Transporter Recommendation engine (lib/recommendations.ts).
// This intentionally reuses the existing Bid workflow rather than
// introducing a separate "browse all transporters" concept: in this
// application transporters discover orders and bid on them (see
// app/(transporter)/transporter/dashboard/shipments), so the set of
// transporters a shipper can actually choose between IS the set of
// bidders on the order. "Select Transporter" in the UI calls the
// existing POST /api/bids/[id]/accept endpoint — no new assignment
// system was introduced.
//
// Every input used for scoring is real data already in the database:
//   - capacity / truck type / rating / totalTrips / kycStatus  -> TransporterProfile
//   - preferredRouteFrom / preferredRouteTo                    -> TransporterProfile
//   - bid amount                                                -> Bid
//   - route experience (deliveredOnRouteCount)                  -> derived from
//     Bid+Order history (ACCEPTED bids on DELIVERED orders with the
//     same pickup/drop pair) — never fabricated demo history.
//   - availability (currentlyBusy)                              -> derived from
//     whether this transporter has another Bid ACCEPTED on an order
//     that is currently BID_ACCEPTED or IN_TRANSIT.
//
// No new Prisma models/enums/fields were added — see NO DATABASE
// REDESIGN note in the project brief and the "Known limitations"
// section of the final report.
// ==================================================
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      bids: {
        include: { transporter: { include: { transporterProfile: true } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Recommendations only make sense while the order is still collecting
  // bids. Once a transporter is assigned, there's nothing left to rank.
  if (order.status !== "PENDING") {
    return NextResponse.json({
      recommendations: [],
      excludedCount: 0,
      message: "This order already has an assigned transporter.",
    });
  }

  if (order.bids.length === 0) {
    return NextResponse.json({
      recommendations: [],
      excludedCount: 0,
      message: "Complete your shipment details and wait for bids to see transporter recommendations.",
    });
  }

  const orderInput: OrderMatchInput = {
    pickupLocation: order.pickupLocation,
    dropLocation: order.dropLocation,
    weightKg: order.weightKg,
    minCapacityTons: order.minCapacityTons,
    truckTypeRequired: order.truckTypeRequired,
    isTemperatureSensitive: order.isTemperatureSensitive,
    distanceKm: order.distanceKm,
    deliveryDeadline: order.deliveryDeadline,
    pickupDateTime: order.pickupDateTime,
    pricingType: order.pricingType as "FIXED" | "NEGOTIABLE",
    proposedRate: order.proposedRate,
    minRate: order.minRate,
    maxRate: order.maxRate,
  };

  // Only ever consider a transporter's own most relevant bid (PENDING
  // preferred, else their latest) — a transporter can't be recommended
  // twice for the same order.
  const bidsByTransporter = new Map<string, (typeof order.bids)[number]>();
  for (const bid of order.bids) {
    const existing = bidsByTransporter.get(bid.transporterId);
    if (!existing || (existing.status !== "PENDING" && bid.status === "PENDING")) {
      bidsByTransporter.set(bid.transporterId, bid);
    }
  }

  const transporterIds = Array.from(bidsByTransporter.keys());

  // Route experience: real completed-delivery count per transporter on
  // this exact pickup->drop pair.
  const deliveredOnRoute = await prisma.bid.findMany({
    where: {
      transporterId: { in: transporterIds },
      status: "ACCEPTED",
      order: {
        pickupLocation: order.pickupLocation,
        dropLocation: order.dropLocation,
        status: "DELIVERED",
      },
    },
    select: { transporterId: true },
  });
  const routeExperienceCounts = new Map<string, number>();
  for (const bid of deliveredOnRoute) {
    routeExperienceCounts.set(bid.transporterId, (routeExperienceCounts.get(bid.transporterId) ?? 0) + 1);
  }

  // Availability: does this transporter currently have another order
  // that's BID_ACCEPTED or IN_TRANSIT (i.e. already on a job)?
  const activeElsewhere = await prisma.bid.findMany({
    where: {
      transporterId: { in: transporterIds },
      status: "ACCEPTED",
      orderId: { not: order.id },
      order: { status: { in: ["BID_ACCEPTED", "IN_TRANSIT"] } },
    },
    select: { transporterId: true },
  });
  const busyTransporterIds = new Set(activeElsewhere.map((b) => b.transporterId));

  const candidates: TransporterCandidateInput[] = transporterIds.map((transporterId) => {
    const bid = bidsByTransporter.get(transporterId)!;
    const profile = bid.transporter.transporterProfile;

    return {
      transporterId,
      bidId: bid.id,
      name: bid.transporter.name,
      vehicleType: profile?.vehicleType ?? "",
      vehicleCapacityTons: profile?.vehicleCapacity ?? 0,
      rating: profile?.rating ?? 0,
      totalTrips: profile?.totalTrips ?? 0,
      kycStatus: profile?.kycStatus ?? "PENDING",
      preferredRouteFrom: profile?.preferredRouteFrom ?? null,
      preferredRouteTo: profile?.preferredRouteTo ?? null,
      bidAmount: bid.bidAmount,
      deliveredOnRouteCount: routeExperienceCounts.get(transporterId) ?? 0,
      currentlyBusy: busyTransporterIds.has(transporterId),
    };
  });

  const { ranked, excluded } = rankTransporters(candidates, orderInput);

  const recommendations = ranked.map((result) => {
    const candidate = candidates.find((c) => c.transporterId === result.transporterId)!;
    return {
      transporterId: result.transporterId,
      bidId: result.bidId,
      name: result.name,
      vehicleType: candidate.vehicleType,
      vehicleCapacityTons: candidate.vehicleCapacityTons,
      rating: candidate.rating,
      totalTrips: candidate.totalTrips,
      kycStatus: candidate.kycStatus,
      bidAmount: candidate.bidAmount,
      matchScore: result.matchScore,
      factors: result.factors,
      reasons: result.reasons,
      limitations: result.limitations,
    };
  });

  return NextResponse.json({
    recommendations,
    excludedCount: excluded.length,
  });
}
