# Last-Mile Delivery Tracker — API Documentation

Base URL: `/api/v1`  
Authentication: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new customer account.
- **Request Body**:
  ```json
  {
    "name": "John Customer",
    "email": "customer@example.com",
    "password": "customer123",
    "phone": "+919876543211"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": { "id": "...", "name": "John Customer", "email": "customer@example.com", "role": "CUSTOMER", "phone": "+919876543211" },
    "token": "jwt_token_string"
  }
  ```

### `POST /auth/login`
Authenticates a user (Customer, Agent, Admin).
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response (200 OK)**: `{ "user": { ... }, "token": "..." }`

### `GET /auth/me`
Fetches current authenticated user profile.
- **Response (200 OK)**: `{ "user": { ... } }`

---

## 2. Order Management Endpoints

### `POST /orders/quote`
Calculates delivery charges without persisting data.
- **Role Access**: `CUSTOMER`, `ADMIN`
- **Request Body**:
  ```json
  {
    "pickupAreaId": "uuid",
    "dropAreaId": "uuid",
    "lengthCm": 20,
    "breadthCm": 15,
    "heightCm": 10,
    "actualWeightKg": 2.0,
    "orderType": "B2C",
    "paymentType": "PREPAID"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "volumetricWeightKg": 0.6,
    "chargeableWeightKg": 2.0,
    "rateType": "INTRA_ZONE",
    "rateCardId": "uuid",
    "baseFee": 30.0,
    "ratePerKg": 10.0,
    "weightCharge": 20.0,
    "codSurcharge": 0.0,
    "totalCharge": 50.0,
    "pickupZoneName": "Chennai Central",
    "dropZoneName": "Chennai Central"
  }
  ```

### `POST /orders`
Recalculates quote server-side and persists new order.
- **Role Access**: `CUSTOMER`, `ADMIN`
- **Request Body**: Same as `/quote` plus `pickupAddress`, `dropAddress`, and optional `customerId`.
- **Response (201 Created)**: Order object with initial `statusHistory` (`CREATED`).

### `GET /orders`
List orders (Filtered per role).
- **Query Params**: `status`, `zoneId`, `agentId`, `orderType`, `paymentType`, `page`, `pageSize`.
- **Response (200 OK)**: `{ "data": [...], "page": 1, "pageSize": 10, "total": 25, "totalPages": 3 }`

### `GET /orders/:id`
Fetch single order detail & full status history timeline.
- **Response (200 OK)**: Order object with `pickupArea`, `dropArea`, `assignedAgent`, `statusHistory`, and `rescheduleRequests`.

### `POST /orders/:id/assign`
Assign agent manually or trigger auto-assignment.
- **Role Access**: `ADMIN`
- **Request Body**: `{ "agentId": "uuid" }` OR `{ "auto": true }`
- **Response (200 OK)**: Updated order with status `ASSIGNED`.

### `POST /orders/:id/status`
Advance order status lifecycle.
- **Role Access**: `AGENT` (assigned only), `ADMIN`
- **Request Body**: `{ "status": "PICKED_UP", "note": "Picked up from customer" }`
- **Response (200 OK)**: Updated order object.

### `POST /orders/:id/reschedule`
Reschedule a failed delivery attempt.
- **Role Access**: `CUSTOMER` (owner only), `ADMIN`
- **Request Body**: `{ "newScheduledDate": "2026-08-25", "agentId": "optional_uuid" }`
- **Response (200 OK)**: Order updated to `RESCHEDULED` then auto-reassigned (`ASSIGNED`).

---

## 3. Admin Endpoints

### `GET /admin/dashboard-stats`
Fetch system-wide metrics summary.

### `POST /admin/zones` & `GET /admin/zones`
Manage delivery zones.

### `POST /admin/areas`, `PATCH /admin/areas/:id`, `GET /admin/areas`
Manage area mappings to zones.

### `POST /admin/rate-cards` & `GET /admin/rate-cards`
Manage B2B/B2C Intra/Inter rate cards.

### `POST /admin/cod-surcharge` & `GET /admin/cod-surcharge`
Manage COD surcharge configuration.

### `POST /admin/agents` & `GET /admin/agents`
Manage delivery agent fleet.

---

## 4. Delivery Agent Endpoints

### `PATCH /agents/me/availability`
Self-service toggle for agent availability.
- **Request Body**: `{ "isAvailable": true }`
- **Response (200 OK)**: Updated agent profile.
