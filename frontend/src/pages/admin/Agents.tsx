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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" />
            Delivery Agents Fleet
          </h1>
          <p className="text-sm text-slate-400">Manage agent accounts, zone assignments, and live availability</p>
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
            <div key={agent.id} className="glass-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-100">{agent.user.name}</h3>
                  <span className="text-xs text-indigo-400 font-medium block">
                    Zone: {agent.zone?.name || 'Unassigned'}
                  </span>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    agent.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {agent.isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{agent.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{agent.user.phone}</span>
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[11px] text-slate-500">
                  Assigned Orders: <strong className="text-slate-200">{agent._count?.assignedOrders || 0}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Agent Modal */}
      <Modal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} title="Create Delivery Agent Account">
        <form onSubmit={handleCreateAgent} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent Name" className="w-full glass-input text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@delivery.com" className="w-full glass-input text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full glass-input text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" className="w-full glass-input text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Assigned Home Zone</label>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-full glass-input text-sm bg-slate-950">
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsAgentModalOpen(false)} className="glass-button-secondary text-sm py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-sm py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Create Agent Account'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
