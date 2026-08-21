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
  Shield,
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
    <header className="sticky top-0 z-50 w-full bg-[#111827] border-b border-[#263449] text-[#F8FAFC] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & PL Mark */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[#172033] border border-[#263449] flex items-center justify-center text-indigo-400 font-bold font-mono text-xs shadow-xs group-hover:border-indigo-500/50 group-hover:bg-[#1E293B] transition-all">
              PL
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base text-[#F8FAFC] tracking-tight leading-none">
                Last Mile Delivery <span className="text-indigo-400 font-semibold">Tracker</span>
              </span>
              {user?.role === 'ADMIN' && (
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Admin
                </span>
              )}
              {user?.role === 'CUSTOMER' && (
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Customer
                </span>
              )}
              {user?.role === 'AGENT' && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                  Agent Fleet
                </span>
              )}
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {user?.role === 'CUSTOMER' && (
              <>
                <Link
                  to="/orders"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/orders')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  My Orders
                </Link>
                <Link
                  to="/orders/new"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/orders/new')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  New Order
                </Link>
              </>
            )}

            {user?.role === 'AGENT' && (
              <Link
                to="/agent/orders"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                  isActive('/agent/orders')
                    ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                Mobile Dispatch
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/orders"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/orders')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  Orders
                </Link>
                <Link
                  to="/admin/zones"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/zones')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Zones & Areas
                </Link>
                <Link
                  to="/admin/rate-cards"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/rate-cards')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  Rate Cards
                </Link>
                <Link
                  to="/admin/agents"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/agents')
                      ? 'bg-[#172033] text-[#F8FAFC] border border-[#263449] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Agents
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search orders, fleet, tracking IDs..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-[#172033] border border-[#263449] rounded px-3 py-1.5 !pl-9 text-xs text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Agent Availability Switch */}
          {user?.role === 'AGENT' && user.agentProfile && (
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider border transition-all ${
                user.agentProfile.isAvailable
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-[#1E293B] text-slate-400 border-[#263449] hover:bg-[#263449]'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${user.agentProfile.isAvailable ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{user.agentProfile.isAvailable ? 'Online' : 'Offline'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[#263449]">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-bold text-[#F8FAFC]">{user.name}</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">{user.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-[#94A3B8] hover:text-rose-400 hover:bg-[#1E293B] rounded transition-all"
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

