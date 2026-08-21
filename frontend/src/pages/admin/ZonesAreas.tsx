import React, { useState, useEffect } from 'react';
import { getZonesApi, createZoneApi, getAreasApi, createAreaApi, updateAreaZoneApi } from '../../api/admin';
import { Zone, Area } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { Layers, MapPin, Plus, Edit2, ArrowRight } from 'lucide-react';

export const ZonesAreas: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Zone Modal
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');

  // New Area Modal
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');

  // Reassign Modal
  const [reassignArea, setReassignArea] = useState<Area | null>(null);
  const [newZoneId, setNewZoneId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [z, a] = await Promise.all([getZonesApi(), getAreasApi()]);
      setZones(z);
      setAreas(a);
      if (z.length > 0) {
        setSelectedZoneId(z[0].id);
        setNewZoneId(z[0].id);
      }
    } catch (err) {
      console.error('Failed to load zones and areas', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createZoneApi(zoneName.trim());
      setZoneName('');
      setIsZoneModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim() || !selectedZoneId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createAreaApi(areaName.trim(), selectedZoneId);
      setAreaName('');
      setIsAreaModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignArea || !newZoneId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await updateAreaZoneApi(reassignArea.id, newZoneId);
      setReassignArea(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign area zone');
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
            <Layers className="w-6 h-6 text-indigo-400" />
            Zones & Area Mapping Workspace
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">Configure regional delivery hubs and map local service coverage areas</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setError(null);
              setIsZoneModalOpen(true);
            }}
            className="glass-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            Add Delivery Zone
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsAreaModalOpen(true);
            }}
            className="glass-button-primary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Coverage Area
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={3} className="h-32" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zones Overview */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-3 flex items-center justify-between font-mono">
              <span>Configured Regional Zones ({zones.length})</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </h3>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="bg-[#172033] border border-[#263449] p-4 rounded-md flex items-center justify-between hover:border-[#374151] transition-all shadow-xs">
                  <div>
                    <h4 className="font-bold text-[#F8FAFC] text-sm">{zone.name}</h4>
                    <span className="text-xs text-[#94A3B8] font-mono">
                      {zone._count?.areas || 0} Locality Areas • {zone._count?.agents || 0} Assigned Fleet Agents
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Hub
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area to Zone Mappings */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-3 flex items-center justify-between font-mono">
              <span>Mapped Locality Areas ({areas.length})</span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {areas.map((area) => (
                <div key={area.id} className="bg-[#172033] border border-[#263449] p-3.5 rounded-md flex items-center justify-between text-xs hover:border-[#374151] transition-all shadow-xs">
                  <div className="space-y-1 font-mono">
                    <span className="font-bold text-[#F8FAFC] block text-sm">{area.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                      <span>Locality Area</span>
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                      <span>Zone: <strong className="text-indigo-400 font-bold">{area.zone?.name}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setReassignArea(area);
                      setNewZoneId(area.zoneId);
                      setError(null);
                    }}
                    className="p-2 rounded bg-[#1E293B] hover:bg-[#263449] text-[#F8FAFC] border border-[#263449] hover:border-indigo-500/50 flex items-center gap-1.5 text-[11px] font-mono font-bold shadow-xs transition-all"
                    title="Reassign Zone Mapping"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    Reassign Hub
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      <Modal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} title="Create New Delivery Zone">
        <form onSubmit={handleCreateZone} className="space-y-4 font-mono">
          {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Zone Hub Name</label>
            <input
              type="text"
              required
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g. North East Regional Hub"
              className="w-full glass-input text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
            <button type="button" onClick={() => setIsZoneModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Delivery Zone'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Area Modal */}
      <Modal isOpen={isAreaModalOpen} onClose={() => setIsAreaModalOpen(false)} title="Create Area & Map to Zone">
        <form onSubmit={handleCreateArea} className="space-y-4 font-mono">
          {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Area / Locality Name</label>
            <input
              type="text"
              required
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. Industrial Sector 4"
              className="w-full glass-input text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Assign to Zone Hub</label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full glass-input text-xs bg-[#172033] font-mono"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
            <button type="button" onClick={() => setIsAreaModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Area Mapping'}</button>
          </div>
        </form>
      </Modal>

      {/* Reassign Area Modal */}
      {reassignArea && (
        <Modal isOpen={!!reassignArea} onClose={() => setReassignArea(null)} title={`Reassign Area: ${reassignArea.name}`}>
          <form onSubmit={handleReassignArea} className="space-y-4 font-mono">
            {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">New Target Zone Hub</label>
              <select
                value={newZoneId}
                onChange={(e) => setNewZoneId(e.target.value)}
                className="w-full glass-input text-xs bg-[#172033] font-mono"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
              <button type="button" onClick={() => setReassignArea(null)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Confirm Reassign'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

