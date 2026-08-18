# Logix AI — Phase 1: Project Foundation

An intelligent two-sided logistics marketplace connecting **transporters**
(truck owners with unused capacity) and **shippers** (cargo owners) —
built for a hackathon.

> "Turn Empty Miles Into Profitable Miles."

## What's in this phase

- Next.js 14 (App Router) + TypeScript + Tailwind CSS project foundation
- Landing page (`/`) with hero, problem explanation, "how it works" flow
  diagram, capabilities section, and CTAs
- Transporter entry page (`/transporter`)
- Shipper entry page (`/shipper`)
- Modular folder structure ready for Phase 2 (auth, database, dashboards)
- Prisma configured for SQLite, **no models yet** (intentional)

No authentication, database models, dashboards, external APIs, real
payments, or real GPS are implemented yet — by design, per the Phase 1 scope.

## Getting started

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

## Project structure

```
app/
  (transporter)/transporter/page.tsx   → /transporter entry page
  (shipper)/shipper/page.tsx           → /shipper entry page
  layout.tsx                           → root layout (fonts, metadata)
  page.tsx                             → landing page
  globals.css                          → Tailwind + base styles
components/
  landing/                             → landing page sections
  entry/                               → shared shell for entry pages
  layout/                              → Logo, nav-level building blocks
  ui/                                  → Button, Container (generic UI)
lib/
  utils.ts                             → cn() class merge, formatINR()
types/
  index.ts                             → domain types (Truck, Shipment, Match)
data/                                  → mock datasets (Phase 2+)
services/                              → matching/pricing logic (Phase 2+)
hooks/                                 → shared React hooks (Phase 2+)
utils/
  constants.ts                         → brand copy, nav links, Indian cities
prisma/
  schema.prisma                        → SQLite datasource, no models yet
```

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (custom navy / sky-blue / neutral brand palette)
- Prisma + SQLite (wired for Phase 2)
- Recharts (installed, ready for Phase 2 analytics)
- lucide-react (icons)

## Phase 2 (next up)

1. Prisma models: `User`, `Truck`, `Shipment`, `Match`/`Bid`
2. Simple authentication (role selection: Transporter vs Shipper)
3. Mock data: realistic Indian cities, truck listings, shipment listings
4. Transporter dashboard: post truck availability, view matched shipments
5. Shipper dashboard: post shipment, view matched/available trucks
6. Basic matching logic (rule-based first, "AI" scoring later)
7. Recharts-powered analytics (route demand, earnings trends)
