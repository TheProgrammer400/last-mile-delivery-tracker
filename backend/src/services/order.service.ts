import { OrderStatus, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnprocessableEntityError } from '../utils/errors';
import { RateEngineService, RateQuoteInput } from './rateEngine.service';
import { AssignmentService } from './assignment.service';
import { NotificationService } from './notification.service';
import { JwtPayload } from '../utils/jwt';

const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.ASSIGNED, OrderStatus.FAILED],
  [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.FAILED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.FAILED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.FAILED]: [OrderStatus.RESCHEDULED],
  [OrderStatus.RESCHEDULED]: [OrderStatus.ASSIGNED, OrderStatus.FAILED],
};

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `ORD-${dateStr}-${randomStr}`;
}

export class OrderService {
  public static async quote(input: RateQuoteInput) {
    return RateEngineService.calculateQuote(input);
  }

  public static async createOrder(
    input: RateQuoteInput & {
      pickupAddress: string;
      dropAddress: string;
      customerId?: string;
    },
    user: JwtPayload
  ) {
    const targetCustomerId = input.customerId || user.userId;

    if (user.role !== Role.ADMIN && targetCustomerId !== user.userId) {
      throw new ForbiddenError('You can only create orders for your own account');
    }

    const customer = await prisma.user.findUnique({ where: { id: targetCustomerId } });
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${targetCustomerId}' not found`);
    }

    // 1. Recalculate Quote Server-Side
    const calculatedQuote = await RateEngineService.calculateQuote(input);

    const orderNumber = generateOrderNumber();

