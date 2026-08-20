import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, OrderType, PaymentType } from '@prisma/client';
import { RateEngineService } from '../../src/services/rateEngine.service';
import { UnprocessableEntityError, BadRequestError } from '../../src/utils/errors';

const prisma = new PrismaClient();

describe('RateEngineService Unit Tests', () => {
  let zoneCentralId: string;
  let zoneSouthId: string;
  let areaTNagarId: string;
  let areaNungambakkamId: string;
  let areaVelacheryId: string;

  beforeAll(async () => {
    // Setup clean test zones & areas
    await prisma.notificationLog.deleteMany();
    await prisma.rescheduleRequest.deleteMany();
    await prisma.orderStatusHistory.deleteMany();
    await prisma.order.deleteMany();
    await prisma.agentProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rateCard.deleteMany();
    await prisma.codSurcharge.deleteMany();
    await prisma.area.deleteMany();
    await prisma.zone.deleteMany();

    const z1 = await prisma.zone.create({ data: { name: 'Test Central' } });
    const z2 = await prisma.zone.create({ data: { name: 'Test South' } });
    zoneCentralId = z1.id;
    zoneSouthId = z2.id;

    const a1 = await prisma.area.create({ data: { name: 'Test T.Nagar', zoneId: zoneCentralId } });
    const a2 = await prisma.area.create({ data: { name: 'Test Nungambakkam', zoneId: zoneCentralId } });
    const a3 = await prisma.area.create({ data: { name: 'Test Velachery', zoneId: zoneSouthId } });

    areaTNagarId = a1.id;
    areaNungambakkamId = a2.id;
    areaVelacheryId = a3.id;

    // Rate Cards with chargePerKm
    await prisma.rateCard.create({
      data: {
        orderType: OrderType.B2C,
        rateType: 'INTRA_ZONE',
        chargePerKm: 8.0,
        baseFee: 0,
        ratePerKg: 10,
        isActive: true,
      },
    });

    await prisma.rateCard.create({
      data: {
        orderType: OrderType.B2C,
        rateType: 'INTER_ZONE',
        chargePerKm: 10.0,
        baseFee: 0,
        ratePerKg: 18,
        isActive: true,
      },
    });

    // COD Surcharge
    await prisma.codSurcharge.create({
      data: {
        orderType: OrderType.B2C,
        amount: 25,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should calculate distance-based Base Fee (Distance x Charge Per Km) for INTRA_ZONE route', async () => {
    const result = await RateEngineService.calculateQuote({
      pickupAreaId: areaTNagarId,
      dropAreaId: areaNungambakkamId,
      lengthCm: 20,
      breadthCm: 15,
      heightCm: 10,
      actualWeightKg: 2.0,
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
    });

    expect(result.rateType).toBe('INTRA_ZONE');
    expect(result.volumetricWeightKg).toBe(0.6);
    expect(result.chargeableWeightKg).toBe(2.0);
    expect(result.chargePerKm).toBe(8.0);
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.baseFee).toBe(Math.round(result.distanceKm * 8.0 * 100) / 100);
    expect(result.weightCharge).toBe(20);
    expect(result.codSurcharge).toBe(0);
    expect(result.totalCharge).toBe(Math.round((result.baseFee + 20 + 0) * 100) / 100);
  });

  it('should calculate distance-based Base Fee and apply COD surcharge for INTER_ZONE route', async () => {
    const result = await RateEngineService.calculateQuote({
      pickupAreaId: areaTNagarId,
      dropAreaId: areaVelacheryId,
      lengthCm: 50,
      breadthCm: 40,
      heightCm: 30,
      actualWeightKg: 3.0,
      orderType: OrderType.B2C,
      paymentType: PaymentType.COD,
    });

    expect(result.rateType).toBe('INTER_ZONE');
    expect(result.volumetricWeightKg).toBe(12.0);
    expect(result.chargeableWeightKg).toBe(12.0);
    expect(result.chargePerKm).toBe(10.0);
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.baseFee).toBe(Math.round(result.distanceKm * 10.0 * 100) / 100);
    expect(result.weightCharge).toBe(216); // 12.0 kg * 18/kg = 216
    expect(result.codSurcharge).toBe(25);
    expect(result.totalCharge).toBe(Math.round((result.baseFee + 216 + 25) * 100) / 100);
  });

  it('should throw BadRequestError for invalid dimensions or weight', async () => {
    await expect(
      RateEngineService.calculateQuote({
        pickupAreaId: areaTNagarId,
        dropAreaId: areaNungambakkamId,
        lengthCm: 0,
        breadthCm: 10,
        heightCm: 10,
        actualWeightKg: 2,
        orderType: OrderType.B2C,
        paymentType: PaymentType.PREPAID,
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw UnprocessableEntityError when no active rate card exists for specified combination', async () => {
    await expect(
      RateEngineService.calculateQuote({
        pickupAreaId: areaTNagarId,
        dropAreaId: areaNungambakkamId,
        lengthCm: 10,
        breadthCm: 10,
        heightCm: 10,
        actualWeightKg: 2,
        orderType: OrderType.B2B, // B2B rate card not configured
        paymentType: PaymentType.PREPAID,
      })
    ).rejects.toThrow(UnprocessableEntityError);
  });
});
