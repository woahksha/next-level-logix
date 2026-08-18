# Logix AI — Database Setup (Phase 2)

This project now has a full Prisma + SQLite database layer wired into the
existing Phase 1 app. The UI, components, routes, and everything else from
Phase 1 are untouched — this only adds `prisma/schema.prisma`,
`prisma/seed.ts`, and a few `package.json` entries.

## 1. Install dependencies

From the project root:

```bash
npm install
```

This pulls in everything from Phase 1 plus the one new addition for
Phase 2: `ts-node` (used to run the seed script). `@prisma/client` and
`prisma` were already in `package.json` from Phase 1.

## 2. Environment variables

`.env` already exists in this project with:

```
DATABASE_URL="file:./dev.db"
```

No changes needed for local development. `.env.example` is included to show
which variable names are required — copy it to `.env` if you ever recreate
the file from scratch.

## 3. Run the migration

```bash
npm run prisma:migrate -- --name init
```

This reads `prisma/schema.prisma`, creates the SQLite file at
`prisma/dev.db`, writes the migration history to `prisma/migrations/`, and
generates the Prisma Client.

If you ever change `schema.prisma` again later, re-run:

```bash
npm run prisma:migrate -- --name <describe-the-change>
```

## 4. Seed the database

```bash
npm run db:seed
```

You should see log output ending in `Seed complete.` with the counts of
users and orders created.

## 5. Verify it worked

```bash
npm run db:studio
```

Opens Prisma Studio in your browser — a GUI showing the `users`, `orders`,
`bids`, `payments`, `ratings`, etc. tables populated with demo data.

## 6. Run the app

```bash
npm run dev
```

The Phase 1 UI (landing page, `/transporter`, `/shipper`) runs exactly as
before — nothing in `app/` or `components/` was changed in this phase. No
pages currently read from the database yet; that wiring (API routes /
server actions) is scoped for a future phase.

---

## What's in the seed data

- **5 transporters** (Delhi, Ghaziabad, Jaipur, Ahmedabad, Pune), each with
  a verified `TransporterProfile` (vehicle, capacity, UPI ID, rating,
  trip count).
- **5 shippers** (Mumbai, Bengaluru, Hyderabad, Chennai, Gurugram), each
  with a verified `ShipperProfile` (company, GST, address, rating).
- **10 orders** spanning real India routes (e.g. Delhi→Jaipur, Mumbai→Pune,
  Bengaluru→Chennai) with haversine-calculated distance, realistic weight,
  volume, and rate ranges.
- Orders spread across all statuses: `PENDING`, `BID_ACCEPTED`,
  `IN_TRANSIT`, `DELIVERED`.
- 2–3 `Bid`s per order from different transporters, with one `ACCEPTED`
  bid on non-pending orders.
- A `Payment` row per non-pending order (advance-paid or completed).
- `TrackingUpdate` rows (pickup → midpoint → delivered) for in-transit and
  delivered orders, plus a `ProofOfDelivery` record for delivered ones.
- Two-way `Rating`s (shipper→transporter and transporter→shipper) for
  delivered orders.
- One demo `SosAlert` on an in-transit order.
- Welcome `Notification`s for every user.

## Database models

`User`, `TransporterProfile`, `ShipperProfile`, `Order`, `Bid`, `Payment`,
`Rating`, `Notification`, `SosAlert`, `TrackingUpdate`, `ProofOfDelivery`.
Full field list and enums are in `prisma/schema.prisma`.

## Notes / known limitations

- `passwordHash` in the seed data is a plain SHA-256 placeholder, not
  bcrypt — fine for now since authentication is a later phase. Swap it out
  when real auth is built.
- No API routes or server actions read/write the database yet — this phase
  is the database layer only, per the project scope. The Phase 1 pages
  still render their existing static/demo content.
- If you regenerate `.env` from `.env.example`, the default SQLite path is
  relative to the project root, so no further edits are needed for local
  dev.
