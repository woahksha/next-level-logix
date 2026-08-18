// ==================================================
// Logix AI — Database Seed Script
// Populates realistic demo data for the hackathon MVP
// ==================================================

import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

// SQLite has no native enum type, so these enums are stored as plain
// `String` columns (see prisma/schema.prisma). The literal-value objects
// below stand in for the enums that used to be exported from
// "@prisma/client", so the rest of this seed script is unchanged.
const OrderStatus = {
  PENDING: "PENDING",
  BID_ACCEPTED: "BID_ACCEPTED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

const BidStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;
type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

const PaymentStatus = {
  PENDING: "PENDING",
  ADVANCE_PAID: "ADVANCE_PAID",
  COMPLETED: "COMPLETED",
} as const;
type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

const KycStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

const NotificationType = {
  ORDER_UPDATE: "ORDER_UPDATE",
  BID_UPDATE: "BID_UPDATE",
  PAYMENT_UPDATE: "PAYMENT_UPDATE",
  SOS_ALERT: "SOS_ALERT",
  GENERAL: "GENERAL",
} as const;
type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

const PricingType = {
  FIXED: "FIXED",
  NEGOTIABLE: "NEGOTIABLE",
} as const;
type PricingType = (typeof PricingType)[keyof typeof PricingType];

const prisma = new PrismaClient();

// NOTE: This is a placeholder hash for seed/demo purposes only.
// Real auth (bcrypt, sessions, etc.) will be built in a later phase.
function fakeHash(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

// --------------------------------------------------
// Indian city coordinates
// --------------------------------------------------
const CITIES = {
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Ghaziabad: { lat: 28.6692, lng: 77.4538 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Noida: { lat: 28.5355, lng: 77.391 },
};

type CityName = keyof typeof CITIES;

// Haversine distance in km, rounded to 1 decimal
function distanceKm(a: CityName, b: CityName) {
  const R = 6371;
  const lat1 = (CITIES[a].lat * Math.PI) / 180;
  const lat2 = (CITIES[b].lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((CITIES[b].lng - CITIES[a].lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c * 10) / 10;
}

async function main() {
  console.log("Clearing existing data...");
  // Delete in dependency order (children first)
  await prisma.proofOfDelivery.deleteMany();
  await prisma.trackingUpdate.deleteMany();
  await prisma.sosAlert.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.order.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.transporterProfile.deleteMany();
  await prisma.shipperProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating transporters...");
  const transporterSeed = [
    {
      name: "Ramesh Kumar",
      city: "Delhi" as CityName,
      phone: "9810000001",
      email: "ramesh.kumar@logixai.demo",
      vehicleType: "Open Truck",
      vehicleNumber: "DL01AB1234",
      capacity: 9,
      license: "DL-0120230001",
      route: ["Delhi", "Jaipur"] as [CityName, CityName],
    },
    {
      name: "Suresh Yadav",
      city: "Ghaziabad" as CityName,
      phone: "9810000002",
      email: "suresh.yadav@logixai.demo",
      vehicleType: "Container Truck",
      vehicleNumber: "UP14CD5678",
      capacity: 15,
      license: "UP-1420220045",
      route: ["Ghaziabad", "Noida"] as [CityName, CityName],
    },
    {
      name: "Vikram Singh",
      city: "Jaipur" as CityName,
      phone: "9810000003",
      email: "vikram.singh@logixai.demo",
      vehicleType: "Mini Truck",
      vehicleNumber: "RJ14EF9012",
      capacity: 5,
      license: "RJ-1420210078",
      route: ["Jaipur", "Ahmedabad"] as [CityName, CityName],
    },
    {
      name: "Anil Sharma",
      city: "Ahmedabad" as CityName,
      phone: "9810000004",
      email: "anil.sharma@logixai.demo",
      vehicleType: "Container Truck",
      vehicleNumber: "GJ01GH3456",
      capacity: 18,
      license: "GJ-0120190033",
      route: ["Ahmedabad", "Mumbai"] as [CityName, CityName],
    },
    {
      name: "Manoj Patel",
      city: "Pune" as CityName,
      phone: "9810000005",
      email: "manoj.patel@logixai.demo",
      vehicleType: "Open Truck",
      vehicleNumber: "MH12IJ7890",
      capacity: 10,
      license: "MH-1220220099",
      route: ["Pune", "Bengaluru"] as [CityName, CityName],
    },
  ];

  const transporters = [];
  for (const t of transporterSeed) {
    const user = await prisma.user.create({
      data: {
        name: t.name,
        role: "TRANSPORTER",
        email: t.email,
        phone: t.phone,
        passwordHash: fakeHash("password123"),
        preferredLanguage: "hi",
        transporterProfile: {
          create: {
            drivingLicenseNumber: t.license,
            vehicleType: t.vehicleType,
            vehicleNumber: t.vehicleNumber,
            vehicleCapacity: t.capacity,
            kycStatus: KycStatus.VERIFIED,
            upiId: `${t.name.split(" ")[0].toLowerCase()}@upi`,
            preferredRadiusKm: 100,
            preferredRouteFrom: t.route[0],
            preferredRouteTo: t.route[1],
            rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
            totalTrips: Math.floor(Math.random() * 40) + 5,
          },
        },
      },
      include: { transporterProfile: true },
    });
    transporters.push({ ...user, city: t.city });
  }

  console.log("Creating shippers...");
  const shipperSeed = [
    {
      name: "Priya Mehta",
      company: "Priya Traders Pvt Ltd",
      city: "Mumbai" as CityName,
      phone: "9820000001",
      email: "priya.mehta@logixai.demo",
      gst: "27ABCDE1234F1Z5",
    },
    {
      name: "Karthik Rao",
      company: "Bengaluru Textiles Pvt Ltd",
      city: "Bengaluru" as CityName,
      phone: "9820000002",
      email: "karthik.rao@logixai.demo",
      gst: "29FGHIJ5678K1Z2",
    },
    {
      name: "Fatima Sheikh",
      company: "Hyderabad Agro Exports",
      city: "Hyderabad" as CityName,
      phone: "9820000003",
      email: "fatima.sheikh@logixai.demo",
      gst: "36KLMNO9012P1Z8",
    },
    {
      name: "Arun Prakash",
      company: "Chennai Electronics Hub",
      city: "Chennai" as CityName,
      phone: "9820000004",
      email: "arun.prakash@logixai.demo",
      gst: "33QRSTU3456V1Z4",
    },
    {
      name: "Neha Gupta",
      company: "Gurugram FastMoving Goods",
      city: "Gurugram" as CityName,
      phone: "9820000005",
      email: "neha.gupta@logixai.demo",
      gst: "06WXYZA7890B1Z6",
    },
  ];

  const shippers = [];
  for (const s of shipperSeed) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        role: "SHIPPER",
        email: s.email,
        phone: s.phone,
        passwordHash: fakeHash("password123"),
        preferredLanguage: "en",
        shipperProfile: {
          create: {
            companyName: s.company,
            gstNumber: s.gst,
            address: `${s.company}, Industrial Area, ${s.city}`,
            kycStatus: KycStatus.VERIFIED,
            rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
            totalOrders: Math.floor(Math.random() * 30) + 5,
          },
        },
      },
      include: { shipperProfile: true },
    });
    shippers.push({ ...user, city: s.city });
  }

  console.log("Creating orders...");
  const orderRoutes: { from: CityName; to: CityName; product: string; truck: string; weight: number; volume: number }[] = [
    { from: "Delhi", to: "Jaipur", product: "Textiles", truck: "Open Truck", weight: 4500, volume: 20 },
    { from: "Mumbai", to: "Pune", product: "Electronics", truck: "Container Truck", weight: 3200, volume: 15 },
    { from: "Ahmedabad", to: "Mumbai", product: "Pharmaceuticals", truck: "Container Truck", weight: 2000, volume: 10 },
    { from: "Bengaluru", to: "Chennai", product: "Auto Parts", truck: "Open Truck", weight: 5000, volume: 22 },
    { from: "Hyderabad", to: "Bengaluru", product: "Agricultural Produce", truck: "Open Truck", weight: 6000, volume: 25 },
    { from: "Chennai", to: "Hyderabad", product: "Furniture", truck: "Container Truck", weight: 4000, volume: 30 },
    { from: "Gurugram", to: "Jaipur", product: "FMCG Goods", truck: "Mini Truck", weight: 1500, volume: 8 },
    { from: "Noida", to: "Ghaziabad", product: "Packaged Food", truck: "Mini Truck", weight: 1200, volume: 6 },
    { from: "Pune", to: "Ahmedabad", product: "Steel Coils", truck: "Container Truck", weight: 8000, volume: 12 },
    { from: "Jaipur", to: "Delhi", product: "Machinery Parts", truck: "Open Truck", weight: 3500, volume: 18 },
  ];

  const orderStatusCycle: OrderStatus[] = [
    OrderStatus.DELIVERED,
    OrderStatus.DELIVERED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.BID_ACCEPTED,
    OrderStatus.PENDING,
  ];

  const orders = [];
  for (let i = 0; i < orderRoutes.length; i++) {
    const r = orderRoutes[i];
    const shipper = shippers[i % shippers.length];
    const dist = distanceKm(r.from, r.to);
    const baseRate = Math.round(dist * (35 + Math.random() * 15)); // ~Rs 35-50/km
    const status = orderStatusCycle[i % orderStatusCycle.length];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (3 + (i % 5)));

    const pickupDateTime = new Date();
    pickupDateTime.setDate(pickupDateTime.getDate() + (i % 3));
    pickupDateTime.setHours(9 + (i % 6), 0, 0, 0);

    const isNegotiable = i % 2 === 0;

    const order = await prisma.order.create({
      data: {
        shipperId: shipper.id,
        pickupLocation: r.from,
        pickupAddress: `Warehouse ${i + 1}, Industrial Area, ${r.from}`,
        pickupDateTime,
        dropLocation: r.to,
        dropAddress: `Consignee Godown ${i + 1}, ${r.to}`,
        pickupLatitude: CITIES[r.from].lat,
        pickupLongitude: CITIES[r.from].lng,
        dropLatitude: CITIES[r.to].lat,
        dropLongitude: CITIES[r.to].lng,
        distanceKm: dist,
        productType: r.product,
        weightKg: r.weight,
        volume: r.volume,
        packageCount: Math.round(r.weight / 50),
        dimensions: `${1 + (i % 3)}m x ${1 + (i % 2)}m x ${1 + (i % 2)}m (per package)`,
        isFragile: i % 3 === 0,
        isTemperatureSensitive: r.product === "Pharmaceuticals" || r.product === "Agricultural Produce",
        truckTypeRequired: r.truck,
        minCapacityTons: Math.ceil(r.weight / 1000),
        specialHandlingNotes: i % 3 === 0 ? "Handle with care, fragile items included" : null,
        pricingType: isNegotiable ? PricingType.NEGOTIABLE : PricingType.FIXED,
        proposedRate: baseRate,
        minRate: isNegotiable ? Math.round(baseRate * 0.9) : null,
        maxRate: isNegotiable ? Math.round(baseRate * 1.15) : null,
        deliveryDeadline: deadline,
        status,
      },
    });
    orders.push(order);
  }

  console.log("Creating bids...");
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    // 2-3 transporters bid on each order
    const bidders = [transporters[i % 5], transporters[(i + 1) % 5], transporters[(i + 2) % 5]];

    for (let b = 0; b < bidders.length; b++) {
      const transporter = bidders[b];
      const amount = Math.round(order.proposedRate * (0.92 + Math.random() * 0.15));
      const isWinner =
        b === 0 &&
        (order.status === OrderStatus.BID_ACCEPTED ||
          order.status === OrderStatus.IN_TRANSIT ||
          order.status === OrderStatus.DELIVERED);

      await prisma.bid.create({
        data: {
          orderId: order.id,
          transporterId: transporter.id,
          bidAmount: amount,
          status: isWinner ? BidStatus.ACCEPTED : order.status === OrderStatus.PENDING ? BidStatus.PENDING : BidStatus.REJECTED,
        },
      });
    }
  }

  console.log("Creating payments...");
  for (const order of orders) {
    if (order.status === OrderStatus.PENDING) continue; // no payment yet

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;
    if (order.status === OrderStatus.BID_ACCEPTED) paymentStatus = PaymentStatus.ADVANCE_PAID;
    if (order.status === OrderStatus.IN_TRANSIT) paymentStatus = PaymentStatus.ADVANCE_PAID;
    if (order.status === OrderStatus.DELIVERED) paymentStatus = PaymentStatus.COMPLETED;

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.proposedRate,
        advancePercent: 30,
        status: paymentStatus,
        transactionId: paymentStatus !== PaymentStatus.PENDING ? `TXN${order.id.slice(-8).toUpperCase()}` : null,
      },
    });
  }

  console.log("Creating tracking updates for in-transit/delivered orders...");
  for (const order of orders) {
    if (order.status !== OrderStatus.IN_TRANSIT && order.status !== OrderStatus.DELIVERED) continue;

    await prisma.trackingUpdate.create({
      data: {
        orderId: order.id,
        latitude: order.pickupLatitude,
        longitude: order.pickupLongitude,
        status: OrderStatus.BID_ACCEPTED,
        note: "Shipment picked up",
      },
    });
    await prisma.trackingUpdate.create({
      data: {
        orderId: order.id,
        latitude: (order.pickupLatitude + order.dropLatitude) / 2,
        longitude: (order.pickupLongitude + order.dropLongitude) / 2,
        status: OrderStatus.IN_TRANSIT,
        note: "Shipment in transit, midway checkpoint",
      },
    });
    if (order.status === OrderStatus.DELIVERED) {
      await prisma.trackingUpdate.create({
        data: {
          orderId: order.id,
          latitude: order.dropLatitude,
          longitude: order.dropLongitude,
          status: OrderStatus.DELIVERED,
          note: "Shipment delivered to consignee",
        },
      });
      await prisma.proofOfDelivery.create({
        data: {
          orderId: order.id,
          imageUrl: `https://picsum.photos/seed/${order.id}/600/400`,
          signatureUrl: `https://picsum.photos/seed/${order.id}-sign/300/150`,
          receivedByName: "Warehouse Manager",
          notes: "Goods received in good condition",
        },
      });
    }
  }

  console.log("Creating ratings for delivered orders...");
  for (const order of orders) {
    if (order.status !== OrderStatus.DELIVERED) continue;

    const acceptedBid = await prisma.bid.findFirst({
      where: { orderId: order.id, status: BidStatus.ACCEPTED },
    });
    if (!acceptedBid) continue;

    // Shipper rates transporter
    await prisma.rating.create({
      data: {
        orderId: order.id,
        fromUserId: order.shipperId,
        toUserId: acceptedBid.transporterId,
        score: Math.floor(Math.random() * 2) + 4, // 4-5
        comment: "On-time delivery, goods handled well.",
      },
    });

    // Transporter rates shipper
    await prisma.rating.create({
      data: {
        orderId: order.id,
        fromUserId: acceptedBid.transporterId,
        toUserId: order.shipperId,
        score: Math.floor(Math.random() * 2) + 4, // 4-5
        comment: "Clear pickup instructions, smooth loading.",
      },
    });
  }

  console.log("Creating a demo SOS alert...");
  const inTransitOrder = orders.find((o) => o.status === OrderStatus.IN_TRANSIT);
  if (inTransitOrder) {
    const bid = await prisma.bid.findFirst({
      where: { orderId: inTransitOrder.id, status: BidStatus.ACCEPTED },
    });
    if (bid) {
      await prisma.sosAlert.create({
        data: {
          orderId: inTransitOrder.id,
          userId: bid.transporterId,
          latitude: (inTransitOrder.pickupLatitude + inTransitOrder.dropLatitude) / 2,
          longitude: (inTransitOrder.pickupLongitude + inTransitOrder.dropLongitude) / 2,
          message: "Vehicle breakdown, need roadside assistance",
        },
      });
    }
  }

  console.log("Creating notifications...");
  for (const shipper of shippers) {
    await prisma.notification.create({
      data: {
        userId: shipper.id,
        title: "Welcome to Logix AI",
        message: "Your shipper account is set up. Start posting orders to receive bids from verified transporters.",
        type: NotificationType.GENERAL,
      },
    });
  }
  for (const transporter of transporters) {
    await prisma.notification.create({
      data: {
        userId: transporter.id,
        title: "Welcome to Logix AI",
        message: "Your transporter profile is verified. You can now browse and bid on available orders.",
        type: NotificationType.GENERAL,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Users: ${transporters.length + shippers.length}`);
  console.log(`Orders: ${orders.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
