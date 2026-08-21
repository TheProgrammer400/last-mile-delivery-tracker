import React, { useState, useEffect } from 'react';
import { getAgentsApi, createAgentApi, getZonesApi } from '../../api/admin';
import { AgentProfile, Zone } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { Users, Plus, Phone, Mail } from 'lucide-react';

export const Agents: React.FC = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Agent Modal
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [zoneId, setZoneId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [agData, zData] = await Promise.all([getAgentsApi(), getZonesApi()]);
      setAgents(agData);
      setZones(zData);
      if (zData.length > 0) setZoneId(zData[0].id);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createAgentApi({ name, email, password, phone, zoneId });
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setIsAgentModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#0F172A]" />
            Delivery Agents Fleet
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">Manage agent accounts, zone assignments, and live availability</p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsAgentModalOpen(true);
          }}
          className="glass-button-primary text-xs py-2 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create New Agent
        </button>
      </div>

      {isLoading ? (
        <Skeleton count={4} className="h-28" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white border border-[#E2E8F0] rounded p-5 space-y-3 shadow-xs hover:border-[#CBD5E1] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-sm">{agent.user.name}</h3>
                  <span className="text-xs text-indigo-600 font-mono font-semibold block">
                    Zone: {agent.zone?.name || 'Unassigned'}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider border ${
                    agent.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {agent.isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0] font-mono">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.user.phone}</span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[11px] text-slate-500 font-mono">
                  Assigned Orders: <strong className="text-[#0F172A]">{agent._count?.assignedOrders || 0}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Agent Modal */}
      <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title="Create Delivery Agent Account">
        <form onSubmit={handleCreateAgent} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent Name" className="w-full glass-input text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@delivery.com" className="w-full glass-input text-xs font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full glass-input text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" className="w-full glass-input text-xs font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Assigned Home Zone</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full glass-input text-xs bg-white font-mono">
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => setIsAgentModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Create Agent Account'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
