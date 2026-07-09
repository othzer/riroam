# RiRoam

**Roam the land of high passes.** RiRoam is a Ladakh-first travel marketplace —
book verified tour packages, hotels & homestays, and taxis & bikes, with a
data-grounded AI trip planner.

> **ri (རི)** means _mountain_ in Ladakhi/Tibetan — RiRoam is _mountain roam_.
> La-dags ≈ _land of high passes_.

Altitude is a first-class element of the product: every listing carries a
mono-font altitude chip, and package itineraries render as a day-by-day
elevation profile with acclimatization days shaded.

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router) + TypeScript               |
| Database   | PostgreSQL (Neon) + Prisma 6                        |
| Auth       | Auth.js v5 — Credentials + Google, JWT sessions    |
| UI         | Tailwind CSS v4 + shadcn/ui                         |
| Validation | Zod + react-hook-form                              |
| Payments   | Razorpay (test mode)                               |
| Uploads    | Cloudinary                                          |
| AI         | Google Gemini 2.5 Flash                            |
| Email      | Resend + React Email                               |
| Maps       | Leaflet + OpenStreetMap                            |

## Getting started

```bash
# 1. Install
npm install

# 2. Configure — copy the example and fill in your values
cp .env.example .env

# 3. Apply the schema to your database
npm run db:migrate

# 4. Seed the admin account (reads ADMIN_SEED_* from .env)
npm run db:seed

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                | Does                                    |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Start the dev server                    |
| `npm run build`       | Production build                        |
| `npm run db:migrate`  | Create & apply a Prisma migration       |
| `npm run db:seed`     | Seed the database                       |
| `npm run db:studio`   | Open Prisma Studio                      |
| `npm run db:reset`    | Drop, re-migrate, and re-seed           |

## Project layout

```
prisma/           schema + migrations + seed
src/
  app/            routes (App Router)
  actions/        server actions, one file per domain
  components/     ui · shared · tourist · vendor · admin
  lib/            auth, prisma, validators, and domain helpers
  types/          shared types + module augmentation
```
