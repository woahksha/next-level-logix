import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CITY_COORDS, haversineDistanceKm } from "@/lib/geo";
import type { OrderStatus } from "@/types/shipper";

// ==================================================
// GET /api/orders?shipperId=&status=
// - shipperId  -> "My Orders" for a shipper
// - status     -> "Available Loads" for transporters (status=PENDING)
// Returns list-view summaries (no per-bid detail — see /api/orders/[id]
// for that).
// ==================================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shipperId = searchParams.get("shipperId") ?? undefined;
  const status = searchParams.get("status") as OrderStatus | null;

  const orders = await prisma.order.findMany({
    where: {
      ...(shipperId ? { shipperId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      shipper: { include: { shipperProfile: true } },
      bids: {
        where: { status: "ACCEPTED" },
        include: { transporter: { include: { transporterProfile: true } } },
      },
      _count: { select: { bids: true } },
    },
  });

  const result = orders.map((order) => {
    const acceptedBid = order.bids[0];
    return {
      id: order.id,
      pickupLocation: order.pickupLocation,
      dropLocation: order.dropLocation,
      distanceKm: order.distanceKm,
      productType: order.productType,
      weightKg: order.weightKg,
      isFragile: order.isFragile,
      isTemperatureSensitive: order.isTemperatureSensitive,
      specialHandlingNotes: order.specialHandlingNotes,
      truckTypeRequired: order.truckTypeRequired,
      pricingType: order.pricingType,
      proposedRate: order.proposedRate,
      minRate: order.minRate,
      maxRate: order.maxRate,
      deliveryDeadline: order.deliveryDeadline,
      pickupDateTime: order.pickupDateTime,
      status: order.status,
      createdAt: order.createdAt,
      bidCount: order._count.bids,
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
    };
  });

  return NextResponse.json({ orders: result });
}

// ==================================================
// POST /api/orders — create a new shipment order.
// Validates the form server-side, calculates distanceKm via the
// Haversine formula against the static Indian city dataset (no maps
// API), then creates the Order.
// ==================================================
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fieldErrors: Record<string, string> = {};

  const shipperId = typeof body.shipperId === "string" ? body.shipperId : "";
  const pickupCity = typeof body.pickupCity === "string" ? body.pickupCity.trim() : "";
  const pickupAddress = typeof body.pickupAddress === "string" ? body.pickupAddress.trim() : "";
  const pickupDate = typeof body.pickupDate === "string" ? body.pickupDate : "";
  const pickupTime = typeof body.pickupTime === "string" ? body.pickupTime : "";
  const dropCity = typeof body.dropCity === "string" ? body.dropCity.trim() : "";
  const dropAddress = typeof body.dropAddress === "string" ? body.dropAddress.trim() : "";
  const deliveryDeadlineRaw = typeof body.deliveryDeadline === "string" ? body.deliveryDeadline : "";
  const productType = typeof body.productType === "string" ? body.productType.trim() : "";
  const weightKg = Number(body.weightKg);
  const volume = body.volume !== "" && body.volume != null ? Number(body.volume) : null;
  const packageCount = body.packageCount !== "" && body.packageCount != null ? Number(body.packageCount) : null;
  const dimensions = typeof body.dimensions === "string" ? body.dimensions.trim() : "";
  const isFragile = Boolean(body.isFragile);
  const isTemperatureSensitive = Boolean(body.isTemperatureSensitive);
  const specialHandlingNotes = typeof body.specialHandlingNotes === "string" ? body.specialHandlingNotes.trim() : "";
  const truckTypeRequired = typeof body.truckTypeRequired === "string" ? body.truckTypeRequired.trim() : "";
  const minCapacityTons = body.minCapacityTons !== "" && body.minCapacityTons != null ? Number(body.minCapacityTons) : null;
  const pricingType = body.pricingType === "NEGOTIABLE" ? "NEGOTIABLE" : "FIXED";
  const fixedPrice = body.fixedPrice !== "" && body.fixedPrice != null ? Number(body.fixedPrice) : null;
  const minPrice = body.minPrice !== "" && body.minPrice != null ? Number(body.minPrice) : null;
  const maxPrice = body.maxPrice !== "" && body.maxPrice != null ? Number(body.maxPrice) : null;

  if (!shipperId) fieldErrors.shipperId = "You must be logged in to post an order.";
  if (!pickupCity || !CITY_COORDS[pickupCity]) fieldErrors.pickupCity = "Select a valid pickup city.";
  if (!pickupAddress) fieldErrors.pickupAddress = "Pickup address is required.";
  if (!pickupDate || !pickupTime) fieldErrors.pickupDateTime = "Pickup date and time are required.";
  if (!dropCity || !CITY_COORDS[dropCity]) fieldErrors.dropCity = "Select a valid delivery city.";
  if (!dropAddress) fieldErrors.dropAddress = "Delivery address is required.";
  if (!deliveryDeadlineRaw) fieldErrors.deliveryDeadline = "Delivery deadline is required.";
  if (!productType) fieldErrors.productType = "Product type is required.";
  if (!weightKg || Number.isNaN(weightKg) || weightKg <= 0) fieldErrors.weightKg = "Enter a valid cargo weight.";
  if (packageCount != null && (Number.isNaN(packageCount) || packageCount <= 0)) {
    fieldErrors.packageCount = "Enter a valid number of packages.";
  }
  if (!truckTypeRequired) fieldErrors.truckTypeRequired = "Select the required truck type.";
  if (minCapacityTons != null && (Number.isNaN(minCapacityTons) || minCapacityTons <= 0)) {
    fieldErrors.minCapacityTons = "Enter a valid minimum capacity.";
  }

  if (pricingType === "FIXED") {
    if (!fixedPrice || Number.isNaN(fixedPrice) || fixedPrice <= 0) {
      fieldErrors.fixedPrice = "Enter a valid fixed price.";
    }
  } else {
    if (!minPrice || Number.isNaN(minPrice) || minPrice <= 0) fieldErrors.minPrice = "Enter a valid minimum price.";
    if (!maxPrice || Number.isNaN(maxPrice) || maxPrice <= 0) fieldErrors.maxPrice = "Enter a valid maximum price.";
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      fieldErrors.minPrice = "Minimum price cannot exceed maximum price.";
      fieldErrors.maxPrice = "Maximum price must be greater than or equal to minimum price.";
    }
  }

  let pickupDateTime: Date | null = null;
  let deliveryDeadline: Date | null = null;
  if (pickupDate && pickupTime) {
    pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
    if (Number.isNaN(pickupDateTime.getTime())) {
      fieldErrors.pickupDateTime = "Enter a valid pickup date and time.";
      pickupDateTime = null;
    }
  }
  if (deliveryDeadlineRaw) {
    deliveryDeadline = new Date(deliveryDeadlineRaw);
    if (Number.isNaN(deliveryDeadline.getTime())) {
      fieldErrors.deliveryDeadline = "Enter a valid delivery deadline.";
      deliveryDeadline = null;
    }
  }
  if (pickupDateTime && deliveryDeadline && deliveryDeadline < pickupDateTime) {
    fieldErrors.deliveryDeadline = "Delivery deadline must be after pickup.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const distanceKm = haversineDistanceKm(pickupCity, dropCity);
  if (distanceKm == null) {
    return NextResponse.json(
      { error: "Could not calculate distance for the selected cities.", fieldErrors: { pickupCity: "Unsupported city" } },
      { status: 400 }
    );
  }

  const proposedRate = pricingType === "FIXED" ? (fixedPrice as number) : Math.round(((minPrice as number) + (maxPrice as number)) / 2);

  try {
    const order = await prisma.order.create({
      data: {
        shipperId,
        pickupLocation: pickupCity,
        pickupAddress,
        pickupDateTime: pickupDateTime as Date,
        pickupLatitude: CITY_COORDS[pickupCity].lat,
        pickupLongitude: CITY_COORDS[pickupCity].lng,
        dropLocation: dropCity,
        dropAddress,
        dropLatitude: CITY_COORDS[dropCity].lat,
        dropLongitude: CITY_COORDS[dropCity].lng,
        distanceKm,
        productType,
        weightKg,
        volume: volume ?? undefined,
        packageCount: packageCount ?? undefined,
        dimensions: dimensions || undefined,
        isFragile,
        isTemperatureSensitive,
        specialHandlingNotes: specialHandlingNotes || undefined,
        truckTypeRequired,
        minCapacityTons: minCapacityTons ?? undefined,
        pricingType,
        proposedRate,
        minRate: pricingType === "NEGOTIABLE" ? minPrice : undefined,
        maxRate: pricingType === "NEGOTIABLE" ? maxPrice : undefined,
        deliveryDeadline: deliveryDeadline as Date,
        status: "PENDING",
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Failed to create order:", err);
    return NextResponse.json({ error: "Could not create the order. Please try again." }, { status: 500 });
  }
}
