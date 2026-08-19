import { apiFetch } from './client';
import { User } from '../types';

export async function loginApi(email: string, password: string): Promise<{ user: User; token: string }> {
  return apiFetch<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(data: { name: string; email: string; password: string; phone: string }): Promise<{ user: User; token: string }> {
  return apiFetch<{ user: User; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMeApi(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}
