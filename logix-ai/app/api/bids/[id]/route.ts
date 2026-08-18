import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ==================================================
// PATCH /api/bids/[id] — modify a bid amount (only while PENDING).
// DELETE /api/bids/[id] — withdraw a bid (only while PENDING).
// ==================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const bidAmount = Number(body?.bidAmount);
  if (!bidAmount || Number.isNaN(bidAmount) || bidAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid amount." }, { status: 400 });
  }

  const bid = await prisma.bid.findUnique({ where: { id: params.id } });
  if (!bid) return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  if (bid.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending bids can be modified." }, { status: 409 });
  }

  const updated = await prisma.bid.update({ where: { id: bid.id }, data: { bidAmount } });
  return NextResponse.json({ bid: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const bid = await prisma.bid.findUnique({ where: { id: params.id } });
  if (!bid) return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  if (bid.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending bids can be withdrawn." }, { status: 409 });
  }

  await prisma.bid.delete({ where: { id: bid.id } });
  return NextResponse.json({ ok: true });
}
