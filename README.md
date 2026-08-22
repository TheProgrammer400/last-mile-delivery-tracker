# 🚚 Last-Mile Delivery Tracker & Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?logo=vercel)](https://vercel.com/)
[![Vitest](https://img.shields.io/badge/Vitest-1.4-6E9F18?logo=vitest)](https://vitest.dev/)

A production-grade, enterprise last-mile delivery tracking platform built around a dynamic rate-calculation engine, zone-based nearest-agent auto-assignment, an immutable status audit history, and email notifications on every status transition. 

Fully configured for serverless deployment on **Vercel** with a managed cloud database on **Neon PostgreSQL**.

---

## 📋 Table of Contents
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Cloud Architecture & Database Migration](#-cloud-architecture--database-migration)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quickstart & Local Setup](#-quickstart--local-setup)
- [Deploying to Neon & Vercel](#-deploying-to-neon--vercel)
- [Environment Variables Reference](#-environment-variables-reference)
- [Quick Demo Accounts](#-quick-demo-accounts)
- [Running Tests](#-running-tests)
- [Architectural Decisions & Trade-offs](#-architectural-decisions--trade-offs)

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Layer (Browser)"]
        UI["React 18 SPA (Vite)
        • TanStack Query (Server State)
        • Stitch Light Design System
        • Role-Gated Routing (RBAC)"]
    Executing
    end

    subgraph Vercel["Vercel Edge Network & Serverless Platform"]
        Static["Vite Static Output
        (/dist)"]
        API["Vercel Serverless Function
        (Express API Adapter - /api/index.ts)"]
        
        subgraph DomainServices["Domain Service Layer"]
            RE["RateEngineService"]
            ZS["ZoneService"]
            AS["AssignmentService"]
            OS["OrderService"]
            DS["DistanceService"]
            NS["NotificationService"]
        end
    end

    subgraph Database["Database Layer (Neon PostgreSQL)"]
        NeonPooler["Neon Connection Pooler
        (PgBouncer - DATABASE_URL)"]
        NeonDirect["Neon Direct Host
        (DIRECT_URL)"]
        DB[(Managed PostgreSQL DB)]
    end

    UI -->|Static Assets| Static
    UI -->|HTTPS / REST API /api/v1| API
    API --> DomainServices
    DomainServices -->|Prisma Client Singleton| NeonPooler
    NeonPooler --> DB
    NeonDirect -->|Schema Migrations| DB
```

---

## ✨ Key Features

### 📦 Order & Pricing Engine
- **Quote-Then-Confirm Order Workflow**: Customers see a transparent breakdown before confirming shipments.
- **Dynamic Pricing Engine**: Calculates pricing based on road distance, chargeable weight (Max of Actual vs. Volumetric Weight: $\frac{L \times B \times H}{5000}$), active rate cards (B2B/B2C $\times$ Intra/Inter-Zone), and COD surcharges without hardcoded rates.
- **Snapshot Pricing Integrity**: Stores historical fee snapshots (`baseFee`, `weightCharge`, `codSurcharge`, `rateCardIdUsed`) so future rate updates never alter historical invoices.

### 🤖 Intelligent Agent Auto-Assignment
- **Multi-Tiered Dispatching Algorithm**: Prioritizes available agents in the pickup zone first, then resolves ties by current GPS proximity.
- **HTTP 422 Graceful Fallback**: Safely handles cases where no delivery agents are online in the area.

### 🔒 Auditability & Security
- **Immutable Status Lifecycle**: Strict state machine progression (`CREATED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `FAILED`).
- **Append-Only History**: Insert-only `order_status_histories` audit log preserving actor IDs, timestamps, and notes.
- **Stateless RBAC Authentication**: Secure JWT + bcrypt authentication for `CUSTOMER`, `AGENT`, and `ADMIN` roles.

### 🔔 Notifications & Fleet Operations
- **Asynchronous Notifications**: Dispatches logged email updates on every status update via Resend / Nodemailer with fallback mock logging.
- **Failed Delivery Rescheduling**: Enables customers/admins to reschedule failed deliveries with automatic agent re-assignment.

---

## ☁️ Cloud Architecture & Database Migration

This repository is architected specifically for modern serverless cloud execution:

1. **Neon PostgreSQL Cloud Migration**:
   - Uses **Neon Serverless PostgreSQL** for database persistence.
   - Separates connections into a **Pooled Endpoint** (`DATABASE_URL` via PgBouncer in transaction mode) for short-lived serverless function invocations, and a **Direct Endpoint** (`DIRECT_URL`) for Prisma schema management (`prisma db push` / `prisma migrate deploy`).
   - Implements a serverless-safe `PrismaClient` singleton on `globalThis` to prevent connection pool exhaustion across function warm-restarts.

2. **Vercel Monorepo Serverless Deployment**:
   - Single unified deployment repository containing both the React 18 SPA (`/frontend`) and the Express REST API (`/backend`).
   - Serverless entrypoints at `api/index.ts` and `backend/api/index.ts` adapt Express middleware directly into Vercel Serverless Functions.
   - Unified routing configuration in `vercel.json` proxies `/api/v1/*` and `/health` endpoints to the serverless function while serving the React SPA on all client routes.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | High-performance SPA with strict compile-time type safety. |
| **Styling** | Vanilla CSS, Tailwind CSS, Lucide Icons | Clean Stitch Light Design System with semantic status indicators. |
| **State Caching** | TanStack Query (React Query) | Server state management, auto-refetching, and UI loading skeletons. |
| **Backend API** | Node.js, Express, TypeScript | Modular REST API with thin controllers and dedicated domain services. |
| **ORM & DB** | Prisma ORM, Neon PostgreSQL | Type-safe queries, relational integrity, and connection pooling. |
| **Authentication** | JWT, bcryptjs | Stateless token-based auth with role-based route guards (`ProtectedRoute`). |
| **Validation** | Zod | Strict schema validation middleware for API request payloads. |
| **Testing** | Vitest, Supertest | Fast unit and end-to-end REST API integration testing framework. |
| **Deployment** | Vercel, Neon Console | Zero-config serverless deployment & managed cloud database hosting. |

---

## 📁 Project Directory Structure

```
Last Mile Delivery Tracker/
├── api/
│   └── index.ts                 # Root Vercel Serverless Function entrypoint
├── backend/
│   ├── api/
│   │   └── index.ts             # Backend Vercel Serverless Function handler
│   ├── prisma/
│   │   ├── schema.prisma        # Database models, relations & dual datasource URLs
│   │   └── seed.ts              # Seeding script for zones, rates, users & sample orders
│   ├── src/
│   │   ├── config/              # Environment configuration loader
│   │   ├── controllers/         # HTTP request/response handlers
│   │   ├── middleware/          # Auth, RBAC role guards, error normalizer
│   │   ├── routes/              # Express API route definitions
│   │   ├── services/            # Core business logic domain services
│   │   ├── utils/               # Serverless-safe Prisma singleton & logger
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express application initialization & CORS
│   │   └── server.ts            # Local HTTP server entrypoint
│   ├── tests/
│   │   ├── unit/                # Rate engine, assignment & state machine unit tests
│   │   └── integration/         # Supertest REST API integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API fetch client with auth interlock
│   │   ├── components/          # Navigation, StatusBadge, Timeline, Skeletons
│   │   ├── context/             # AuthContext state provider
│   │   ├── pages/               # Auth, Customer, Agent & Admin portal views
│   │   ├── routes/              # ProtectedRoute wrapper
│   │   └── types/               # Shared TypeScript interface contracts
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── vercel.json                  # Unified Vercel monorepo deployment configuration
├── package.json                 # Root dependencies & postinstall Prisma generation
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+ or v10+
- **PostgreSQL**: Local PostgreSQL or a free [Neon](https://neon.tech) cloud database instance.

### 1. Clone the Repository
```bash
git clone https://github.com/TheProgrammer400/last-mile-delivery-tracker.git
cd "last-mile-delivery-tracker"
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the backend:
```bash
cp backend/.env.example backend/.env
```

Ensure `DATABASE_URL` and `DIRECT_URL` point to your PostgreSQL database:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/delivery_tracker?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/delivery_tracker?schema=public"
JWT_SECRET="super-secret-jwt-key-last-mile-tracker-2026"
PORT=4000
```

### 3. Install Dependencies & Seed Database
```bash
# Install root & workspace packages
npm install
cd backend && npm install
cd ../frontend && npm install

# Sync Database Schema & Seed Data
cd ../backend
npx prisma db push
npx prisma db seed
```

### 4. Run Locally
Run backend and frontend dev servers in separate terminals:

```bash
# Terminal 1: Start Backend API (http://localhost:4000)
cd backend && npm run dev

# Terminal 2: Start Frontend Application (http://localhost:5173)
cd frontend && npm run dev
```

---

## 🌐 Deploying to Neon & Vercel

### Step 1: Provision Managed Database on Neon
1. Create a free PostgreSQL database project at [neon.tech](https://neon.tech).
2. Copy your **Pooled Connection String** (`DATABASE_URL`) and **Direct Connection String** (`DIRECT_URL`).

### Step 2: Apply Migrations & Seed Neon
```bash
cd backend

# Run schema push against Neon
DATABASE_URL="<NEON_POOLED_URL>" DIRECT_URL="<NEON_DIRECT_URL>" npx prisma db push

# Seed default admin, zones, rate cards & demo accounts
DATABASE_URL="<NEON_POOLED_URL>" npx prisma db seed
```

### Step 3: Deploy on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com/dashboard).
2. In **Environment Variables**, add the following keys:
   - `DATABASE_URL`: Your Neon Pooled Connection String
   - `DIRECT_URL`: Your Neon Direct Connection String
   - `JWT_SECRET`: `super-secret-jwt-key-last-mile-tracker-2026`
   - `NODE_ENV`: `production`
   - `VITE_API_BASE_URL`: `/api/v1`
3. Click **Deploy**. Vercel will build the frontend SPA and backend serverless function automatically.

---

## 🔑 Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `DATABASE_URL` | Backend | Neon **Pooled** PostgreSQL connection string (with `-pooler`) |
| `DIRECT_URL` | Backend | Neon **Direct** unpooled connection string (for migrations) |
| `JWT_SECRET` | Backend | Secret key used for signing & verifying JWT auth tokens |
| `PORT` | Backend | Server port (default `4000` for local dev) |
| `NODE_ENV` | Backend | Environment mode (`development` / `production`) |
| `CORS_ORIGIN` | Backend | CORS allowed origin header |
| `VITE_API_BASE_URL` | Frontend | API base URL (local: `http://localhost:4000/api/v1`, Vercel: `/api/v1`) |

---

## ⚡ Quick Demo Accounts

The login interface includes 1-click Quick Demo logins pre-seeded into the database:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Administrator** | `admin@delivery.com` | `admin123` | Master order overview, Fleet management, Zone & Area setup, Rate Card & COD Surcharge configuration |
| **Customer** | `customer@example.com` | `customer123` | Create multi-step shipment quotes, order tracking, status timeline, failed order rescheduling |
| **Delivery Agent** | `agent1@delivery.com` | `agent123` | Mobile-optimized delivery dashboard, online/offline availability toggle, legal status updates |

---

## 🧪 Running Tests

The test suite validates rate engine calculations, agent auto-assignment logic, lifecycle state machine constraints, and REST API endpoints.

```bash
# Run unit & integration test suite
cd backend
npm test

# Run TypeScript typechecks across both packages
cd backend && npm run typecheck
cd frontend && npm run typecheck
```

---

## 📐 Architectural Decisions & Trade-offs

1. **Structured Area-to-Zone Mapping vs Free-Text Geocoding**:
   - *Decision*: Delivery areas are mapped to parent zones in the database.
   - *Trade-off*: Requires initial zone setup by administrators.
   - *Benefit*: Eliminates third-party geocoding API rate limits/costs while ensuring deterministic Intra-zone vs Inter-zone pricing calculations.

2. **Serverless Singleton Connection Management**:
   - *Decision*: Attached `PrismaClient` to `globalThis` and routed runtime queries to Neon's PgBouncer pooler.
   - *Benefit*: Prevents database connection limit exhaustion under high-concurrency serverless invocations on Vercel.

3. **Append-Only Audit History**:
   - *Decision*: `order_status_histories` table is strictly insert-only. No service or API route exposes update/delete operations, providing an immutable audit trail.
