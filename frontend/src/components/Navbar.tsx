import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateSelfAvailabilityApi } from '../api/orders';
import {
  Package,
  PlusCircle,
  Layers,
  CreditCard,
  Users,
  LogOut,
  Power,
  BarChart3,
  Search,
  Truck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isToggling, setIsToggling] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleAvailability = async () => {
    if (!user || !user.agentProfile || isToggling) return;
    setIsToggling(true);
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
    } finally {
      setIsToggling(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F172A] border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & PL Logo Box */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white font-bold font-mono text-sm border border-slate-700 shadow-xs group-hover:bg-indigo-600 transition-colors">
              PL
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                Precision Logistics <span className="text-indigo-400 font-medium">OS</span>
              </span>
              {user?.role === 'ADMIN' && (
                <span className="bg-[#BA1A1A] text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Admin
                </span>
              )}
              {user?.role === 'CUSTOMER' && (
                <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Customer
                </span>
              )}
              {user?.role === 'AGENT' && (
                <span className="bg-emerald-600 text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Agent Fleet
                </span>
              )}
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {user?.role === 'CUSTOMER' && (
              <>
                <Link
                  to="/orders"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/orders')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </Link>
                <Link
                  to="/orders/new"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/orders/new')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Order Wizard
                </Link>
              </>
            )}

            {user?.role === 'AGENT' && (
              <Link
                to="/agent/orders"
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  isActive('/agent/orders')
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                Mobile Dispatch
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/orders"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/orders')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Master Orders
                </Link>
                <Link
                  to="/admin/zones"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/zones')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Zones & Areas
                </Link>
                <Link
                  to="/admin/rate-cards"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/rate-cards')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Rate Cards
                </Link>
                <Link
                  to="/admin/agents"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/agents')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Fleet Agents
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Global Search & User Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search Bar */}
          <div className="relative hidden lg:block w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search OS..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 !pl-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all font-mono"
            />
          </div>

          {/* Agent Availability Switch */}
          {user?.role === 'AGENT' && user.agentProfile && (
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border transition-all ${
                user.agentProfile.isAvailable
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${user.agentProfile.isAvailable ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{user.agentProfile.isAvailable ? 'Online' : 'Offline'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-semibold text-white">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
