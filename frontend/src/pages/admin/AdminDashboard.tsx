import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStatsApi } from '../../api/admin';
import { DashboardStats } from '../../types';
import { Skeleton } from '../../components/Skeleton';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStatsApi();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-indigo-400" />
          Admin Control Center
        </h1>
        <p className="text-sm text-slate-400">
          Overview of delivery network operations, zone load, and agent availability
        </p>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton count={4} className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="glass-card p-5 space-y-2 border-indigo-500/20">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
              <Package className="w-5 h-5" />
            </div>
            <span className="text-3xl font-bold text-slate-100 block">{stats?.totalOrders || 0}</span>
            <span className="text-xs text-slate-400">System wide orders</span>
          </div>

          {/* Metric 2 */}
          <div className="glass-card p-5 space-y-2 border-sky-500/20">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Deliveries</span>
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-3xl font-bold text-slate-100 block">{stats?.activeOrders || 0}</span>
            <span className="text-xs text-slate-400">Assigned, In-Transit, Out</span>
          </div>

          {/* Metric 3 */}
          <div className="glass-card p-5 space-y-2 border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Delivered</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-3xl font-bold text-slate-100 block">{stats?.deliveredOrders || 0}</span>
            <span className="text-xs text-slate-400">Completed shipments</span>
          </div>

          {/* Metric 4 */}
          <div className="glass-card p-5 space-y-2 border-rose-500/20">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Failed Attempts</span>
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-3xl font-bold text-slate-100 block">{stats?.failedOrders || 0}</span>
            <span className="text-xs text-slate-400">Pending reschedule</span>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">System Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/orders" className="glass-card p-5 block hover:scale-[1.01] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-100 flex items-center justify-between">
              <span>All Orders</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Filter, assign agents, override statuses</p>
          </Link>

          <Link to="/admin/zones" className="glass-card p-5 block hover:scale-[1.01] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-100 flex items-center justify-between">
              <span>Zones & Areas</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Manage delivery zones & area mapping</p>
          </Link>

          <Link to="/admin/rate-cards" className="glass-card p-5 block hover:scale-[1.01] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-100 flex items-center justify-between">
              <span>Rate Cards & COD</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Configure B2B/B2C rates & surcharges</p>
          </Link>

          <Link to="/admin/agents" className="glass-card p-5 block hover:scale-[1.01] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-100 flex items-center justify-between">
              <span>Delivery Agents</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 mt-1">Manage agent fleet & availability ({stats?.availableAgents || 0}/{stats?.totalAgents || 0} online)</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
