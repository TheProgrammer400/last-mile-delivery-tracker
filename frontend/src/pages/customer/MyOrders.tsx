import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrdersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Package, PlusCircle, Search, ChevronRight, ArrowRight } from 'lucide-react';

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

  const getProgressStep = (status: OrderStatus) => {
    if (status === 'DELIVERED') return 3;
    if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 2;
    return 1; // CREATED, ASSIGNED
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F8FAFC]">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263449] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            My Deliveries & Shipments
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">Track live progress and manage your last-mile delivery orders</p>
        </div>
        <Link to="/orders/new" className="glass-button-primary flex items-center justify-center gap-2 font-mono">
          <PlusCircle className="w-4 h-4" />
          Create New Order
        </Link>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-[#111827] border border-[#263449] rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search order # or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input !pl-10 text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto font-mono">
          <span className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs py-2 bg-[#172033]"
          >
            <option value="">All States</option>
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
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton count={4} className="h-28" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No Delivery Orders Found"
          description={
            statusFilter || searchTerm
              ? 'No orders match your search parameters or status filter.'
              : 'You have not placed any shipment delivery orders yet.'
          }
          action={
            <Link to="/orders/new" className="glass-button-primary inline-flex items-center gap-2 font-mono">
              <PlusCircle className="w-4 h-4" />
              Place First Order
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const stepNum = getProgressStep(order.currentStatus);

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-[#111827] border border-[#263449] rounded-md p-5 block hover:border-indigo-500/50 hover:bg-[#172033]/60 transition-all shadow-xs group space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info Column */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-indigo-400 text-base group-hover:underline">
                        #{order.orderNumber}
                      </span>
                      <StatusBadge status={order.currentStatus} size="sm" />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#172033] border border-[#263449] text-[#CBD5E1] font-mono font-semibold uppercase">
                        {order.orderType} • {order.paymentType}
                      </span>
                    </div>

                    <div className="text-xs text-[#CBD5E1] flex items-center gap-2 font-mono">
                      <span>
                        <strong className="text-[#F8FAFC]">Pickup:</strong> {order.pickupArea?.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        <strong className="text-[#F8FAFC]">Drop:</strong> {order.dropArea?.name}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator Step */}
                  <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stepNum >= 1 ? 'bg-indigo-400' : 'bg-[#263449]'}`} />
                      <span className={stepNum >= 1 ? 'text-[#F8FAFC] font-bold' : 'text-[#94A3B8]'}>Pickup</span>
                    </div>
                    <span className={`w-8 h-0.5 ${stepNum >= 2 ? 'bg-indigo-400' : 'bg-[#263449]'}`} />
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stepNum >= 2 ? 'bg-indigo-400' : 'bg-[#263449]'}`} />
                      <span className={stepNum >= 2 ? 'text-[#F8FAFC] font-bold' : 'text-[#94A3B8]'}>Transit</span>
                    </div>
                    <span className={`w-8 h-0.5 ${stepNum >= 3 ? 'bg-emerald-400' : 'bg-[#263449]'}`} />
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stepNum >= 3 ? 'bg-emerald-400' : 'bg-[#263449]'}`} />
                      <span className={stepNum >= 3 ? 'text-emerald-400 font-bold' : 'text-[#94A3B8]'}>Delivered</span>
                    </div>
                  </div>

                  {/* Amount & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#263449]">
                    <div className="text-right">
                      <span className="text-[10px] text-[#94A3B8] uppercase font-mono font-bold block">Total Billed</span>
                      <span className="text-base font-mono font-bold text-[#F8FAFC]">₹{Number(order.totalCharge).toFixed(2)}</span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

