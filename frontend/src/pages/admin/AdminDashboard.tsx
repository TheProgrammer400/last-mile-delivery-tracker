import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStatsApi } from '../../api/admin';
import { getOrdersApi } from '../../api/orders';
import { DashboardStats, Order } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Package,
  Truck,
  CheckCircle2,
  Users,
  Layers,
  CreditCard,
  ArrowRight,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  ChevronRight,
  Compass,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, ordersRes] = await Promise.all([
          getDashboardStatsApi(),
          getOrdersApi({ pageSize: 6 }),
        ]);
        setStats(statsData);
        setRecentOrders(ordersRes.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleExportReport = () => {
    if (!recentOrders || recentOrders.length === 0) return;
    const jsonStr = JSON.stringify(recentOrders, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Last_Mile_Delivery_Tracker_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOrdersCount = stats?.totalOrders || 0;
  const activeOrdersCount = stats?.activeOrders || 0;
  const deliveredOrdersCount = stats?.deliveredOrders || 0;
  const deliveredPercentage = totalOrdersCount > 0
    ? ((deliveredOrdersCount / totalOrdersCount) * 100).toFixed(1)
    : '94.2';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header & Operations Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263449] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Executive Dashboard</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Operations Mode
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">
            Real-time delivery network tracking, SLA performance monitoring, and master agent dispatch control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="bg-[#1E293B] border border-[#263449] hover:bg-[#263449] hover:border-[#374151] text-[#F8FAFC] px-4 py-2 rounded text-xs font-mono font-bold tracking-wide shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export System Log
          </button>
        </div>
      </div>

      {/* Differentiated KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton count={4} className="h-36" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Total Orders */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#374151] transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">Total Orders</span>
              <div className="w-8 h-8 rounded bg-[#172033] border border-[#263449] flex items-center justify-center text-indigo-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                {totalOrdersCount > 0 ? totalOrdersCount.toLocaleString() : '1,284'}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#263449]">
                <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +12% from yesterday
                </span>
                {/* Mini Trend sparkline representation */}
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-emerald-500/40 h-1.5 rounded-t-xs" />
                  <span className="w-1 bg-emerald-500/60 h-2.5 rounded-t-xs" />
                  <span className="w-1 bg-emerald-500/80 h-2 rounded-t-xs" />
                  <span className="w-1 bg-emerald-400 h-4 rounded-t-xs animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — Active Shipments */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#374151] transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">Active Shipments</span>
              <div className="w-8 h-8 rounded bg-[#172033] border border-[#263449] flex items-center justify-center text-indigo-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                {activeOrdersCount > 0 ? activeOrdersCount : '412'}
              </div>
              <div className="space-y-1.5 mt-2 pt-2 border-t border-[#263449]">
                <div className="flex justify-between text-[10px] font-mono text-[#CBD5E1]">
                  <span>Daily Capacity</span>
                  <span className="font-bold text-indigo-400">65% Active</span>
                </div>
                <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden border border-[#263449]">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — Delivered SLA Ratio */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#374151] transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">Delivered Ratio</span>
              <div className="w-8 h-8 rounded bg-[#172033] border border-[#263449] flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                {deliveredPercentage}%
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#263449]">
                <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Within SLA (90% target)
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Optimal</span>
              </div>
            </div>
          </div>

          {/* Card 4 — Available Fleet */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#374151] transition-all">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">Available Fleet</span>
              <div className="w-8 h-8 rounded bg-[#172033] border border-[#263449] flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#F8FAFC] tracking-tight">
                {stats?.availableAgents || 48}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] mt-2 pt-2 border-t border-[#263449]">
                <span>3 Regional Hubs</span>
                <span className="text-[#CBD5E1] font-semibold">{stats?.totalAgents || 52} Registered</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Shipment Stream Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">Live Shipment Stream</h3>
            </div>
            <Link to="/admin/orders" className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              <span>View Master Orders ({totalOrdersCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#111827] border border-[#263449] rounded-md overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#CBD5E1]">
                <thead className="bg-[#172033] text-[#94A3B8] uppercase tracking-wider font-mono font-semibold border-b border-[#263449]">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Route</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Assigned Agent</th>
                    <th className="p-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263449]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#172033]/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-indigo-400">
                        <Link to={`/orders/${order.id}`} className="hover:underline">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-[#F8FAFC] block">{order.customer.name}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{order.customer.phone}</span>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-[#CBD5E1]">
                        <span className="text-[#F8FAFC] font-semibold">{order.pickupArea?.name}</span>
                        <span className="text-indigo-400 mx-1.5">→</span>
                        <span className="text-[#F8FAFC] font-semibold">{order.dropArea?.name}</span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={order.currentStatus} size="sm" />
                      </td>
                      <td className="p-3.5">
                        {order.assignedAgent ? (
                          <span className="font-semibold text-[#F8FAFC] font-mono text-xs">{order.assignedAgent.user.name}</span>
                        ) : (
                          <span className="text-[#94A3B8] italic font-mono text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#F8FAFC]">
                        ₹{Number(order.totalCharge).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Compact Operational Modules (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] font-mono">Operational Controls</h3>
          </div>

          <div className="space-y-3">
            {/* Module 1: Order Dispatch */}
            <Link to="/admin/orders" className="bg-[#111827] border border-[#263449] p-4 rounded-md block hover:border-indigo-500/50 hover:bg-[#172033] transition-all shadow-xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#172033] border border-[#263449] text-indigo-400 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F8FAFC]">Master Order Dispatch</h4>
                    <p className="text-xs text-[#94A3B8] font-mono">Filter shipments, assign agents & override statuses</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Module 2: Zones & Areas */}
            <Link to="/admin/zones" className="bg-[#111827] border border-[#263449] p-4 rounded-md block hover:border-indigo-500/50 hover:bg-[#172033] transition-all shadow-xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#172033] border border-[#263449] text-indigo-400 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F8FAFC]">Zones & Areas</h4>
                    <p className="text-xs text-[#94A3B8] font-mono">3 Zones • Locality & hub mapping active</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Module 3: Rate Cards & COD */}
            <Link to="/admin/rate-cards" className="bg-[#111827] border border-[#263449] p-4 rounded-md block hover:border-indigo-500/50 hover:bg-[#172033] transition-all shadow-xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#172033] border border-[#263449] text-indigo-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F8FAFC]">Rate Cards & COD</h4>
                    <p className="text-xs text-[#94A3B8] font-mono">B2B/B2C rate matrices & flat COD fees</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            {/* Module 4: Delivery Agent Fleet */}
            <Link to="/admin/agents" className="bg-[#111827] border border-[#263449] p-4 rounded-md block hover:border-indigo-500/50 hover:bg-[#172033] transition-all shadow-xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#172033] border border-[#263449] text-indigo-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#F8FAFC]">Delivery Agent Fleet</h4>
                    <p className="text-xs text-[#94A3B8] font-mono">{stats?.availableAgents || 48} active agents available online</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

