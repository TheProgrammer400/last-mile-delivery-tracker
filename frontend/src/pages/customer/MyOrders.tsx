import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Package, PlusCircle, Search, ChevronRight } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const res = await getOrdersApi({
          status: statusFilter ? (statusFilter as OrderStatus) : undefined,
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.dropAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#0F172A]" />
            My Orders
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">Track and manage your last-mile delivery shipments</p>
        </div>
        <Link to="/orders/new" className="glass-button-primary flex items-center justify-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Create New Order
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#E2E8F0] rounded p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by order # or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input !pl-10 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-[#475569] uppercase font-bold tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-white font-mono"
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
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton count={4} className="h-20" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description={
            statusFilter || searchTerm
              ? 'No orders match your filter criteria.'
              : "You haven't placed any delivery orders yet."
          }
          action={
            <Link to="/orders/new" className="glass-button-primary inline-flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Place First Order
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bg-white border border-[#E2E8F0] rounded p-5 block hover:border-[#CBD5E1] transition-all shadow-xs group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info Column */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-[#0F172A] text-sm group-hover:text-indigo-600 transition-colors">
                      #{order.orderNumber}
                    </span>
                    <StatusBadge status={order.currentStatus} size="sm" />
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] font-mono font-semibold">
                      {order.orderType} • {order.paymentType}
                    </span>
                  </div>

                  <div className="text-xs text-[#475569] flex items-center gap-2">
                    <span>
                      <strong className="text-[#0F172A]">Pickup:</strong> {order.pickupArea?.name}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span>
                      <strong className="text-[#0F172A]">Drop:</strong> {order.dropArea?.name}
                    </span>
                  </div>
                </div>

                {/* Amount & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                  <div className="text-right">
                    <span className="text-[10px] text-[#475569] uppercase font-bold tracking-wider block">Total Charge</span>
                    <span className="text-base font-mono font-bold text-[#0F172A]">₹{order.totalCharge}</span>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
