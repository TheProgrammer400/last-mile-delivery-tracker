import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { User, AlertCircle, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerApi({ name, email, password, phone });
      await login(email, password);
      navigate('/orders');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0B1120] text-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6 bg-[#111827] border border-[#263449] rounded-md p-8 shadow-xs font-mono">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg mb-3 shadow-xs">
            LM
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">Create Customer Account</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">Register to place and track last-mile delivery shipments</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
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
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-2.5 mt-2 text-xs"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#94A3B8] pt-3 border-t border-[#263449]">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-bold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

