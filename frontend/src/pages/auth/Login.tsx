import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Shield, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'AGENT') {
        navigate('/agent/orders');
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(demoEmail, demoPass);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'AGENT') {
        navigate('/agent/orders');
      } else {
        navigate('/orders');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <Truck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Sign in to Delivery Tracker</h2>
          <p className="mt-1 text-sm text-slate-400">Select a demo role or enter your credentials</p>
        </div>

        {/* Demo Quick Logins */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            ⚡ Quick Demo Logins
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@delivery.com', 'admin123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs font-medium text-slate-200 transition-all group"
            >
              <Shield className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@example.com', 'customer123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 text-xs font-medium text-slate-200 transition-all group"
            >
              <User className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('agent1@delivery.com', 'agent123')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 text-xs font-medium text-slate-200 transition-all group"
            >
              <Truck className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              Agent
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full glass-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-3"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};
