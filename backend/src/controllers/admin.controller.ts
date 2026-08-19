import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { ZoneService } from '../services/zone.service';
import { prisma } from '../utils/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
import {
  createZoneSchema,
  createAreaSchema,
  updateAreaZoneSchema,
  createRateCardSchema,
  createCodSurchargeSchema,
  createAgentSchema,
} from '../validators/admin.validator';

export class AdminController {
  // Zones
  public static async createZone(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createZoneSchema.parse(req.body);
      const zone = await ZoneService.createZone(validated.name);
      return res.status(201).json(zone);
    } catch (err) {
      next(err);
    }
  }

  public static async getZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await ZoneService.getZones();
      return res.status(200).json(zones);
    } catch (err) {
      next(err);
    }
  }

  // Areas
  public static async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAreaSchema.parse(req.body);
      const area = await ZoneService.createArea(validated.name, validated.zoneId);
      return res.status(201).json(area);
    } catch (err) {
      next(err);
    }
  }

  public static async updateAreaZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateAreaZoneSchema.parse(req.body);
      const updatedArea = await ZoneService.updateAreaZone(id, validated.zoneId);
      return res.status(200).json(updatedArea);
    } catch (err) {
      next(err);
    }
  }

  public static async getAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await ZoneService.getAreas();
      return res.status(200).json(areas);
    } catch (err) {
      next(err);
    }
  }

  // Rate Cards
  public static async createRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createRateCardSchema.parse(req.body);
      const rateCard = await ZoneService.createRateCard({
        orderType: validated.orderType,
        rateType: validated.rateType,
        ratePerKg: validated.ratePerKg,
        baseFee: validated.baseFee,
        effectiveFrom: validated.effectiveFrom ? new Date(validated.effectiveFrom) : undefined,
      });
      return res.status(201).json(rateCard);
    } catch (err) {
      next(err);
    }
  }

  public static async getRateCards(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const rateCards = await ZoneService.getRateCards(activeOnly);
      return res.status(200).json(rateCards);
    } catch (err) {
      next(err);
    }
  }

  // COD Surcharges
  public static async createCodSurcharge(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCodSurchargeSchema.parse(req.body);
      const surcharge = await ZoneService.createCodSurcharge(validated);
      return res.status(201).json(surcharge);
    } catch (err) {
      next(err);
    }
  }

  public static async getCodSurcharges(req: Request, res: Response, next: NextFunction) {
    try {
      const surcharges = await ZoneService.getCodSurcharges();
      return res.status(200).json(surcharges);
    } catch (err) {
      next(err);
    }
  }

  // Agents Management
  public static async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAgentSchema.parse(req.body);

      const zone = await prisma.zone.findUnique({ where: { id: validated.zoneId } });
      if (!zone) {
        throw new NotFoundError(`Zone with ID '${validated.zoneId}' not found`);
      }

      const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
      if (existingUser) {
        throw new ConflictError(`User with email '${validated.email}' already exists`);
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: validated.name,
            email: validated.email,
            passwordHash,
            role: Role.AGENT,
            phone: validated.phone,
          },
        });

        const agentProfile = await tx.agentProfile.create({
          data: {
            userId: user.id,
            zoneId: validated.zoneId,
            currentLat: validated.currentLat || null,
            currentLng: validated.currentLng || null,
            isAvailable: true,
          },
          include: { user: true, zone: true },
        });

        return agentProfile;
      });

      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const zoneId = req.query.zoneId as string | undefined;
      const availableOnly = req.query.available === 'true';

      const where: any = {};
      if (zoneId) {
        where.zoneId = zoneId;
      }
      if (availableOnly) {
        where.isAvailable = true;
      }

      const agents = await prisma.agentProfile.findMany({
        where,
        include: {
          user: true,
          zone: true,
          _count: {
            select: { assignedOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(agents);
    } catch (err) {
      next(err);
    }
  }

  // Admin Dashboard Summary Metrics
  public static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        totalAgents,
        availableAgents,
        zonesCount,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { currentStatus: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
        prisma.order.count({ where: { currentStatus: 'DELIVERED' } }),
        prisma.order.count({ where: { currentStatus: 'FAILED' } }),
        prisma.agentProfile.count(),
        prisma.agentProfile.count({ where: { isAvailable: true } }),
        prisma.zone.count(),
      ]);

      return res.status(200).json({
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        totalAgents,
        availableAgents,
        zonesCount,
      });
    } catch (err) {
      next(err);
    }
  }
}
