import { apiFetch } from './client';
import { Order, QuoteResult, PaginatedResponse, OrderStatus } from '../types';

export interface QuotePayload {
  pickupAreaId: string;
  dropAreaId: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: string;
  paymentType: string;
}

export interface CreateOrderPayload extends QuotePayload {
  pickupAddress: string;
  dropAddress: string;
  customerId?: string;
}

export async function getQuoteApi(payload: QuotePayload): Promise<QuoteResult> {
  return apiFetch<QuoteResult>('/orders/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createOrderApi(payload: CreateOrderPayload): Promise<Order> {
  return apiFetch<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getOrderByIdApi(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

export async function getOrdersApi(params: {
  status?: OrderStatus;
  zoneId?: string;
  agentId?: string;
  paymentType?: string;
  orderType?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.zoneId) query.append('zoneId', params.zoneId);
  if (params.agentId) query.append('agentId', params.agentId);
  if (params.paymentType) query.append('paymentType', params.paymentType);
  if (params.orderType) query.append('orderType', params.orderType);
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());

  return apiFetch<PaginatedResponse<Order>>(`/orders?${query.toString()}`);
}

export async function assignAgentApi(orderId: string, payload: { agentId?: string; auto?: boolean }): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/assign`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOrderStatusApi(orderId: string, status: OrderStatus, note?: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });
}

export async function rescheduleOrderApi(orderId: string, newScheduledDate: string, agentId?: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ newScheduledDate, agentId }),
  });
}

export async function updateSelfAvailabilityApi(isAvailable: boolean) {
  return apiFetch('/agents/me/availability', {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable }),
  });
}
