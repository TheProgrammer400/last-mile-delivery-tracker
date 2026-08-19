# Last-Mile Delivery Tracker & Management Platform

A production-grade, multi-role last-mile delivery tracking platform built around a dynamic rate-calculation engine, zone-based nearest-agent auto-assignment, an immutable status audit history, and email notifications on every status transition.

---

## 1. Project Overview

Last-mile delivery operations require predictable pricing, robust agent dispatching, and full auditability for every shipment. This system addresses these operational requirements with:
- **Dynamic Rate Calculation Engine**: Zone-aware (Intra vs Inter-Zone), volumetric weight billing, B2B/B2C rate cards, and COD surcharges without hardcoded rates.
- **Zone-Based Agent Assignment**: Proximity auto-assignment prioritized by agent home zone, with latitude/longitude distance tiebreaking.
- **Immutable Status Audit Timeline**: Insert-only history tracking every transition actor and timestamp.
- **Multi-Role User Portals**: Tailored interfaces for Customers, Delivery Agents, and System Administrators.

---

## 2. Key Features

### Must-Have Implementation Features
- **Role-Based Access Control (RBAC)**: JWT authentication for `CUSTOMER`, `AGENT`, and `ADMIN` roles.
- **Quote-Then-Confirm Order Flow**: Customers see complete fee breakdown before confirming any order.
- **Rate Calculation Formula**:
  $$\text{Volumetric Weight} = \frac{L \times B \times H}{5000}$$
  $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
