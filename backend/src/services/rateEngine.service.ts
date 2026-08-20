import { OrderType, PaymentType, RateType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BadRequestError, UnprocessableEntityError } from '../utils/errors';
import { DistanceService } from './distance.service';

export interface RateQuoteInput {
  pickupAreaId: string;
  dropAreaId: string;
  pickupAddress?: string;
  dropAddress?: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
}

export interface RateQuoteResult {
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  rateType: RateType;
  rateCardId: string;
  distanceKm: number;
  chargePerKm: number;
  baseFee: number;
  ratePerKg: number;
  weightCharge: number;
  codSurcharge: number;
  totalCharge: number;
  pickupZoneName: string;
  dropZoneName: string;
}

export class RateEngineService {
  public static async calculateQuote(input: RateQuoteInput): Promise<RateQuoteResult> {
    if (input.lengthCm <= 0 || input.breadthCm <= 0 || input.heightCm <= 0) {
      throw new BadRequestError('Package dimensions (length, breadth, height) must be greater than 0');
    }
    if (input.actualWeightKg <= 0) {
      throw new BadRequestError('Actual weight must be greater than 0');
    }

    // 1. Fetch Area and Zone mappings
    const [pickupArea, dropArea] = await Promise.all([
      prisma.area.findUnique({ where: { id: input.pickupAreaId }, include: { zone: true } }),
      prisma.area.findUnique({ where: { id: input.dropAreaId }, include: { zone: true } }),
    ]);

    if (!pickupArea) {
      throw new BadRequestError(`Pickup area with ID '${input.pickupAreaId}' not found`);
    }
    if (!dropArea) {
      throw new BadRequestError(`Drop area with ID '${input.dropAreaId}' not found`);
    }

    // 2. Determine INTRA_ZONE vs INTER_ZONE
    const rateType = pickupArea.zoneId === dropArea.zoneId ? RateType.INTRA_ZONE : RateType.INTER_ZONE;

    // 3. Calculate driving distance using Google Maps Distance Service
    const origin = input.pickupAddress ? `${input.pickupAddress}, ${pickupArea.name}` : pickupArea.name;
    const destination = input.dropAddress ? `${input.dropAddress}, ${dropArea.name}` : dropArea.name;

    const distanceKm = await DistanceService.getDrivingDistance(
      origin,
      destination,
      pickupArea.name,
      dropArea.name
    );

    // 4. Compute Volumetric and Chargeable weight
    // Formula: (L x B x H) / 5000
    const rawVolumetric = (input.lengthCm * input.breadthCm * input.heightCm) / 5000;
    // Round to 2 decimal places cleanly
    const volumetricWeightKg = Math.round(rawVolumetric * 100) / 100;
    const chargeableWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);

    // 5. Lookup active RateCard for (orderType, rateType)
    const rateCard = await prisma.rateCard.findFirst({
      where: {
        orderType: input.orderType,
        rateType,
        isActive: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rateCard) {
      throw new UnprocessableEntityError(
        `No active rate card configured for Order Type '${input.orderType}' and Rate Type '${rateType}'`
      );
    }

    const chargePerKm = Number(rateCard.chargePerKm);
    const ratePerKg = Number(rateCard.ratePerKg);

    // NEW BASE FEE LOGIC: Base Fee = Distance (km) x Charge Per Km
    const baseFee = Math.round(distanceKm * chargePerKm * 100) / 100;

    // PRESERVED LOGIC: Weight Charge = Chargeable Weight x Rate Per Kg
    const weightCharge = Math.round(chargeableWeightKg * ratePerKg * 100) / 100;

    // PRESERVED LOGIC: COD Surcharge application
    let codSurcharge = 0;
    if (input.paymentType === PaymentType.COD) {
      const surchargeRecord = await prisma.codSurcharge.findFirst({
        where: {
          orderType: input.orderType,
          isActive: true,
        },
      });
      if (surchargeRecord) {
        codSurcharge = Number(surchargeRecord.amount);
      }
    }

    const totalCharge = Math.round((baseFee + weightCharge + codSurcharge) * 100) / 100;

    return {
      volumetricWeightKg,
      chargeableWeightKg,
      rateType,
      rateCardId: rateCard.id,
      distanceKm,
      chargePerKm,
      baseFee,
      ratePerKg,
      weightCharge,
      codSurcharge,
      totalCharge,
      pickupZoneName: pickupArea.zone.name,
      dropZoneName: dropArea.zone.name,
    };
  }
}
