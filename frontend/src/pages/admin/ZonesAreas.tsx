import React, { useState, useEffect } from 'react';
import { getZonesApi, createZoneApi, getAreasApi, createAreaApi, updateAreaZoneApi } from '../../api/admin';
import { Zone, Area } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { Layers, MapPin, Plus, Edit2 } from 'lucide-react';

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#0F172A]" />
            Zones & Area Mapping
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">Configure delivery hubs and assign localities/areas to zones</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsZoneModalOpen(true);
            }}
            className="glass-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#0F172A]" />
            Add Zone
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsAreaModalOpen(true);
            }}
            className="glass-button-primary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Area
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={3} className="h-32" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zones Overview */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <span>Configured Zones ({zones.length})</span>
              <Layers className="w-4 h-4 text-slate-500" />
            </h3>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="bg-white border border-[#E2E8F0] p-4 rounded flex items-center justify-between hover:border-[#CBD5E1] transition-all shadow-xs">
                  <div>
                    <h4 className="font-bold text-[#0F172A] text-sm">{zone.name}</h4>
                    <span className="text-xs text-[#475569] font-mono">
                      {zone._count?.areas || 0} Areas • {zone._count?.agents || 0} Agents
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                    Active Zone
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area to Zone Mappings */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <span>Mapped Areas ({areas.length})</span>
              <MapPin className="w-4 h-4 text-emerald-600" />
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {areas.map((area) => (
                <div key={area.id} className="bg-white border border-[#E2E8F0] p-3.5 rounded flex items-center justify-between text-xs hover:border-[#CBD5E1] transition-all shadow-xs">
                  <div>
                    <span className="font-bold text-[#0F172A] block text-sm">{area.name}</span>
                    <span className="text-[#475569] font-mono text-[11px]">Mapped Zone: <strong className="text-indigo-600">{area.zone?.name}</strong></span>
                  </div>

                  <button
                    onClick={() => {
                      setReassignArea(area);
                      setNewZoneId(area.zoneId);
                      setError(null);
                    }}
                    className="p-1.5 rounded bg-white hover:bg-slate-50 text-[#0F172A] border border-[#CBD5E1] flex items-center gap-1 text-[11px] font-bold shadow-xs"
                    title="Reassign Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Reassign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      <Modal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} title="Create New Delivery Zone">
        <form onSubmit={handleCreateZone} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Zone Name</label>
            <input
              type="text"
              required
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g. Chennai Central"
              className="w-full glass-input text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => setIsZoneModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Zone'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Area Modal */}
      <Modal isOpen={isAreaModalOpen} onClose={() => setIsAreaModalOpen(false)} title="Create Area & Map to Zone">
        <form onSubmit={handleCreateArea} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Area Name / Locality</label>
            <input
              type="text"
              required
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. T.Nagar"
              className="w-full glass-input text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Assign to Zone</label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full glass-input text-xs bg-white font-mono"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => setIsAreaModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Area'}</button>
          </div>
        </form>
      </Modal>

      {/* Reassign Area Modal */}
      {reassignArea && (
        <Modal isOpen={!!reassignArea} onClose={() => setReassignArea(null)} title={`Reassign Area: ${reassignArea.name}`}>
          <form onSubmit={handleReassignArea} className="space-y-4">
            {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Mapped Zone</label>
              <select
                value={newZoneId}
                onChange={(e) => setNewZoneId(e.target.value)}
                className="w-full glass-input text-xs bg-white font-mono"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button type="button" onClick={() => setReassignArea(null)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Confirm Reassign'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