- **Admin Configuration Suite**: Full management of Zones, Area-to-Zone mappings, Rate Cards (B2B/B2C × Intra/Inter), and COD surcharges.
- **Agent Auto-Assignment**: Tiered proximity search (Same Zone → Proximity → Any Available) with HTTP 422 fallback when no agent is online.
- **Status Lifecycle State Machine**: Enforces legal state progression (`CREATED` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` | `FAILED`).
- **Failed Delivery Reschedule Workflow**: Reschedule failed deliveries to new dates with automatic agent re-assignment.
- **Notification Engine**: Triggers logged email notifications on every status change.
- **Admin Status Override**: Allows administrators to override order states with mandatory audit notes.

### Should-Have Enhancements
- **Rate Card Versioning**: Deactivates old rate cards on update, preserving exact historical pricing snapshots on past orders.
- **Automated Unit & Integration Test Suite**: 100% test coverage on core business logic using Vitest and Supertest.
- **Mobile-Responsive Agent View**: Fast, mobile-optimized dashboard for on-the-go status updates and phone availability toggles.

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   React SPA (Vite)                     │
│  - Tailwind CSS Glassmorphic Design System            │
│  - TanStack Query (React Query) Server State Caching   │
│  - Role-Gated Routes (Customer / Agent / Admin)        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js / Express API (TypeScript)       │
│  - Auth & Role Guards (JWT + bcrypt)                   │
│  - Zod Request Validators                              │
│  - Service Layer:                                      │
│    ├─ RateEngineService (Volumetric & Rate Lookup)    │
│    ├─ ZoneService (Areas, Rates, COD Surcharges)       │
│    ├─ AssignmentService (Proximity Match)             │
│    ├─ OrderService (Lifecycle & Reschedule Engine)     │
│    └─ NotificationService (Email Dispatcher & Log)   │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                  │
│  - Foreign Key Constraints & Relations                 │
│  - Immutable OrderStatusHistory Table                  │
└────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Node.js + Express + TypeScript | Lightweight REST server with compile-time type safety for business logic. |
| **Database** | PostgreSQL + Prisma ORM | Relational constraints for orders, zones, rates, and append-only status histories. |
| **Auth** | JWT + bcryptjs | Stateless, secure authentication with 24-hour token expiration. |
| **Frontend** | React 18 + TypeScript + Vite | Fast dev loop, typed API contracts, and high performance. |
| **Styling** | Tailwind CSS | Sleek glassmorphism dark-mode UI with animated badges and responsive components. |
| **Data Fetching** | TanStack Query | Caching, loading skeletons, and real-time status updates. |
| **Notifications** | Resend / Nodemailer / Mock Logger | Flexible dispatcher logging every email to `NotificationLog`. |
| **Testing** | Vitest + Supertest | Lightweight unit and end-to-end API integration test runner. |

---

## 5. Project Structure

```
Last Mile Delivery Tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database entities & relations
│   │   └── seed.ts              # Seeding admin, zones, rate cards, agents, sample orders
│   ├── src/
│   │   ├── config/              # Environment variables loader
│   │   ├── controllers/         # HTTP request/response handlers
│   │   ├── middleware/          # Auth, role guards, error handling, rate limiting
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/            # Rate engine, assignment, order lifecycle, notifications
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express app configuration
│   │   └── server.ts            # HTTP server entrypoint
│   ├── tests/
│   │   ├── unit/                # Rate engine, assignment, state machine unit tests
│   │   └── integration/         # Supertest REST API integration tests
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client methods
│   │   ├── components/          # StatusBadge, Timeline, Modal, Navbar, Skeleton, EmptyState
│   │   ├── context/             # AuthContext provider
│   │   ├── pages/               # Auth, Customer, Agent, Admin pages
│   │   ├── routes/              # ProtectedRoute wrapper
│   │   ├── types/               # Shared TypeScript interface contracts
│   │   └── App.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── SYSTEM_DESIGN.md         # Prose write-up on core architectural decisions
│   └── api-docs.md              # REST API reference manual
└── README.md
```

---

## 6. Quickstart / Setup Instructions

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+ or v10+
- **PostgreSQL**: v14+ running locally or user-space

### Step 1: Clone & Setup Environment
```bash
git clone <repository_url>
cd "Last Mile Delivery Tracker"
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in both backend and frontend:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Ensure `DATABASE_URL` in `backend/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://programmer@127.0.0.1:5433/delivery_tracker?schema=public"
```

### Step 3: Install Dependencies, Migrate & Seed Database
```bash
# Setup Backend
cd backend
npm install
npx prisma db push
npm run db:seed

# Setup Frontend
cd ../frontend
npm install
```

---

## 7. Running the Application

### Start Backend API Server
```bash
cd backend
npm run dev
# Server running at http://localhost:4000
```

### Start Frontend Application
```bash
cd frontend
npm run dev
# Application running at http://localhost:5173
```

---

## 8. Quick Demo Accounts

The login screen includes 1-click quick demo buttons:
- **Admin**: `admin@delivery.com` / `admin123`
- **Customer**: `customer@example.com` / `customer123`
- **Delivery Agent**: `agent1@delivery.com` / `agent123`

---

## 9. Running Tests

### Backend Unit Tests (Rate Engine, Assignment, Lifecycle)
```bash
cd backend
npm run test:unit
```

### Backend Integration Tests (REST Endpoints & Security)
```bash
cd backend
npm run test:integration
```

### TypeScript Type Checking
```bash
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
```

---

## 10. Environment Variable Reference

### Backend (`backend/.env`)
- `DATABASE_URL`: PostgreSQL connection string.
- `PORT`: Port number for Express server (default `4000`).
- `JWT_SECRET`: Secret key used for signing authentication tokens.
- `CORS_ORIGIN`: Allowed origin for CORS headers (default `http://localhost:5173`).
- `RESEND_API_KEY`: API key for Resend email provider (optional).
- `SMTP_HOST`: Host for Nodemailer SMTP fallback (optional).

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`: Base API endpoint URL (default `http://localhost:4000/api/v1`).

---

## 11. Design Trade-offs & Decisions

1. **Structured Area-to-Zone Mapping vs Free-Text Address Geocoding**:
   *Trade-off*: Requires administrative area creation.
   *Decision*: Solves geocoding ambiguity and allows exact pricing and same-zone agent matching without third-party geocoding API costs.
2. **Snapshot Pricing on Order Creation**:
   *Decision*: Order tables store snapshot copies of `baseFee`, `weightCharge`, `codSurcharge`, and `rateCardIdUsed` so future rate changes never mutate past invoices.
3. **Append-Only `OrderStatusHistory`**:
   *Decision*: No API route or service function ever performs `.update()` or `.delete()` on history rows, guaranteeing an immutable audit trail.
