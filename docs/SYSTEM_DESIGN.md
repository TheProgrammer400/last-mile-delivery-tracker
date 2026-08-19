# Last-Mile Delivery Tracker — System Architecture & Design Document

## 1. Rate Calculation Engine

The Rate Engine is designed as an isolated, pure business-logic service that dynamically computes delivery quotes based on dynamic database configurations without hardcoding rates.

When an order quote or creation request is received, the engine performs the following calculation pipeline:
1. **Volumetric Weight Calculation**: Package dimensions are converted using the industry-standard formula:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
2. **Chargeable Weight Determination**: To ensure fair billing for bulky or dense packages, the engine selects the higher of actual weight versus volumetric weight:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Dynamic Rate Card Lookup**: Based on route classification (Intra-Zone vs. Inter-Zone) and customer order type (B2B vs. B2C), the engine queries active `RateCard` database entities for `ratePerKg` and `baseFee`.
4. **COD Surcharge Calculation**: If payment type is Cash on Delivery (COD), the active `CodSurcharge` rule for the order type is added.
5. **Final Total Charge**:
   $$\text{Total Charge} = \text{Base Fee} + (\text{Chargeable Weight} \times \text{Rate Per Kg}) + \text{COD Surcharge}$$

The calculation breakdown is presented to the customer in a two-step quote-then-confirm workflow prior to order persistence.

---

## 2. Zone Detection & Mapping

To eliminate reliance on fragile free-text geocoding, the system uses a structured relational mapping layer connecting localities/areas to zones.

- **Area-to-Zone Entity Mapping**: Every selectable pickup or drop-off location is represented by an `Area` record, which holds a strict foreign key to a single administrative `Zone`.
- **Intra vs. Inter-Zone Routing**: Upon receiving pickup and drop area IDs, the system compares their zone references:
  - If `pickupArea.zoneId == dropArea.zoneId`, the route is classified as `INTRA_ZONE`.
  - If `pickupArea.zoneId != dropArea.zoneId`, the route is classified as `INTER_ZONE`.

This approach ensures zero ambiguity during pricing and agent selection while allowing administrators to dynamically reassign localities to different zones without breaking historical order pricing.

---

## 3. Auto-Assignment Logic

The `AssignmentService` matches available delivery agents to orders using a tiered proximity evaluation model:

1. **Availability Filter**: Only agents with `isAvailable = true` are evaluated.
2. **Primary Match (Same Zone)**: Agents assigned to the order's pickup zone (`agent.zoneId == pickupArea.zoneId`) are prioritized to minimize pickup latency.
3. **Secondary Match (Proximity Tiebreaker)**: If no same-zone agents are available, the algorithm calculates Haversine distance using agent latitude/longitude coordinates to find the nearest available agent across adjacent zones.
4. **Fallback**: If no coordinates are set, any online available agent is selected.
5. **Graceful Handling**: If zero agents are available system-wide, assignment fails gracefully with HTTP status 422, preserving the order in `CREATED` status without corrupting state.

Upon assignment, the agent's availability is set to `isAvailable = false`, preventing double-booking during active deliveries.

---

## 4. Failed Delivery & Reschedule Handling

Delivery failures and subsequent reschedules are handled through an append-only state machine to maintain complete auditability:

1. **Failure Event**: When a delivery attempt fails, the assigned agent sets the order status to `FAILED` with a mandatory reason note. The agent's profile availability is immediately restored to `isAvailable = true`.
2. **Customer Reschedule**: The customer (or admin) invokes the reschedule endpoint with a new delivery date.
3. **State Transition & History**: A `RescheduleRequest` record is created, the order status transitions to `RESCHEDULED`, and an immutable `OrderStatusHistory` row is appended.
4. **Automatic Re-assignment**: The order automatically re-enters the assignment engine, matching an available agent and advancing status to `ASSIGNED`.
5. **Notifications**: At every transition (`FAILED` -> `RESCHEDULED` -> `ASSIGNED`), automated notifications are dispatched to the customer.
