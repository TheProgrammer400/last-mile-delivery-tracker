import { z } from 'zod';
import { OrderType, RateType } from '@prisma/client';

export const createZoneSchema = z.object({
  name: z.string().min(2, 'Zone name must be at least 2 characters'),
});

export const createAreaSchema = z.object({
  name: z.string().min(2, 'Area name must be at least 2 characters'),
  zoneId: z.string().uuid('Invalid zone ID format'),
});

export const updateAreaZoneSchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID format'),
});

export const createRateCardSchema = z.object({
  orderType: z.nativeEnum(OrderType, { errorMap: () => ({ message: 'orderType must be B2B or B2C' }) }),
  rateType: z.nativeEnum(RateType, { errorMap: () => ({ message: 'rateType must be INTRA_ZONE or INTER_ZONE' }) }),
  ratePerKg: z.number().positive('ratePerKg must be greater than 0'),
  baseFee: z.number().nonnegative('baseFee must be non-negative'),
  effectiveFrom: z.string().datetime({ offset: true }).optional().or(z.date().optional()),
});

export const createCodSurchargeSchema = z.object({
  orderType: z.nativeEnum(OrderType, { errorMap: () => ({ message: 'orderType must be B2B or B2C' }) }),
  amount: z.number().nonnegative('amount must be non-negative'),
});

export const createAgentSchema = z.object({
  name: z.string().min(2, 'Agent name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  zoneId: z.string().uuid('Invalid zone ID format'),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
});
