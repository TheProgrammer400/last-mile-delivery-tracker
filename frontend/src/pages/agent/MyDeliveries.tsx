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
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Power,
  ChevronRight,
  Send,
  Phone,
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Mobile-Friendly Agent Header */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-400" />
            Agent Delivery Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Zone: <strong className="text-slate-200">{user?.agentProfile?.zone?.name || 'Assigned Zone'}</strong>
          </p>
        </div>

        {/* Availability Switch */}
        <button
          onClick={handleToggleAvailability}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
            user?.agentProfile?.isAvailable
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/80'
          }`}
        >
          <Power className={`w-4 h-4 ${user?.agentProfile?.isAvailable ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>{user?.agentProfile?.isAvailable ? 'Status: Available' : 'Status: Unavailable'}</span>
        </button>
      </div>

      {/* Deliveries List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton count={3} className="h-24" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Active Deliveries"
          description="You currently have no orders assigned to your agent profile."
          icon={Truck}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const validNextStates = LEGAL_NEXT_STATES[order.currentStatus] || [];
            const canUpdate = validNextStates.length > 0;

            return (
              <div key={order.id} className="glass-card p-5 space-y-4 border-slate-800">
                {/* Top Row: Order # & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{order.orderNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {order.paymentType} (${order.totalCharge})
                    </span>
                  </div>
                  <StatusBadge status={order.currentStatus} size="sm" />
                </div>

                {/* Customer Info */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{order.customer.name}</span>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {order.customer.phone}
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold">Pickup</span>
                      <span>{order.pickupAddress} ({order.pickupArea?.name})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[10px] block font-semibold">Drop</span>
                      <span>{order.dropAddress} ({order.dropArea?.name})</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => setTimelineOrder(order)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    View History Timeline
                  </button>

                  {canUpdate ? (
                    <button
                      onClick={() => openStatusModal(order)}
                      className="glass-button-primary text-xs py-2 px-4 flex items-center gap-1.5"
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
          title={`Update Status: ${selectedOrder.orderNumber}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="text-xs text-slate-400">
              Current Status: <strong className="text-slate-200">{selectedOrder.currentStatus}</strong>
            </div>

            {updateError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Select Next Legal Status
              </label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                className="w-full glass-input text-sm bg-slate-950"
              >
                {(LEGAL_NEXT_STATES[selectedOrder.currentStatus] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Status Note / Failure Reason {nextStatus === 'FAILED' && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  nextStatus === 'FAILED'
                    ? 'Enter failure reason (e.g. Door locked / Customer unreachable)'
                    : 'Optional note'
                }
                className="w-full glass-input text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="glass-button-secondary text-sm py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="glass-button-primary text-sm py-2 px-5"
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
          title={`Timeline: ${timelineOrder.orderNumber}`}
        >
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            <Timeline history={timelineOrder.statusHistory || []} />
          </div>
        </Modal>
      )}
    </div>
  );
};
