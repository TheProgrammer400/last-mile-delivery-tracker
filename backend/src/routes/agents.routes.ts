import { Router } from 'express';
import { Role } from '@prisma/client';
import { AgentsController } from '../controllers/agents.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(authenticate, requireRole(Role.AGENT));

router.patch('/me/availability', AgentsController.updateSelfAvailability);

export default router;
