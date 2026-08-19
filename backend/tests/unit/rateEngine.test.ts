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

    // Rate Cards
    await prisma.rateCard.create({
      data: {
        orderType: OrderType.B2C,
        rateType: 'INTRA_ZONE',
        baseFee: 30,
        ratePerKg: 10,
        isActive: true,
      },
    });

    await prisma.rateCard.create({
      data: {
        orderType: OrderType.B2C,
        rateType: 'INTER_ZONE',
        baseFee: 60,
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

  it('should calculate INTRA_ZONE quote using higher of actual vs volumetric weight', async () => {
    // Dimensions: 20x15x10 cm -> Volumetric = (20*15*10)/5000 = 0.6 kg.
    // Actual weight: 2.0 kg -> Chargeable weight = 2.0 kg.
    // Base fee: 30, Rate/kg: 10, Prepaid COD: 0 -> Total = 30 + (2.0 * 10) = 50.
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
    expect(result.baseFee).toBe(30);
    expect(result.weightCharge).toBe(20);
    expect(result.codSurcharge).toBe(0);
    expect(result.totalCharge).toBe(50);
  });

  it('should calculate INTER_ZONE quote when pickup & drop are in different zones and apply COD surcharge', async () => {
    // Dimensions: 50x40x30 cm -> Volumetric = (50*40*30)/5000 = 12.0 kg.
    // Actual weight: 3.0 kg -> Chargeable weight = 12.0 kg (higher picked).
    // Inter-zone B2C: Base 60, Rate/kg 18 -> Weight Charge = 12 * 18 = 216.
    // COD Surcharge: 25 -> Total = 60 + 216 + 25 = 301.
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
    expect(result.baseFee).toBe(60);
    expect(result.weightCharge).toBe(216);
    expect(result.codSurcharge).toBe(25);
    expect(result.totalCharge).toBe(301);
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
