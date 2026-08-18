import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

// ==================================================
// POST /api/auth/login
// --------------------------------------------------
// Prototype-only auth (no real password check — matches the existing
// transporter login flow, which is also a mock/demo login). This route
// is what makes that mock login "real": it finds or creates an actual
// User + profile row in the database and returns its id, so every
// order/bid the person creates afterwards is attached to a real
// database record instead of only living in localStorage.
//
// Body: { phone: string, role: "TRANSPORTER" | "SHIPPER", name?: string }
// ==================================================

function fakeHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const role = body?.role === "SHIPPER" ? "SHIPPER" : "TRANSPORTER";
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : null;

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { phone },
    include: { transporterProfile: true, shipperProfile: true },
  });

  if (existing) {
    return NextResponse.json({ user: existing });
  }

  const email = `${phone.replace(/\s+/g, "")}@logixai.demo`;

  const created =
    role === "SHIPPER"
      ? await prisma.user.create({
          data: {
            name: name ?? "New Shipper",
            role: "SHIPPER",
            email,
            phone,
            passwordHash: fakeHash(phone),
            shipperProfile: {
              create: {
                companyName: name ? `${name} Trading Co.` : "New Shipper Account",
                address: "",
                kycStatus: "PENDING",
                rating: 0,
                totalOrders: 0,
              },
            },
          },
          include: { transporterProfile: true, shipperProfile: true },
        })
      : await prisma.user.create({
          data: {
            name: name ?? "New Transporter",
            role: "TRANSPORTER",
            email,
            phone,
            passwordHash: fakeHash(phone),
            transporterProfile: {
              create: {
                drivingLicenseNumber: `DL-${phone}`,
                vehicleType: "Open Truck",
                vehicleNumber: `NEW${phone}`,
                vehicleCapacity: 10,
                kycStatus: "PENDING",
                preferredRadiusKm: 100,
                rating: 0,
                totalTrips: 0,
              },
            },
          },
          include: { transporterProfile: true, shipperProfile: true },
        });

  return NextResponse.json({ user: created });
}
