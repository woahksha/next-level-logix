import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ==================================================
// POST /api/orders/[id]/bids — a transporter places (or updates) a
// bid on an order. If this transporter already has a PENDING bid on
// this order, it's updated in place rather than creating a duplicate.
// ==================================================
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const transporterId = typeof body?.transporterId === "string" ? body.transporterId : "";
  const bidAmount = Number(body?.bidAmount);

  if (!transporterId) {
    return NextResponse.json({ error: "You must be logged in as a transporter to bid." }, { status: 400 });
  }
  if (!bidAmount || Number.isNaN(bidAmount) || bidAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid amount." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "This order is no longer accepting bids." }, { status: 409 });
  }

  const existingBid = await prisma.bid.findFirst({
    where: { orderId: order.id, transporterId, status: "PENDING" },
  });

  const bid = existingBid
    ? await prisma.bid.update({ where: { id: existingBid.id }, data: { bidAmount } })
    : await prisma.bid.create({
        data: { orderId: order.id, transporterId, bidAmount, status: "PENDING" },
      });

  return NextResponse.json({ bid }, { status: existingBid ? 200 : 201 });
}
