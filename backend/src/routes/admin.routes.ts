import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole(Role.ADMIN));

// Dashboard Stats
router.get('/dashboard-stats', AdminController.getDashboardStats);

// Zones
router.post('/zones', AdminController.createZone);
router.get('/zones', AdminController.getZones);

// Areas
router.post('/areas', AdminController.createArea);
router.patch('/areas/:id', AdminController.updateAreaZone);
router.get('/areas', AdminController.getAreas);

// Rate Cards
router.post('/rate-cards', AdminController.createRateCard);
router.get('/rate-cards', AdminController.getRateCards);

// COD Surcharges
router.post('/cod-surcharge', AdminController.createCodSurcharge);
router.get('/cod-surcharge', AdminController.getCodSurcharges);

// Agents
router.post('/agents', AdminController.createAgent);
router.get('/agents', AdminController.getAgents);

export default router;
