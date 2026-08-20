import { OrderType, RateType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';

export class ZoneService {
  public static async createZone(name: string) {
    const existing = await prisma.zone.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictError(`Zone with name '${name}' already exists`);
    }
    return prisma.zone.create({ data: { name } });
  }

  public static async getZones() {
    return prisma.zone.findMany({
      include: {
        _count: {
          select: { areas: true, agents: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  public static async createArea(name: string, zoneId: string) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundError(`Zone with ID '${zoneId}' not found`);
    }

    const existing = await prisma.area.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictError(`Area with name '${name}' already exists`);
    }

    return prisma.area.create({
      data: { name, zoneId },
      include: { zone: true },
    });
  }

  public static async updateAreaZone(areaId: string, zoneId: string) {
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      throw new NotFoundError(`Area with ID '${areaId}' not found`);
    }

    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundError(`Zone with ID '${zoneId}' not found`);
    }

    return prisma.area.update({
      where: { id: areaId },
      data: { zoneId },
      include: { zone: true },
    });
  }

  public static async getAreas() {
    return prisma.area.findMany({
      include: { zone: true },
      orderBy: { name: 'asc' },
    });
  }

  public static async createRateCard(data: {
    orderType: OrderType;
    rateType: RateType;
    chargePerKm?: number;
    ratePerKg: number;
    baseFee?: number;
    effectiveFrom?: Date;
  }) {
    // Transaction to deactivate existing active card for (orderType, rateType) and create new one
    return prisma.$transaction(async (tx) => {
      await tx.rateCard.updateMany({
        where: {
          orderType: data.orderType,
          rateType: data.rateType,
          isActive: true,
        },
        data: { isActive: false },
      });

      return tx.rateCard.create({
        data: {
          orderType: data.orderType,
          rateType: data.rateType,
          chargePerKm: data.chargePerKm ?? 8.0,
          ratePerKg: data.ratePerKg,
          baseFee: data.baseFee ?? 0,
          effectiveFrom: data.effectiveFrom || new Date(),
          isActive: true,
        },
      });
    });
  }

  public static async getRateCards(activeOnly: boolean = false) {
    return prisma.rateCard.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ isActive: 'desc' }, { effectiveFrom: 'desc' }],
    });
  }

  public static async createCodSurcharge(data: { orderType: OrderType; amount: number }) {
    return prisma.$transaction(async (tx) => {
      await tx.codSurcharge.updateMany({
        where: {
          orderType: data.orderType,
          isActive: true,
        },
        data: { isActive: false },
      });

      return tx.codSurcharge.create({
        data: {
          orderType: data.orderType,
          amount: data.amount,
          isActive: true,
        },
      });
    });
  }

  public static async getCodSurcharges() {
    return prisma.codSurcharge.findMany({
      orderBy: { orderType: 'asc' },
    });
  }
}
