import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Truck, Shield, User, AlertCircle, ArrowRight, Zap } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0B1120] text-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6 bg-[#111827] border border-[#263449] rounded-md p-8 shadow-xs">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-lg mb-3 shadow-xs">
            LM
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Last Mile Delivery Tracker</h2>
          <p className="mt-1 text-xs text-[#94A3B8] font-mono">Sign in to your portal or select a quick demo role</p>
        </div>

        {/* Demo Quick Logins */}
        <div className="bg-[#172033] p-4 rounded-md border border-[#263449] space-y-2.5 font-mono">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick Demo Role Logins
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@delivery.com', 'admin123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#111827] border border-[#263449] hover:border-rose-500/50 text-xs font-bold text-[#F8FAFC] transition-all shadow-xs group"
            >
              <Shield className="w-4 h-4 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@example.com', 'customer123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#111827] border border-[#263449] hover:border-sky-500/50 text-xs font-bold text-[#F8FAFC] transition-all shadow-xs group"
            >
              <User className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('agent1@delivery.com', 'agent123')}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#111827] border border-[#263449] hover:border-emerald-500/50 text-xs font-bold text-[#F8FAFC] transition-all shadow-xs group"
            >
              <Truck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              Agent
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4 font-mono" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full glass-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-2.5 font-mono text-xs"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#94A3B8] pt-3 border-t border-[#263449] font-mono">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-bold">
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};

