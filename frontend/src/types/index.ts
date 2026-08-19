export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type OrderType = 'B2B' | 'B2C';
export type RateType = 'INTRA_ZONE' | 'INTER_ZONE';
export type PaymentType = 'PREPAID' | 'COD';
export type OrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RESCHEDULED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  agentProfile?: AgentProfile | null;
}

export interface Zone {
  id: string;
  name: string;
  _count?: { areas: number; agents: number };
}

export interface Area {
  id: string;
  name: string;
  zoneId: string;
  zone?: Zone;
}

export interface AgentProfile {
  id: string;
  userId: string;
  user: User;
  zoneId: string;
  zone?: Zone;
  currentLat?: number | null;
  currentLng?: number | null;
  isAvailable: boolean;
  _count?: { assignedOrders: number };
}

export interface RateCard {
  id: string;
  orderType: OrderType;
  rateType: RateType;
  ratePerKg: number;
  baseFee: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface CodSurcharge {
  id: string;
  orderType: OrderType;
  amount: number;
  isActive: boolean;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedByUserId: string;
  changedByUser?: User;
  note?: string | null;
  createdAt: string;
}

export interface RescheduleRequest {
  id: string;
  orderId: string;
  previousScheduledDate?: string | null;
  newScheduledDate: string;
  requestedByUserId: string;
  requestedByUser?: User;
  reassignedAgentId?: string | null;
  reassignedAgent?: AgentProfile;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: User;
  createdByAdminId?: string | null;
  pickupAddress: string;
  pickupAreaId: string;
  pickupArea: Area;
  dropAddress: string;
  dropAreaId: string;
  dropArea: Area;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
  rateCardIdUsed: string;
  rateCardUsed?: RateCard;
  baseFee: number;
  weightCharge: number;
  codSurcharge: number;
  totalCharge: number;
  currentStatus: OrderStatus;
  assignedAgentId?: string | null;
  assignedAgent?: AgentProfile | null;
  scheduledDeliveryDate?: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: OrderStatusHistory[];
  rescheduleRequests?: RescheduleRequest[];
}

export interface QuoteResult {
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  rateType: RateType;
  rateCardId: string;
  baseFee: number;
  ratePerKg: number;
  weightCharge: number;
  codSurcharge: number;
  totalCharge: number;
  pickupZoneName: string;
  dropZoneName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  totalAgents: number;
  availableAgents: number;
  zonesCount: number;
}
