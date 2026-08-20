import { apiFetch } from './client';
import { Zone, Area, RateCard, CodSurcharge, AgentProfile, DashboardStats } from '../types';

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/admin/dashboard-stats');
}

export async function getZonesApi(): Promise<Zone[]> {
  return apiFetch<Zone[]>('/admin/zones');
}

export async function createZoneApi(name: string): Promise<Zone> {
  return apiFetch<Zone>('/admin/zones', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getAreasApi(): Promise<Area[]> {
  return apiFetch<Area[]>('/orders/areas');
}

export async function createAreaApi(name: string, zoneId: string): Promise<Area> {
  return apiFetch<Area>('/admin/areas', {
    method: 'POST',
    body: JSON.stringify({ name, zoneId }),
  });
}

export async function updateAreaZoneApi(areaId: string, zoneId: string): Promise<Area> {
  return apiFetch<Area>(`/admin/areas/${areaId}`, {
    method: 'PATCH',
    body: JSON.stringify({ zoneId }),
  });
}

export async function getRateCardsApi(activeOnly: boolean = false): Promise<RateCard[]> {
  return apiFetch<RateCard[]>(`/admin/rate-cards?active=${activeOnly}`);
}

export async function createRateCardApi(data: {
  orderType: string;
  rateType: string;
  chargePerKm?: number;
  ratePerKg: number;
  baseFee?: number;
}): Promise<RateCard> {
  return apiFetch<RateCard>('/admin/rate-cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCodSurchargesApi(): Promise<CodSurcharge[]> {
  return apiFetch<CodSurcharge[]>('/admin/cod-surcharge');
}

export async function createCodSurchargeApi(data: { orderType: string; amount: number }): Promise<CodSurcharge> {
  return apiFetch<CodSurcharge>('/admin/cod-surcharge', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAgentsApi(zoneId?: string, availableOnly?: boolean): Promise<AgentProfile[]> {
  const query = new URLSearchParams();
  if (zoneId) query.append('zoneId', zoneId);
  if (availableOnly) query.append('available', 'true');
  return apiFetch<AgentProfile[]>(`/admin/agents?${query.toString()}`);
}

export async function createAgentApi(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  zoneId: string;
}): Promise<AgentProfile> {
  return apiFetch<AgentProfile>('/admin/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
