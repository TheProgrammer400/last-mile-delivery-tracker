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
    <header className="sticky top-0 z-50 w-full bg-[#F7F9FB] border-b border-[#E2E8F0] text-[#0F172A] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & PL Logo Box */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[#0F172A] flex items-center justify-center text-white font-bold font-mono text-sm shadow-xs group-hover:bg-black transition-colors">
              LM
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#0F172A] tracking-tight leading-none">
                Last Mile Delivery <span className="text-indigo-600 font-semibold">Service</span>
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
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  My Orders
                </Link>
                <Link
                  to="/orders/new"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/orders/new')
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  New Order
                </Link>
              </>
            )}

            {user?.role === 'AGENT' && (
              <Link
                to="/agent/orders"
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  isActive('/agent/orders')
                    ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
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
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  to="/admin/orders"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/orders')
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Orders
                </Link>
                <Link
                  to="/admin/zones"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/zones')
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Zones & Areas
                </Link>
                <Link
                  to="/admin/rate-cards"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/rate-cards')
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Rate Cards
                </Link>
                <Link
                  to="/admin/agents"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isActive('/admin/agents')
                      ? 'bg-[#ECEEF0] text-[#0F172A] border border-[#CBD5E1]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Agents
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Global Search & User Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-60">
            {/* <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search OS..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded px-3 py-1.5 !pl-9 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F172A] transition-all font-mono"
            /> */}
          </div>

          {/* Agent Availability Switch */}
          {user?.role === 'AGENT' && user.agentProfile && (
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border transition-all ${
                user.agentProfile.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${user.agentProfile.isAvailable ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>{user.agentProfile.isAvailable ? 'Online' : 'Offline'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-bold text-[#0F172A]">{user.name}</span>
                <span className="text-[10px] text-[#475569] font-mono">{user.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-[#475569] hover:text-[#BA1A1A] hover:bg-[#F1F5F9] rounded transition-all"
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
