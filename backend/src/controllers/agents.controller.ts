import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { z } from 'zod';

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export class AgentsController {
  public static async updateSelfAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateAvailabilitySchema.parse(req.body);

      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: req.user!.userId },
      });

      if (!agentProfile) {
        throw new NotFoundError('Agent profile not found for current user');
      }

      const updated = await prisma.agentProfile.update({
        where: { id: agentProfile.id },
        data: { isAvailable: validated.isAvailable },
        include: { user: true, zone: true },
      });

      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}
