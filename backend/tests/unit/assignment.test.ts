import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Role, OrderType, PaymentType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AssignmentService } from '../../src/services/assignment.service';
import { UnprocessableEntityError } from '../../src/utils/errors';

const prisma = new PrismaClient();

describe('AssignmentService Unit Tests', () => {
  let adminId: string;
  let customerId: string;
  let zoneCentralId: string;
  let zoneSouthId: string;
  let areaCentralId: string;
  let agentCentralId: string;
  let agentSouthId: string;
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

    const admin = await prisma.user.create({
      data: { name: 'Admin', email: 'assign_admin@test.com', passwordHash: pwd, role: Role.ADMIN, phone: '12345678' },
    });
    adminId = admin.id;

    const cust = await prisma.user.create({
      data: { name: 'Cust', email: 'assign_cust@test.com', passwordHash: pwd, role: Role.CUSTOMER, phone: '87654321' },
    });
    customerId = cust.id;

    const z1 = await prisma.zone.create({ data: { name: 'Assign Central' } });
    const z2 = await prisma.zone.create({ data: { name: 'Assign South' } });
    zoneCentralId = z1.id;
    zoneSouthId = z2.id;

    const area = await prisma.area.create({ data: { name: 'Assign Area Central', zoneId: zoneCentralId } });
    areaCentralId = area.id;

    const rateCard = await prisma.rateCard.create({
      data: { orderType: OrderType.B2C, rateType: 'INTRA_ZONE', baseFee: 10, ratePerKg: 5, isActive: true },
    });

    // Agents
    const ag1User = await prisma.user.create({
      data: { name: 'Central Agent', email: 'ag_central@test.com', passwordHash: pwd, role: Role.AGENT, phone: '1111' },
    });
    const ag1Profile = await prisma.agentProfile.create({
      data: { userId: ag1User.id, zoneId: zoneCentralId, isAvailable: true },
    });
    agentCentralId = ag1Profile.id;

    const ag2User = await prisma.user.create({
      data: { name: 'South Agent', email: 'ag_south@test.com', passwordHash: pwd, role: Role.AGENT, phone: '2222' },
    });
    const ag2Profile = await prisma.agentProfile.create({
      data: { userId: ag2User.id, zoneId: zoneSouthId, isAvailable: true },
    });
    agentSouthId = ag2Profile.id;

    // Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-TEST-001',
        customerId,
        pickupAddress: 'Pickup 1',
        pickupAreaId: areaCentralId,
        dropAddress: 'Drop 1',
        dropAreaId: areaCentralId,
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
        currentStatus: OrderStatus.CREATED,
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should auto-assign same-zone available agent preferentially', async () => {
    const updated = await AssignmentService.assignAgent(orderId, { auto: true }, adminId);

    expect(updated.assignedAgentId).toBe(agentCentralId);
    expect(updated.currentStatus).toBe(OrderStatus.ASSIGNED);

    // Verify agent is marked unavailable
    const agentProfile = await prisma.agentProfile.findUnique({ where: { id: agentCentralId } });
    expect(agentProfile?.isAvailable).toBe(false);
  });

  it('should throw 422 if no available agents remain when auto-assigning', async () => {
    // Mark South agent unavailable as well
    await prisma.agentProfile.update({ where: { id: agentSouthId }, data: { isAvailable: false } });

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: 'ORD-TEST-002',
        customerId,
        pickupAddress: 'P2',
        pickupAreaId: areaCentralId,
        dropAddress: 'D2',
        dropAreaId: areaCentralId,
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10,
        actualWeightKg: 1,
        volumetricWeightKg: 0.2,
        chargeableWeightKg: 1,
        orderType: OrderType.B2C,
        paymentType: PaymentType.PREPAID,
        rateCardIdUsed: (await prisma.rateCard.findFirst())!.id,
        baseFee: 10,
        weightCharge: 5,
        codSurcharge: 0,
        totalCharge: 15,
        currentStatus: OrderStatus.CREATED,
      },
    });

    await expect(AssignmentService.assignAgent(newOrder.id, { auto: true }, adminId)).rejects.toThrow(
      UnprocessableEntityError
    );
  });
});
