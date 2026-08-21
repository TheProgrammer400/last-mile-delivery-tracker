import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersApi, assignAgentApi, updateOrderStatusApi } from '../../api/orders';
import { getZonesApi, getAgentsApi } from '../../api/admin';
import { Order, OrderStatus, Zone, AgentProfile } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import {
  Package,
  Search,
  Zap,
  ShieldAlert,
  RotateCcw,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const AllOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Assign Modal
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Status Override Modal
  const [overrideOrder, setOverrideOrder] = useState<Order | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>('DELIVERED');
  const [overrideNote, setOverrideNote] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, zonesData, agentsData] = await Promise.all([
        getOrdersApi({
          status: statusFilter ? (statusFilter as OrderStatus) : undefined,
          zoneId: zoneFilter || undefined,
          agentId: agentFilter || undefined,
          pageSize: 100,
        }),
        getZonesApi(),
        getAgentsApi(),
      ]);
      setOrders(ordersRes.data);
      setZones(zonesData);
      setAgents(agentsData);
    } catch (err) {
      console.error('Failed to load admin orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter, zoneFilter, agentFilter]);

  const handleManualAssign = async () => {
    if (!assigningOrder || !selectedAgentId) return;
    setAssignError(null);
    setIsAssigning(true);
    try {
      await assignAgentApi(assigningOrder.id, { agentId: selectedAgentId });
      setAssigningOrder(null);
      await fetchInitialData();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign agent');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    try {
      await assignAgentApi(orderId, { auto: true });
      await fetchInitialData();
    } catch (err: any) {
      alert(`Auto-assignment failed: ${err.message}`);
    }
  };

  const handleStatusOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideOrder) return;
    setOverrideError(null);
    setIsOverriding(true);
    try {
      await updateOrderStatusApi(overrideOrder.id, overrideStatus, overrideNote || 'Admin override');
      setOverrideOrder(null);
      await fetchInitialData();
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to override status');
    } finally {
      setIsOverriding(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setZoneFilter('');
    setAgentFilter('');
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263449] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            Master Orders Workspace
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">Filter, inspect routes, assign delivery agents, and trigger status overrides</p>
        </div>

        <div className="text-xs font-mono text-[#CBD5E1] bg-[#172033] border border-[#263449] px-3 py-1.5 rounded flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Showing {filteredOrders.length} of {orders.length} total shipments</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#111827] border border-[#263449] rounded-md p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Operational Control Bar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-input !pl-10 text-xs font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs font-mono bg-[#172033]"
          >
            <option value="">Status: All States</option>
            <option value="CREATED">CREATED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="PICKED_UP">PICKED_UP</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="FAILED">FAILED</option>
            <option value="RESCHEDULED">RESCHEDULED</option>
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="glass-input text-xs font-mono bg-[#172033]"
          >
            <option value="">Zone: All Hubs</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="glass-input text-xs font-mono bg-[#172033]"
          >
            <option value="">Agent: All Fleet</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.user.name} ({ag.zone?.name})
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            className="bg-[#1E293B] hover:bg-[#263449] text-[#F8FAFC] border border-[#263449] px-3 py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8]" />
            Reset Controls
          </button>
        </div>
      </div>

      {/* Master Orders Table */}
      {isLoading ? (
        <Skeleton count={6} className="h-16" />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Matching Operational Shipments"
          description="All active filters returned 0 shipments. Adjust search parameters or reset controls."
        />
      ) : (
        <div className="bg-[#111827] border border-[#263449] rounded-md overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#CBD5E1]">
              <thead className="bg-[#172033] text-[#94A3B8] uppercase tracking-wider font-mono font-semibold border-b border-[#263449]">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer Details</th>
                  <th className="p-3.5">Route Directional</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Agent</th>
                  <th className="p-3.5">Charge</th>
                  <th className="p-3.5 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#172033]/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-400">
                      <Link to={`/orders/${order.id}`} className="hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-[#F8FAFC] block">{order.customer.name}</span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">{order.customer.email}</span>
                    </td>

                    <td className="p-3.5 font-mono text-xs text-[#CBD5E1]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#F8FAFC] font-semibold">{order.pickupArea?.name}</span>
                        <span className="text-indigo-400">→</span>
                        <span className="text-[#F8FAFC] font-semibold">{order.dropArea?.name}</span>
                      </div>
                      <span className="text-[10px] text-[#94A3B8]">{order.orderType} • {order.paymentType}</span>
                    </td>

                    <td className="p-3.5">
                      <StatusBadge status={order.currentStatus} size="sm" />
                    </td>

                    <td className="p-3.5 font-mono text-xs">
                      {order.assignedAgent ? (
                        <span className="text-[#F8FAFC] font-semibold block">{order.assignedAgent.user.name}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#94A3B8] italic text-[11px]">Unassigned</span>
                          <button
                            onClick={() => handleAutoAssign(order.id)}
                            className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 font-semibold text-[10px] flex items-center gap-1 transition-all"
                            title="Trigger Nearest Agent Auto-Assignment"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            Auto
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-[#F8FAFC]">
                      ₹{Number(order.totalCharge).toFixed(2)}
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setAssigningOrder(order);
                          setSelectedAgentId(order.assignedAgentId || '');
                        }}
                        className="px-2.5 py-1 rounded bg-[#172033] hover:bg-[#1E293B] text-indigo-400 border border-[#263449] hover:border-indigo-500/50 text-[11px] font-mono font-bold transition-all shadow-xs"
                      >
                        Assign Agent
                      </button>

                      <button
                        onClick={() => {
                          setOverrideOrder(order);
                          setOverrideStatus(order.currentStatus);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-mono font-bold transition-all shadow-xs"
                      >
                        Override State
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Assign Modal */}
      {assigningOrder && (
        <Modal
          isOpen={!!assigningOrder}
          onClose={() => setAssigningOrder(null)}
          title={`Dispatch Agent: #${assigningOrder.orderNumber}`}
        >
          <div className="space-y-4 font-mono">
            {assignError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {assignError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Select Fleet Delivery Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full glass-input text-xs bg-[#172033] font-mono"
              >
                <option value="">-- Select Available Agent --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.user.name} ({ag.zone?.name}) - {ag.isAvailable ? 'AVAILABLE' : 'BUSY'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#263449]">
              <button
                onClick={() => {
                  handleAutoAssign(assigningOrder.id);
                  setAssigningOrder(null);
                }}
                className="px-3 py-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Trigger Auto-Assign
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="glass-button-secondary text-xs py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  disabled={isAssigning || !selectedAgentId}
                  className="glass-button-primary text-xs py-1.5 px-4"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Agent'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Status Override Modal */}
      {overrideOrder && (
        <Modal
          isOpen={!!overrideOrder}
          onClose={() => setOverrideOrder(null)}
          title={`Admin Status Override: #${overrideOrder.orderNumber}`}
        >
          <form onSubmit={handleStatusOverrideSubmit} className="space-y-4 font-mono">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Warning:</strong> Admin status override bypasses state machine safeguards. Action is recorded in the immutable tracking ledger.
              </span>
            </div>

            {overrideError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {overrideError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                New Target Operational State
              </label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                className="w-full glass-input text-xs bg-[#172033] font-mono"
              >
                <option value="CREATED">CREATED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="PICKED_UP">PICKED_UP</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="FAILED">FAILED</option>
                <option value="RESCHEDULED">RESCHEDULED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Reason for Override
              </label>
              <textarea
                rows={2}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Reason for overriding state"
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
              <button
                type="button"
                onClick={() => setOverrideOrder(null)}
                className="glass-button-secondary text-xs py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isOverriding}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 rounded text-xs transition-all shadow-xs"
              >
                {isOverriding ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

