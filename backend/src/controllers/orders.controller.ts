import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { OrderService } from '../services/order.service';
import { AssignmentService } from '../services/assignment.service';
import { ZoneService } from '../services/zone.service';
import {
  quoteOrderSchema,
  createOrderSchema,
  assignAgentSchema,
  updateOrderStatusSchema,
  rescheduleOrderSchema,
} from '../validators/orders.validator';
import { OrderStatus } from '@prisma/client';

export class OrdersController {
  public static async getAreas(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const areas = await ZoneService.getAreas();
      return res.status(200).json(areas);
    } catch (err) {
      next(err);
    }
  }

  public static async quote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = quoteOrderSchema.parse(req.body);
      const quoteResult = await OrderService.quote(validated);
      return res.status(200).json(quoteResult);
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createOrderSchema.parse(req.body);
      const order = await OrderService.createOrder(validated, req.user!);
      return res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id, req.user!);
      return res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, zoneId, agentId, paymentType, orderType, page, pageSize } = req.query;

      const result = await OrderService.getOrders(req.user!, {
        status: status ? (status as OrderStatus) : undefined,
        zoneId: zoneId ? (zoneId as string) : undefined,
        agentId: agentId ? (agentId as string) : undefined,
        paymentType,
        orderType,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async assign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = assignAgentSchema.parse(req.body);

      const updatedOrder = await AssignmentService.assignAgent(
        id,
        { agentId: validated.agentId, auto: validated.auto },
        req.user!.userId
      );

      return res.status(200).json(updatedOrder);
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateOrderStatusSchema.parse(req.body);

      const updatedOrder = await OrderService.updateOrderStatus(
        id,
        validated.status,
        validated.note,
        req.user!
      );

      return res.status(200).json(updatedOrder);
    } catch (err) {
      next(err);
    }
  }

  public static async reschedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = rescheduleOrderSchema.parse(req.body);

      const updatedOrder = await OrderService.rescheduleOrder(
        id,
        validated.newScheduledDate,
        validated.agentId,
        req.user!
      );

      return res.status(200).json(updatedOrder);
    } catch (err) {
      next(err);
    }
  }
}
