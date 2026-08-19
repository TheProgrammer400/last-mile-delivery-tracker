import { OrderStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotFoundError, UnprocessableEntityError } from '../utils/errors';
import { NotificationService } from './notification.service';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class AssignmentService {
  public static async assignAgent(
    orderId: string,
    options: { agentId?: string; auto?: boolean },
    actorUserId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pickupArea: { include: { zone: true } },
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order with ID '${orderId}' not found`);
    }

    if (order.currentStatus === OrderStatus.DELIVERED || order.currentStatus === OrderStatus.FAILED) {
      throw new UnprocessableEntityError(
        `Cannot assign agent to order in terminal status '${order.currentStatus}'`
      );
    }

    let targetAgentId: string;

    if (options.agentId) {
      const agent = await prisma.agentProfile.findUnique({
        where: { id: options.agentId },
        include: { user: true },
      });
      if (!agent) {
        throw new NotFoundError(`Agent profile with ID '${options.agentId}' not found`);
      }
      targetAgentId = agent.id;
    } else if (options.auto) {
      // Find all available agents
      const availableAgents = await prisma.agentProfile.findMany({
        where: { isAvailable: true },
        include: { zone: true, user: true },
      });

      if (availableAgents.length === 0) {
        throw new UnprocessableEntityError(
          'No available agents found in the system. Please try again later or assign manually.'
        );
      }

      // Priority 1: Same zone match
      const sameZoneAgents = availableAgents.filter((a) => a.zoneId === order.pickupArea.zoneId);

      if (sameZoneAgents.length > 0) {
        targetAgentId = sameZoneAgents[0].id;
      } else {
        // Priority 2: Proximity / distance match if coordinates exist, else pick first available
        let bestAgent = availableAgents[0];
        let minDistance = Infinity;

        for (const agent of availableAgents) {
          if (agent.currentLat != null && agent.currentLng != null) {
            // Compare with default center or arbitrary fallback
            const dist = calculateHaversineDistance(13.0827, 80.2707, agent.currentLat, agent.currentLng);
            if (dist < minDistance) {
              minDistance = dist;
              bestAgent = agent;
            }
          }
        }
        targetAgentId = bestAgent.id;
      }
    } else {
      throw new UnprocessableEntityError('Must specify either agentId or auto=true for assignment');
    }

    // Execute Assignment in Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          assignedAgentId: targetAgentId,
          currentStatus: OrderStatus.ASSIGNED,
        },
        include: {
          customer: true,
          assignedAgent: { include: { user: true, zone: true } },
          pickupArea: { include: { zone: true } },
          dropArea: { include: { zone: true } },
          statusHistory: { include: { changedByUser: true }, orderBy: { createdAt: 'asc' } },
        },
      });

      // 2. Mark Agent unavailable while carrying assigned active order
      await tx.agentProfile.update({
        where: { id: targetAgentId },
        data: { isAvailable: false },
      });

      // 3. Append to OrderStatusHistory (actor = actorUserId)
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.ASSIGNED,
          changedByUserId: actorUserId,
          note: `Agent assigned: ${updated.assignedAgent?.user.name || 'Auto Assigned'}`,
        },
      });

      return updated;
    });

    // 4. Fire Notification
    await NotificationService.sendNotification({
      orderId: updatedOrder.id,
      recipientEmail: updatedOrder.customer.email,
      recipientPhone: updatedOrder.customer.phone,
      subject: `Order #${updatedOrder.orderNumber} - Agent Assigned`,
      body: `Delivery Agent ${updatedOrder.assignedAgent?.user.name} has been assigned to your order #${updatedOrder.orderNumber}. Current status: ASSIGNED.`,
      status: OrderStatus.ASSIGNED,
    });

    return updatedOrder;
  }
}
