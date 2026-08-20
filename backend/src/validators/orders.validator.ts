import { z } from 'zod';
import { OrderType, PaymentType, OrderStatus } from '@prisma/client';

export const quoteOrderSchema = z.object({
  pickupAreaId: z.string().uuid('Invalid pickupAreaId format'),
  dropAreaId: z.string().uuid('Invalid dropAreaId format'),
  pickupAddress: z.string().optional(),
  dropAddress: z.string().optional(),
  lengthCm: z.number().positive('lengthCm must be greater than 0'),
  breadthCm: z.number().positive('breadthCm must be greater than 0'),
  heightCm: z.number().positive('heightCm must be greater than 0'),
  actualWeightKg: z.number().positive('actualWeightKg must be greater than 0'),
  orderType: z.nativeEnum(OrderType, { errorMap: () => ({ message: 'orderType must be B2B or B2C' }) }),
  paymentType: z.nativeEnum(PaymentType, { errorMap: () => ({ message: 'paymentType must be PREPAID or COD' }) }),
});

export const createOrderSchema = quoteOrderSchema.extend({
  pickupAddress: z.string().min(3, 'Pickup address is required'),
  dropAddress: z.string().min(3, 'Drop address is required'),
  customerId: z.string().uuid().optional(), // Allowed if created by admin on behalf of customer
});

export const assignAgentSchema = z.object({
  agentId: z.string().uuid().optional(),
  auto: z.boolean().optional(),
}).refine((data) => data.agentId || data.auto, {
  message: 'Either agentId or auto must be provided',
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, { errorMap: () => ({ message: 'Invalid order status' }) }),
  note: z.string().optional(),
});

export const rescheduleOrderSchema = z.object({
  newScheduledDate: z.string().min(1, 'New scheduled date is required'),
  agentId: z.string().uuid().optional(),
});
