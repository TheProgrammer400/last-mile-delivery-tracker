import React, { useState, useEffect } from 'react';
import { getOrdersApi, updateOrderStatusApi, updateSelfAvailabilityApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  AlertCircle,
  Power,
  Send,
  Phone,
  Clock,
} from 'lucide-react';

const LEGAL_NEXT_STATES: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['ASSIGNED', 'FAILED'],
  ASSIGNED: ['PICKED_UP', 'FAILED'],
  PICKED_UP: ['IN_TRANSIT', 'FAILED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['RESCHEDULED'],
  RESCHEDULED: ['ASSIGNED', 'FAILED'],
};

export const MyDeliveries: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('PICKED_UP');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Timeline view modal
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const res = await getOrdersApi({ pageSize: 50 });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch assigned deliveries', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    const validStates = LEGAL_NEXT_STATES[order.currentStatus] || [];
    if (validStates.length > 0) {
      setNextStatus(validStates[0]);
    }
    setNote('');
    setUpdateError(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (nextStatus === 'FAILED' && !note.trim()) {
      setUpdateError('Note (failure reason) is required when marking status as Failed');
      return;
    }

    setUpdateError(null);
    setIsUpdating(true);

    try {
      await updateOrderStatusApi(selectedOrder.id, nextStatus, note);
      setSelectedOrder(null);
      await fetchDeliveries();
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!user || !user.agentProfile) return;
    const newStatus = !user.agentProfile.isAvailable;
    try {
      await updateSelfAvailabilityApi(newStatus);
      updateUser({
        ...user,
        agentProfile: {
          ...user.agentProfile,
          isAvailable: newStatus,
        },
      });
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Stitch Screen 4 Mobile Header */}
      <div className="bg-white border border-[#E2E8F0] rounded p-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-base font-bold text-[#0F172A] flex items-center gap-1.5">
            <Truck className="w-5 h-5 text-[#0F172A]" />
            Agent Dispatch
          </h1>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Hub Zone: <strong className="text-[#0F172A]">{user?.agentProfile?.zone?.name || 'Assigned Zone'}</strong>
          </p>
        </div>

        {/* Functional Online/Offline Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border transition-all ${
            user?.agentProfile?.isAvailable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
          }`}
        >
          <Power className={`w-3.5 h-3.5 ${user?.agentProfile?.isAvailable ? 'text-emerald-700' : 'text-slate-500'}`} />
          <span>{user?.agentProfile?.isAvailable ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      {/* Active Deliveries List (Stacked Mobile Cards) */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton count={3} className="h-28" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Active Deliveries"
          description="You currently have no active orders assigned to your agent profile."
          icon={Truck}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const validNextStates = LEGAL_NEXT_STATES[order.currentStatus] || [];
            const canUpdate = validNextStates.length > 0;

            return (
              <div key={order.id} className="bg-white border border-[#E2E8F0] rounded p-4 space-y-3 shadow-sm">
                {/* Header Row: Order Number in JetBrains Mono & Status Badge */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#0F172A] block">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">
                      {order.paymentType} • ₹{order.totalCharge}
                    </span>
                  </div>
                  <StatusBadge status={order.currentStatus} size="sm" />
                </div>

                {/* Customer Info & Direct Call Action */}
                <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">{order.customer.name}</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold text-[11px] flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-700" />
                      Call
                    </a>
                  </div>

                  {/* Pickup & Drop Addresses */}
                  <div className="space-y-1.5 pt-1.5 border-t border-[#E2E8F0] text-[11px]">
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">Pickup</span>
                      <span className="text-slate-800 font-medium">{order.pickupAddress} ({order.pickupArea?.name})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[9px] font-bold block">Drop-off</span>
                      <span className="text-slate-800 font-medium">{order.dropAddress} ({order.dropArea?.name})</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setTimelineOrder(order)}
                    className="text-xs text-slate-600 hover:text-[#0F172A] underline font-medium flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3 text-slate-400" />
                    Timeline
                  </button>

                  {canUpdate ? (
                    <button
                      onClick={() => openStatusModal(order)}
                      className="glass-button-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Update Status
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Terminal State</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Status Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Update Status: #${selectedOrder.orderNumber}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="text-xs text-slate-600 font-mono">
              Current Status: <strong className="text-[#0F172A]">{selectedOrder.currentStatus}</strong>
            </div>

            {updateError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
                <span>{updateError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Next Legal Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full glass-input text-xs font-mono bg-white"
              >
                {(LEGAL_NEXT_STATES[selectedOrder.currentStatus] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Note / Failure Reason {nextStatus === 'FAILED' && <span className="text-[#BA1A1A]">*</span>}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  nextStatus === 'FAILED'
                    ? 'Enter failure reason (e.g. Customer unreachable / Door locked)'
                    : 'Optional status note'
                }
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="glass-button-secondary text-xs py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="glass-button-primary text-xs py-1.5 px-4"
              >
                {isUpdating ? 'Saving...' : 'Submit Status Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Timeline View Modal */}
      {timelineOrder && (
        <Modal
          isOpen={!!timelineOrder}
          onClose={() => setTimelineOrder(null)}
          title={`Timeline: #${timelineOrder.orderNumber}`}
        >
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            <Timeline history={timelineOrder.statusHistory || []} />
          </div>
        </Modal>
      )}
    </div>
  );
};
