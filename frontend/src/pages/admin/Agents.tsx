import React, { useState, useEffect } from 'react';
import { getAgentsApi, createAgentApi, getZonesApi } from '../../api/admin';
import { AgentProfile, Zone } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { Users, Plus, Phone, Mail, Shield, User } from 'lucide-react';

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263449] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Delivery Agent Management
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">Manage agent field profiles, home hub assignments, and live operational availability</p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsAgentModalOpen(true);
          }}
          className="glass-button-primary text-xs py-2 flex items-center gap-1.5 font-mono"
        >
          <Plus className="w-4 h-4" />
          Create Agent Account
        </button>
      </div>

      {isLoading ? (
        <Skeleton count={4} className="h-32" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const initials = agent.user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase();

            return (
              <div key={agent.id} className="bg-[#111827] border border-[#263449] rounded-md p-5 space-y-4 shadow-xs hover:border-[#374151] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-[#172033] border border-[#263449] flex items-center justify-center font-mono font-bold text-[#F8FAFC] text-sm text-indigo-400">
                      {initials || 'AG'}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F8FAFC] text-sm">{agent.user.name}</h3>
                      <span className="text-xs text-indigo-400 font-mono font-semibold block">
                        Hub: {agent.zone?.name || 'Unassigned Zone'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                      agent.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {agent.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#94A3B8] pt-3 border-t border-[#263449] font-mono">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{agent.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{agent.user.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#263449] flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#94A3B8]">Assigned Orders:</span>
                  <span className="text-indigo-400 font-bold bg-[#172033] px-2 py-0.5 rounded border border-[#263449]">
                    {agent._count?.assignedOrders || 0} active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Agent Modal */}
      <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title="Create Delivery Agent Account">
        <form onSubmit={handleCreateAgent} className="space-y-4 font-mono">
          {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Full Agent Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Robert Smith" className="w-full glass-input text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@delivery.com" className="w-full glass-input text-xs font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Account Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full glass-input text-xs" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Contact Phone Number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" className="w-full glass-input text-xs font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Assigned Home Zone Hub</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full glass-input text-xs bg-[#172033] font-mono">
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
            <button type="button" onClick={() => setIsAgentModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Create Agent Profile'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

