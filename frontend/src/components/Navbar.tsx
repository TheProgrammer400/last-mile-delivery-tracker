import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateSelfAvailabilityApi } from '../api/orders';
import {
  Truck,
  Package,
  PlusCircle,
  Shield,
  Layers,
  CreditCard,
  Users,
  LogOut,
  Power,
  BarChart3,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isToggling, setIsToggling] = useState(false);

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
    <header className="sticky top-0 z-40 w-full glass-panel rounded-none border-x-0 border-t-0 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">Last-Mile</span>
            <span className="text-indigo-400 font-medium text-xs block -mt-1">Delivery Tracker</span>
          </div>
        </Link>

        {/* Role-based Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'CUSTOMER' && (
            <>
              <Link
                to="/orders"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/orders')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Package className="w-4 h-4" />
                My Orders
              </Link>
              <Link
                to="/orders/new"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/orders/new')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/agent/orders')
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              My Deliveries
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/orders"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin/orders')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Package className="w-4 h-4" />
                All Orders
              </Link>
              <Link
                to="/admin/zones"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin/zones')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                Zones & Areas
              </Link>
              <Link
                to="/admin/rate-cards"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin/rate-cards')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Rate Cards
              </Link>
              <Link
                to="/admin/agents"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin/agents')
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Users className="w-4 h-4" />
                Agents
              </Link>
            </>
          )}
        </nav>

        {/* User Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Agent Availability Toggle */}
          {user?.role === 'AGENT' && user.agentProfile && (
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                user.agentProfile.isAvailable
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/60'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${user.agentProfile.isAvailable ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{user.agentProfile.isAvailable ? 'Available' : 'Unavailable'}</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <span className="block text-sm font-medium text-slate-200">{user.name}</span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-indigo-400 border border-indigo-500/20">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="glass-button-primary text-sm py-2">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
