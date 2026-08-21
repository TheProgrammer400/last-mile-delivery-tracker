import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Shield, User, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F9FB]">
      <div className="max-w-md w-full space-y-6 bg-white border border-[#E2E8F0] rounded-md p-8 shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded bg-[#0F172A] flex items-center justify-center text-white font-mono font-bold mb-3 shadow-xs">
            PL
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Precision Logistics OS</h2>
          <p className="mt-1 text-xs text-[#475569]">Sign in to your account or select a quick demo role</p>
        </div>

        {/* Demo Quick Logins */}
        <div className="bg-[#F1F5F9] p-3.5 rounded border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] block">
            ⚡ Quick Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@delivery.com', 'admin123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-white border border-[#CBD5E1] hover:border-[#0F172A] text-xs font-bold text-[#0F172A] transition-all shadow-xs"
            >
              <Shield className="w-4 h-4 text-[#BA1A1A] mb-1" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@example.com', 'customer123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-white border border-[#CBD5E1] hover:border-[#0F172A] text-xs font-bold text-[#0F172A] transition-all shadow-xs"
            >
              <User className="w-4 h-4 text-indigo-600 mb-1" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('agent1@delivery.com', 'agent123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-white border border-[#CBD5E1] hover:border-[#0F172A] text-xs font-bold text-[#0F172A] transition-all shadow-xs"
            >
              <Truck className="w-4 h-4 text-emerald-600 mb-1" />
              Agent
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded text-[#BA1A1A] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
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
            <label className="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">
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
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-2.5"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-[#E2E8F0]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0F172A] hover:underline font-bold">
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};
