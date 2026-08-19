import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role, OrderType, PaymentType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OrderService } from '../../src/services/order.service';
import { ConflictError } from '../../src/utils/errors';

const prisma = new PrismaClient();

describe('Status Lifecycle & Immutability Unit Tests', () => {
  let adminUser: any;
  let agentUser: any;
  let customerUser: any;
  let agentProfile: any;
  let orderId: string;

  beforeAll(async () => {
    await prisma.notificationLog.deleteMany();
    await prisma.orderStatusHistory.deleteMany();
    await prisma.order.deleteMany();
    await prisma.agentProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.area.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.rateCard.deleteMany();

    const pwd = await bcrypt.hash('password123', 10);

    adminUser = await prisma.user.create({
      data: { name: 'Admin Life', email: 'life_admin@test.com', passwordHash: pwd, role: Role.ADMIN, phone: '123' },
    });

    customerUser = await prisma.user.create({
      data: { name: 'Cust Life', email: 'life_cust@test.com', passwordHash: pwd, role: Role.CUSTOMER, phone: '456' },
    });

    agentUser = await prisma.user.create({
      data: { name: 'Agent Life', email: 'life_agent@test.com', passwordHash: pwd, role: Role.AGENT, phone: '789' },
    });

    const zone = await prisma.zone.create({ data: { name: 'Life Zone' } });
    const area = await prisma.area.create({ data: { name: 'Life Area', zoneId: zone.id } });

    agentProfile = await prisma.agentProfile.create({
      data: { userId: agentUser.id, zoneId: zone.id, isAvailable: false },
    });

    const rateCard = await prisma.rateCard.create({
      data: { orderType: OrderType.B2C, rateType: 'INTRA_ZONE', baseFee: 10, ratePerKg: 5, isActive: true },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-LIFE-001',
        customerId: customerUser.id,
        pickupAddress: 'P',
        pickupAreaId: area.id,
        dropAddress: 'D',
        dropAreaId: area.id,
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10,
        actualWeightKg: 1,
        volumetricWeightKg: 0.2,
        chargeableWeightKg: 1,
        orderType: OrderType.B2C,
        paymentType: PaymentType.PREPAID,
        rateCardIdUsed: rateCard.id,
        baseFee: 10,
        weightCharge: 5,
        codSurcharge: 0,
        totalCharge: 15,
        currentStatus: OrderStatus.ASSIGNED,
        assignedAgentId: agentProfile.id,
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enforce legal status progression ASSIGNED -> PICKED_UP -> IN_TRANSIT', async () => {
    const userPayload = { userId: agentUser.id, role: Role.AGENT, email: agentUser.email };

    let updated = await OrderService.updateOrderStatus(orderId, OrderStatus.PICKED_UP, 'Package picked up', userPayload);
    expect(updated.currentStatus).toBe(OrderStatus.PICKED_UP);

    updated = await OrderService.updateOrderStatus(orderId, OrderStatus.IN_TRANSIT, 'Package in transit', userPayload);
    expect(updated.currentStatus).toBe(OrderStatus.IN_TRANSIT);
  });

  it('should reject illegal status transition (IN_TRANSIT -> CREATED)', async () => {
    const userPayload = { userId: agentUser.id, role: Role.AGENT, email: agentUser.email };

    await expect(
      OrderService.updateOrderStatus(orderId, OrderStatus.CREATED, 'Invalid transition', userPayload)
    ).rejects.toThrow(ConflictError);
  });

  it('should mark agent available again on terminal DELIVERED status', async () => {
    const userPayload = { userId: agentUser.id, role: Role.AGENT, email: agentUser.email };

    await OrderService.updateOrderStatus(orderId, OrderStatus.OUT_FOR_DELIVERY, 'Out for delivery', userPayload);
    await OrderService.updateOrderStatus(orderId, OrderStatus.DELIVERED, 'Delivered safely', userPayload);

    const agent = await prisma.agentProfile.findUnique({ where: { id: agentProfile.id } });
    expect(agent?.isAvailable).toBe(true);
  });
});
