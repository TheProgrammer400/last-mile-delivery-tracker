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
  ArrowRight,
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
    <div className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-4 text-[#F8FAFC]">
      {/* Mobile Dispatch Header */}
      <div className="bg-[#111827] border border-[#263449] rounded-md p-4 flex items-center justify-between shadow-xs font-mono">
        <div>
          <h1 className="text-base font-bold text-[#F8FAFC] flex items-center gap-1.5">
            <Truck className="w-5 h-5 text-indigo-400" />
            Agent Mobile Dispatch
          </h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            Hub: <strong className="text-indigo-400">{user?.agentProfile?.zone?.name || 'Assigned Hub'}</strong>
          </p>
        </div>

        {/* Online/Offline Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border transition-all ${
            user?.agentProfile?.isAvailable
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-[#172033] text-[#94A3B8] border-[#263449] hover:bg-[#1E293B]'
          }`}
        >
          <Power className={`w-3.5 h-3.5 ${user?.agentProfile?.isAvailable ? 'text-emerald-400' : 'text-[#94A3B8]'}`} />
          <span>{user?.agentProfile?.isAvailable ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      {/* Active Deliveries List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton count={3} className="h-32" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Active Field Deliveries"
          description="You currently have no active orders assigned to your agent profile."
          icon={Truck}
        />
      ) : (
        <div className="space-y-3 font-mono">
          {orders.map((order) => {
            const validNextStates = LEGAL_NEXT_STATES[order.currentStatus] || [];
            const canUpdate = validNextStates.length > 0;

            return (
              <div key={order.id} className="bg-[#111827] border border-[#263449] rounded-md p-4 space-y-3 shadow-xs">
                {/* Header Row: Order Number & Status Badge */}
                <div className="flex items-center justify-between border-b border-[#263449] pb-2.5">
                  <div>
                    <span className="font-bold text-sm text-indigo-400 block">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-semibold">
                      {order.paymentType} • ₹{Number(order.totalCharge).toFixed(2)}
                    </span>
                  </div>
                  <StatusBadge status={order.currentStatus} size="sm" />
                </div>

                {/* Customer Info & Direct Call Action */}
                <div className="bg-[#172033] p-3 rounded-md border border-[#263449] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F8FAFC]">{order.customer.name}</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-all"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      Call Customer
                    </a>
                  </div>

                  {/* Pickup & Drop Addresses */}
                  <div className="space-y-1.5 pt-1.5 border-t border-[#263449] text-[11px]">
                    <div>
                      <span className="text-[#94A3B8] uppercase text-[9px] font-bold block">Pickup Origin</span>
                      <span className="text-[#CBD5E1] font-medium">{order.pickupAddress} ({order.pickupArea?.name})</span>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] uppercase text-[9px] font-bold block">Drop Destination</span>
                      <span className="text-[#CBD5E1] font-medium">{order.dropAddress} ({order.dropArea?.name})</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setTimelineOrder(order)}
                    className="text-xs text-[#94A3B8] hover:text-indigo-400 underline font-medium flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Timeline Audit
                  </button>

                  {canUpdate ? (
                    <button
                      onClick={() => openStatusModal(order)}
                      className="glass-button-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Update Status
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Terminal State</span>
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
          <form onSubmit={handleStatusSubmit} className="space-y-4 font-mono">
            <div className="text-xs text-[#94A3B8]">
              Current Operational Status: <strong className="text-indigo-400">{selectedOrder.currentStatus}</strong>
            </div>

            {updateError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{updateError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Select Next Permitted Legal State
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full glass-input text-xs font-mono bg-[#172033]"
              >
                {(LEGAL_NEXT_STATES[selectedOrder.currentStatus] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Status Note / Failure Reason {nextStatus === 'FAILED' && <span className="text-rose-400">*</span>}
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

            <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
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
          title={`Timeline Audit: #${timelineOrder.orderNumber}`}
        >
          <div className="py-2 max-h-[60vh] overflow-y-auto font-mono">
            <Timeline history={timelineOrder.statusHistory || []} />
          </div>
        </Modal>
      )}
    </div>
  );
};

