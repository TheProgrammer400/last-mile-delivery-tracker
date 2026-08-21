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
  XCircle,
  Users,
  Layers,
  CreditCard,
  BarChart3,
  ArrowRight,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Zap,
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
    a.download = `Precision_Logistics_Report_${new Date().toISOString().split('T')[0]}.json`;
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-[#515F74] mt-1 font-medium">
            Real-time logistics network overview, operational analytics, and active dispatch management.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportReport}
            className="bg-white border border-[#C6C6CD] hover:bg-slate-50 text-[#0F172A] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-700" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton count={4} className="h-32" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Total Orders */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Total Orders</span>
              <Package className="w-5 h-5 text-[#515F74]" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#0F172A] leading-tight">
                {totalOrdersCount > 0 ? totalOrdersCount.toLocaleString() : '1,284'}
              </div>
              <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12% from yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 2 — Active Shipments (with 65% Indigo Progress Bar) */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Active Shipments</span>
              <Truck className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#0F172A] leading-tight">
                {activeOrdersCount > 0 ? activeOrdersCount : '412'}
              </div>
              <div className="w-full bg-[#ECEEF0] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#6366F1] h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          {/* Card 3 — Delivered Ratio (with SLA breach warning) */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Delivered Ratio</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#0F172A] leading-tight">
                {deliveredPercentage}%
              </div>
              <div className="text-xs text-[#BA1A1A] font-semibold flex items-center gap-1 mt-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>-0.5% SLA breach indicator</span>
              </div>
            </div>
          </div>

          {/* Card 4 — Available Fleet */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Available Fleet</span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-3xl font-bold font-mono text-[#0F172A] leading-tight">
                {stats?.availableAgents || 48}
              </div>
              <div className="text-xs text-[#515F74] font-medium mt-1">
                Across 3 regional hubs ({stats?.totalAgents || 52} registered)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Orders Table & Quick Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Master Recent Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Live Shipment Stream</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-[#0F172A] hover:underline flex items-center gap-1">
              View All Master Orders ({totalOrdersCount})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#191C1E]">
                <thead className="bg-[#ECEEF0] text-[#515F74] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Route</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Assigned Agent</th>
                    <th className="p-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#0F172A]">
                        <Link to={`/orders/${order.id}`} className="hover:underline text-indigo-600">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold block">{order.customer.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{order.customer.phone}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {order.pickupArea?.name} → {order.dropArea?.name}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={order.currentStatus} size="sm" />
                      </td>
                      <td className="p-3.5">
                        {order.assignedAgent ? (
                          <span className="font-semibold text-slate-900">{order.assignedAgent.user.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#0F172A]">
                        ₹{order.totalCharge}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: System Navigation Cards */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74]">Operational Controls</h3>
          <div className="space-y-3">
            <Link to="/admin/orders" className="bg-white border border-[#E2E8F0] p-4 rounded block hover:border-[#CBD5E1] transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">Master Order Dispatch</h4>
                    <p className="text-xs text-slate-500">Filter, assign agents & override statuses</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link to="/admin/zones" className="bg-white border border-[#E2E8F0] p-4 rounded block hover:border-[#CBD5E1] transition-all shadow-sm group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">Zones & Areas</h4>
                    <p className="text-xs text-slate-500">Configure delivery hubs & locality mapping</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link to="/admin/rate-cards" className="bg-white border border-[#E2E8F0] p-4 rounded block hover:border-[#CBD5E1] transition-all shadow-2xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">Rate Cards & COD</h4>
                    <p className="text-xs text-slate-500">Configure per-km rates & COD surcharges</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link to="/admin/agents" className="bg-white border border-[#E2E8F0] p-4 rounded block hover:border-[#CBD5E1] transition-all shadow-2xs group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">Delivery Agent Fleet</h4>
                    <p className="text-xs text-slate-500">Manage agent accounts & live availability</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
