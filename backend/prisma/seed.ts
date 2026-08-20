import { PrismaClient, Role, OrderType, RateType, PaymentType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notificationLog.deleteMany();
  await prisma.rescheduleRequest.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.codSurcharge.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('customer123', 10);
  const agentPasswordHash = await bcrypt.hash('agent123', 10);

  // 1. Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@delivery.com',
      passwordHash,
      role: Role.ADMIN,
      phone: '+919876543210',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'John Customer',
      email: 'customer@example.com',
      passwordHash: userPasswordHash,
      role: Role.CUSTOMER,
      phone: '+919876543211',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Acme Corp (B2B)',
      email: 'logistics@acme.com',
      passwordHash: userPasswordHash,
      role: Role.CUSTOMER,
      phone: '+919876543212',
    },
  });

  // 2. Zones
  const zoneCentral = await prisma.zone.create({ data: { name: 'Chennai Central' } });
  const zoneSouth = await prisma.zone.create({ data: { name: 'Chennai South' } });
  const zoneNorth = await prisma.zone.create({ data: { name: 'Chennai North' } });
  const zoneKanchipuram = await prisma.zone.create({ data: { name: 'Kanchipuram' } });

  // 3. Areas
  const areaTNagar = await prisma.area.create({ data: { name: 'T.Nagar', zoneId: zoneCentral.id } });
  const areaNungambakkam = await prisma.area.create({ data: { name: 'Nungambakkam', zoneId: zoneCentral.id } });
  const areaVelachery = await prisma.area.create({ data: { name: 'Velachery', zoneId: zoneSouth.id } });
  const areaGuindy = await prisma.area.create({ data: { name: 'Guindy', zoneId: zoneSouth.id } });
  const areaTambaram = await prisma.area.create({ data: { name: 'Tambaram', zoneId: zoneSouth.id } });
  const areaAnnaNagar = await prisma.area.create({ data: { name: 'Anna Nagar', zoneId: zoneNorth.id } });
  const areaPerambur = await prisma.area.create({ data: { name: 'Perambur', zoneId: zoneNorth.id } });
  const areaKanchipuram = await prisma.area.create({ data: { name: 'Kanchipuram Central', zoneId: zoneKanchipuram.id } });

  // 4. Agents & Profiles
  const agent1User = await prisma.user.create({
    data: {
      name: 'Ramesh Agent (Central)',
      email: 'agent1@delivery.com',
      passwordHash: agentPasswordHash,
      role: Role.AGENT,
      phone: '+919876543220',
    },
  });
  const agent1Profile = await prisma.agentProfile.create({
    data: {
      userId: agent1User.id,
      zoneId: zoneCentral.id,
      currentLat: 13.0418,
      currentLng: 80.2341,
      isAvailable: true,
    },
  });

  const agent2User = await prisma.user.create({
    data: {
      name: 'Suresh Agent (South)',
      email: 'agent2@delivery.com',
      passwordHash: agentPasswordHash,
      role: Role.AGENT,
      phone: '+919876543221',
    },
  });
  const agent2Profile = await prisma.agentProfile.create({
    data: {
      userId: agent2User.id,
      zoneId: zoneSouth.id,
      currentLat: 12.9759,
      currentLng: 80.2212,
      isAvailable: true,
    },
  });

  const agent3User = await prisma.user.create({
    data: {
      name: 'Karthik Agent (North)',
      email: 'agent3@delivery.com',
      passwordHash: agentPasswordHash,
      role: Role.AGENT,
      phone: '+919876543222',
    },
  });
  const agent3Profile = await prisma.agentProfile.create({
    data: {
      userId: agent3User.id,
      zoneId: zoneNorth.id,
      currentLat: 13.0878,
      currentLng: 80.2144,
      isAvailable: true,
    },
  });

  // 5. Rate Cards
  const rcB2BIntra = await prisma.rateCard.create({
    data: {
      orderType: OrderType.B2B,
      rateType: RateType.INTRA_ZONE,
      chargePerKm: 10.0,
      baseFee: 0.0,
      ratePerKg: 15.0,
      isActive: true,
    },
  });

  const rcB2BInter = await prisma.rateCard.create({
    data: {
      orderType: OrderType.B2B,
      rateType: RateType.INTER_ZONE,
      chargePerKm: 12.0,
      baseFee: 0.0,
      ratePerKg: 25.0,
      isActive: true,
    },
  });

  const rcB2CIntra = await prisma.rateCard.create({
    data: {
      orderType: OrderType.B2C,
      rateType: RateType.INTRA_ZONE,
      chargePerKm: 8.0,
      baseFee: 0.0,
      ratePerKg: 10.0,
      isActive: true,
    },
  });

  const rcB2CInter = await prisma.rateCard.create({
    data: {
      orderType: OrderType.B2C,
      rateType: RateType.INTER_ZONE,
      chargePerKm: 10.0,
      baseFee: 0.0,
      ratePerKg: 18.0,
      isActive: true,
    },
  });

  // 6. COD Surcharges
  await prisma.codSurcharge.create({
    data: {
      orderType: OrderType.B2B,
      amount: 50.0,
      isActive: true,
    },
  });

  await prisma.codSurcharge.create({
    data: {
      orderType: OrderType.B2C,
      amount: 30.0,
      isActive: true,
    },
  });

  // 7. Initial Sample Orders
  // Order 1: Delivered B2C Intra
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20260819-0001',
      customerId: customer1.id,
      pickupAddress: 'No 12, Usman Road',
      pickupAreaId: areaTNagar.id,
      dropAddress: 'No 45, Sterling Road',
      dropAreaId: areaNungambakkam.id,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: 2.0,
      volumetricWeightKg: 0.6, // (20*15*10)/5000 = 0.6
      chargeableWeightKg: 2.0, // max(2.0, 0.6)
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
      rateCardIdUsed: rcB2CIntra.id,
      baseFee: 30.0,
      weightCharge: 20.0, // 2kg * 10
      codSurcharge: 0.0,
      totalCharge: 50.0,
      currentStatus: OrderStatus.DELIVERED,
      assignedAgentId: agent1Profile.id,
      statusHistory: {
        create: [
          { status: OrderStatus.CREATED, changedByUserId: customer1.id },
          { status: OrderStatus.ASSIGNED, changedByUserId: admin.id, note: 'Assigned to Ramesh Agent' },
          { status: OrderStatus.PICKED_UP, changedByUserId: agent1User.id },
          { status: OrderStatus.IN_TRANSIT, changedByUserId: agent1User.id },
          { status: OrderStatus.OUT_FOR_DELIVERY, changedByUserId: agent1User.id },
          { status: OrderStatus.DELIVERED, changedByUserId: agent1User.id, note: 'Delivered to customer' },
        ],
      },
    },
  });

  // Order 2: Failed delivery B2C Inter
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20260819-0002',
      customerId: customer1.id,
      pickupAddress: 'Block 4, Anna Nagar West',
      pickupAreaId: areaAnnaNagar.id,
      dropAddress: 'Flat 3B, Velachery Main Rd',
      dropAreaId: areaVelachery.id,
      lengthCm: 50,
      breadthCm: 40,
      heightCm: 30,
      actualWeightKg: 3.5,
      volumetricWeightKg: 12.0, // (50*40*30)/5000 = 12.0
      chargeableWeightKg: 12.0, // max(3.5, 12.0)
      orderType: OrderType.B2C,
      paymentType: PaymentType.COD,
      rateCardIdUsed: rcB2CInter.id,
      baseFee: 60.0,
      weightCharge: 216.0, // 12kg * 18
      codSurcharge: 30.0,
      totalCharge: 306.0,
      currentStatus: OrderStatus.FAILED,
      assignedAgentId: agent2Profile.id,
      statusHistory: {
        create: [
          { status: OrderStatus.CREATED, changedByUserId: customer1.id },
          { status: OrderStatus.ASSIGNED, changedByUserId: admin.id },
          { status: OrderStatus.PICKED_UP, changedByUserId: agent2User.id },
          { status: OrderStatus.IN_TRANSIT, changedByUserId: agent2User.id },
          { status: OrderStatus.OUT_FOR_DELIVERY, changedByUserId: agent2User.id },
          { status: OrderStatus.FAILED, changedByUserId: agent2User.id, note: 'Customer phone unreachable / door locked' },
        ],
      },
    },
  });

  // Order 3: Active In-Transit B2B Inter
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20260819-0003',
      customerId: customer2.id,
      pickupAddress: 'GST Road, Guindy Industrial Estate',
      pickupAreaId: areaGuindy.id,
      dropAddress: 'GNT Road, Perambur',
      dropAreaId: areaPerambur.id,
      lengthCm: 60,
      breadthCm: 50,
      heightCm: 40,
      actualWeightKg: 25.0,
      volumetricWeightKg: 24.0, // (60*50*40)/5000 = 24.0
      chargeableWeightKg: 25.0, // max(25, 24)
      orderType: OrderType.B2B,
      paymentType: PaymentType.PREPAID,
      rateCardIdUsed: rcB2BInter.id,
      baseFee: 100.0,
      weightCharge: 625.0, // 25kg * 25
      codSurcharge: 0.0,
      totalCharge: 725.0,
      currentStatus: OrderStatus.IN_TRANSIT,
      assignedAgentId: agent3Profile.id,
      statusHistory: {
        create: [
          { status: OrderStatus.CREATED, changedByUserId: customer2.id },
          { status: OrderStatus.ASSIGNED, changedByUserId: admin.id },
          { status: OrderStatus.PICKED_UP, changedByUserId: agent3User.id },
          { status: OrderStatus.IN_TRANSIT, changedByUserId: agent3User.id, note: 'Dispatched on highway route' },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin: admin@delivery.com / admin123');
  console.log('Customer: customer@example.com / customer123');
  console.log('Agent 1: agent1@delivery.com / agent123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