    // 2. Persist Order + Initial OrderStatusHistory in Transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: targetCustomerId,
          createdByAdminId: user.role === Role.ADMIN ? user.userId : null,
          pickupAddress: input.pickupAddress,
          pickupAreaId: input.pickupAreaId,
          dropAddress: input.dropAddress,
          dropAreaId: input.dropAreaId,
          lengthCm: input.lengthCm,
          breadthCm: input.breadthCm,
          heightCm: input.heightCm,
          actualWeightKg: input.actualWeightKg,
          volumetricWeightKg: calculatedQuote.volumetricWeightKg,
          chargeableWeightKg: calculatedQuote.chargeableWeightKg,
          orderType: input.orderType,
          paymentType: input.paymentType,
          rateCardIdUsed: calculatedQuote.rateCardId,
          baseFee: calculatedQuote.baseFee,
          weightCharge: calculatedQuote.weightCharge,
          codSurcharge: calculatedQuote.codSurcharge,
          totalCharge: calculatedQuote.totalCharge,
          currentStatus: OrderStatus.CREATED,
          statusHistory: {
            create: [
              {
                status: OrderStatus.CREATED,
                changedByUserId: user.userId,
                note: 'Order created',
              },
            ],
          },
        },
        include: {
          customer: true,
          pickupArea: { include: { zone: true } },
          dropArea: { include: { zone: true } },
          assignedAgent: { include: { user: true, zone: true } },
          statusHistory: { include: { changedByUser: true }, orderBy: { createdAt: 'asc' } },
        },
      });

      return created;
    });

    // 3. Dispatch Notification
    await NotificationService.sendNotification({
      orderId: newOrder.id,
      recipientEmail: newOrder.customer.email,
      recipientPhone: newOrder.customer.phone,
      subject: `Order #${newOrder.orderNumber} Confirmed`,
      body: `Your order #${newOrder.orderNumber} has been successfully created. Total Charge: $${newOrder.totalCharge}.`,
      status: OrderStatus.CREATED,
    });

    return newOrder;
  }

  public static async getOrderById(orderId: string, user: JwtPayload) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        assignedAgent: { include: { user: true, zone: true } },
        rateCardUsed: true,
        statusHistory: {
          include: { changedByUser: true },
          orderBy: { createdAt: 'asc' },
        },
        rescheduleRequests: {
          include: { requestedByUser: true, reassignedAgent: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    // Role Guard Check
    if (user.role === Role.CUSTOMER && order.customerId !== user.userId) {
      throw new ForbiddenError('You can only view your own orders');
    }

    if (user.role === Role.AGENT) {
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.userId } });
      if (!agentProfile || order.assignedAgentId !== agentProfile.id) {
        throw new ForbiddenError('You can only view orders assigned to you');
      }
    }

    return order;
  }

  public static async getOrders(
    user: JwtPayload,
    filters: {
      status?: OrderStatus;
      zoneId?: string;
      agentId?: string;
      paymentType?: any;
      orderType?: any;
      page?: number;
      pageSize?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (user.role === Role.CUSTOMER) {
      where.customerId = user.userId;
    } else if (user.role === Role.AGENT) {
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.userId } });
      if (!agentProfile) {
        return { data: [], page, pageSize, total: 0 };
      }
      where.assignedAgentId = agentProfile.id;
    }

    if (filters.status) {
      where.currentStatus = filters.status;
    }
    if (filters.agentId) {
      where.assignedAgentId = filters.agentId;
    }
    if (filters.paymentType) {
      where.paymentType = filters.paymentType;
    }
    if (filters.orderType) {
      where.orderType = filters.orderType;
    }
    if (filters.zoneId) {
      where.OR = [
        { pickupArea: { zoneId: filters.zoneId } },
        { dropArea: { zoneId: filters.zoneId } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: true,
          pickupArea: { include: { zone: true } },
          dropArea: { include: { zone: true } },
          assignedAgent: { include: { user: true, zone: true } },
          statusHistory: { include: { changedByUser: true }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note: string | undefined,
    user: JwtPayload
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        assignedAgent: { include: { user: true } },
      },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    // Role & Assignment Authorization check
    if (user.role === Role.AGENT) {
      const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.userId } });
      if (!agentProfile || order.assignedAgentId !== agentProfile.id) {
        throw new ForbiddenError('You can only update status for orders assigned to you');
      }
    } else if (user.role === Role.CUSTOMER) {
      throw new ForbiddenError('Customers cannot directly update order status');
    }

    // Legal Transition Check (unless Admin override)
    const allowedNextStates = LEGAL_TRANSITIONS[order.currentStatus] || [];
    const isLegalTransition = allowedNextStates.includes(newStatus);

    if (!isLegalTransition && user.role !== Role.ADMIN) {
      throw new ConflictError(
        `Illegal status transition from '${order.currentStatus}' to '${newStatus}'. Allowed transitions: [${allowedNextStates.join(', ')}]`
      );
    }

    // Perform Update in Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: newStatus },
        include: {
          customer: true,
          pickupArea: { include: { zone: true } },
          dropArea: { include: { zone: true } },
          assignedAgent: { include: { user: true, zone: true } },
          statusHistory: { include: { changedByUser: true }, orderBy: { createdAt: 'asc' } },
        },
      });

      // 2. Append to OrderStatusHistory (actor = user.userId)
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          changedByUserId: user.userId,
          note: note || (user.role === Role.ADMIN && !isLegalTransition ? 'Admin status override' : undefined),
        },
      });

      // 3. Release agent availability on terminal states (DELIVERED or FAILED)
      if ((newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.FAILED) && order.assignedAgentId) {
        await tx.agentProfile.update({
          where: { id: order.assignedAgentId },
          data: { isAvailable: true },
        });
      }

      return updated;
    });

    // 4. Dispatch Notification
    await NotificationService.sendNotification({
      orderId: updatedOrder.id,
      recipientEmail: updatedOrder.customer.email,
      recipientPhone: updatedOrder.customer.phone,
      subject: `Order #${updatedOrder.orderNumber} Status Updated`,
      body: `Your order #${updatedOrder.orderNumber} status has changed to '${newStatus}'. ${note ? `Note: ${note}` : ''}`,
      status: newStatus,
    });

    return updatedOrder;
  }

  public static async rescheduleOrder(
    orderId: string,
    newScheduledDateStr: string,
    agentId: string | undefined,
    user: JwtPayload
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (user.role === Role.CUSTOMER && order.customerId !== user.userId) {
      throw new ForbiddenError('You can only reschedule your own orders');
    }

    if (order.currentStatus !== OrderStatus.FAILED) {
      throw new ConflictError(`Reschedule is only permitted when order status is FAILED. Current status is '${order.currentStatus}'`);
    }

    const newScheduledDate = new Date(newScheduledDateStr);
    if (isNaN(newScheduledDate.getTime())) {
      throw new BadRequestError('Invalid newScheduledDate format');
    }

    // 1. Create Reschedule Request and set status RESCHEDULED
    await prisma.$transaction(async (tx) => {
      await tx.rescheduleRequest.create({
        data: {
          orderId,
          previousScheduledDate: order.scheduledDeliveryDate,
          newScheduledDate,
          requestedByUserId: user.userId,
          reassignedAgentId: agentId || null,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          scheduledDeliveryDate: newScheduledDate,
          currentStatus: OrderStatus.RESCHEDULED,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.RESCHEDULED,
          changedByUserId: user.userId,
          note: `Delivery rescheduled to ${newScheduledDate.toISOString().slice(0, 10)}`,
        },
      });
    });

    // 2. Trigger Re-assignment (Auto or Manual)
    const reassignedOrder = await AssignmentService.assignAgent(
      orderId,
      { agentId, auto: !agentId },
      user.userId
    );

    // 3. Dispatch Notification
    await NotificationService.sendNotification({
      orderId: reassignedOrder.id,
      recipientEmail: reassignedOrder.customer.email,
      recipientPhone: reassignedOrder.customer.phone,
      subject: `Order #${reassignedOrder.orderNumber} Rescheduled & Re-assigned`,
      body: `Your order #${reassignedOrder.orderNumber} has been rescheduled for ${newScheduledDate.toISOString().slice(0, 10)} and assigned to an agent.`,
      status: OrderStatus.RESCHEDULED,
    });

    return reassignedOrder;
  }
}
