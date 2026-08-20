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
  Filter,
  UserCheck,
  Zap,
  ShieldAlert,
  AlertCircle,
  ChevronRight,
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

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-indigo-400" />
          All Orders Management
        </h1>
        <p className="text-sm text-slate-400">View, filter, assign agents, and override statuses</p>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input pl-9 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="glass-input text-xs bg-slate-900"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="RESCHEDULED">Rescheduled</option>
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="glass-input text-xs bg-slate-900"
        >
          <option value="">All Zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="glass-input text-xs bg-slate-900"
        >
          <option value="">All Agents</option>
          {agents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.user.name} ({ag.zone?.name})
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <Skeleton count={5} className="h-16" />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Matching Orders"
          description="No orders match the selected filters or search parameters."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Agent</th>
                  <th className="p-4">Charge</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-100">
                      <Link to={`/orders/${order.id}`} className="hover:text-indigo-400">
                        {order.orderNumber}
                      </Link>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-slate-200 block">{order.customer.name}</span>
                      <span className="text-[10px] text-slate-500">{order.customer.email}</span>
                    </td>

                    <td className="p-4">
                      <span className="block text-slate-200">{order.pickupArea?.name} → {order.dropArea?.name}</span>
                      <span className="text-[10px] text-slate-500">{order.orderType} • {order.paymentType}</span>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={order.currentStatus} size="sm" />
                    </td>

                    <td className="p-4">
                      {order.assignedAgent ? (
                        <span className="text-slate-200 font-medium block">{order.assignedAgent.user.name}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 italic">Unassigned</span>
                          <button
                            onClick={() => handleAutoAssign(order.id)}
                            className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold text-[10px] flex items-center gap-1"
                            title="Auto Assign Nearest Agent"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            Auto
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-200">
                      ₹{order.totalCharge}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setAssigningOrder(order);
                          setSelectedAgentId(order.assignedAgentId || '');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                      >
                        Assign Agent
                      </button>

                      <button
                        onClick={() => {
                          setOverrideOrder(order);
                          setOverrideStatus(order.currentStatus);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium border border-rose-500/30"
                      >
                        Override Status
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
          title={`Assign Agent: ${assigningOrder.orderNumber}`}
        >
          <div className="space-y-4">
            {assignError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {assignError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Select Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full glass-input text-sm bg-slate-950"
              >
                <option value="">-- Select Available Agent --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.user.name} ({ag.zone?.name}) - {ag.isAvailable ? 'Available' : 'Busy'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  handleAutoAssign(assigningOrder.id);
                  setAssigningOrder(null);
                }}
                className="px-3 py-1.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Trigger Auto-Assign
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="glass-button-secondary text-sm py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  disabled={isAssigning || !selectedAgentId}
                  className="glass-button-primary text-sm py-1.5 px-4"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Manual'}
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
          title={`Admin Status Override: ${overrideOrder.orderNumber}`}
        >
          <form onSubmit={handleStatusOverrideSubmit} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Warning:</strong> Admin status override bypasses normal actor-based state machine rules. This action will be logged in the immutable timeline.
              </span>
            </div>

            {overrideError && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {overrideError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                New Target Status
              </label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                className="w-full glass-input text-sm bg-slate-950"
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
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                Reason for Override
              </label>
              <textarea
                rows={2}
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Reason for overriding state"
                className="w-full glass-input text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideOrder(null)}
                className="glass-button-secondary text-sm py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isOverriding}
                className="bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-all"
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
