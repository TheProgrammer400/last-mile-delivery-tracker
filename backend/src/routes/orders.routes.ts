import { Router } from 'express';
import { Role } from '@prisma/client';
import { OrdersController } from '../controllers/orders.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(authenticate);

// Quote calculation endpoint (Customer & Admin)
router.post('/quote', requireRole(Role.CUSTOMER, Role.ADMIN), OrdersController.quote);

// Order creation endpoint (Customer & Admin)
router.post('/', requireRole(Role.CUSTOMER, Role.ADMIN), OrdersController.create);

// List orders (Filtered by Role)
router.get('/', OrdersController.list);

// Get available areas for order placement (All authenticated users)
router.get('/areas', OrdersController.getAreas);

// Get order detail
router.get('/:id', OrdersController.getById);

// Assign agent (Admin only)
router.post('/:id/assign', requireRole(Role.ADMIN), OrdersController.assign);

// Update status (Assigned Agent & Admin)
router.post('/:id/status', requireRole(Role.AGENT, Role.ADMIN), OrdersController.updateStatus);

// Reschedule order (Owner Customer & Admin)
router.post('/:id/reschedule', requireRole(Role.CUSTOMER, Role.ADMIN), OrdersController.reschedule);

export default router;
