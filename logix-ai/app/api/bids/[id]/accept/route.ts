import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ==================================================
// POST /api/bids/[id]/accept
// Shipper accepts a bid. Atomically:
//   1. Selected bid -> ACCEPTED
//   2. All other bids on that order -> REJECTED
//   3. Order status -> BID_ACCEPTED
//   4. Notification created for the winning transporter
// Guards against double-acceptance: if the order already has an
// accepted bid, returns 409 with the current accepted transporter.
// ==================================================
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const bid = await prisma.bid.findUnique({
    where: { id: params.id },
    include: { order: true, transporter: true },
  });

  if (!bid) {
    return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  }

  if (bid.order.status !== "PENDING") {
    // Already has an accepted bid (or otherwise progressed) — don't allow
    // a second acceptance. Surface who's already assigned.
    const existingAccepted = await prisma.bid.findFirst({
      where: { orderId: bid.orderId, status: "ACCEPTED" },
      include: { transporter: true },
    });
    return NextResponse.json(
      {
        error: "This order already has an accepted transporter.",
        acceptedTransporter: existingAccepted
          ? { name: existingAccepted.transporter.name, phone: existingAccepted.transporter.phone }
          : null,
      },
      { status: 409 }
    );
  }

  const [, , updatedOrder] = await prisma.$transaction([
    prisma.bid.update({ where: { id: bid.id }, data: { status: "ACCEPTED" } }),
    prisma.bid.updateMany({
      where: { orderId: bid.orderId, id: { not: bid.id } },
      data: { status: "REJECTED" },
    }),
    prisma.order.update({ where: { id: bid.orderId }, data: { status: "BID_ACCEPTED" } }),
    prisma.notification.create({
      data: {
        userId: bid.transporterId,
        title: "Bid accepted!",
        message: `Your bid for order #${bid.orderId.slice(-6).toUpperCase()} (${bid.order.pickupLocation} → ${bid.order.dropLocation}) has been accepted.`,
        type: "BID_UPDATE",
      },
    }),
  ]);

  return NextResponse.json({
    order: updatedOrder,
    transporter: { name: bid.transporter.name, phone: bid.transporter.phone },
  });
}
