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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-sky-400" />
            Zones & Area Mapping
          </h1>
          <p className="text-sm text-slate-400">Configure delivery hubs and assign localities/areas to zones</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsZoneModalOpen(true);
            }}
            className="glass-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
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
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Configured Zones ({zones.length})</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </h3>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-100">{zone.name}</h4>
                    <span className="text-xs text-slate-400">
                      {zone._count?.areas || 0} Areas • {zone._count?.agents || 0} Agents
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    Active Zone
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Area to Zone Mappings */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Mapped Areas ({areas.length})</span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {areas.map((area) => (
                <div key={area.id} className="glass-card p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block text-sm">{area.name}</span>
                    <span className="text-slate-400">Mapped Zone: <strong className="text-indigo-400">{area.zone?.name}</strong></span>
                  </div>

                  <button
                    onClick={() => {
                      setReassignArea(area);
                      setNewZoneId(area.zoneId);
                      setError(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px]"
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
          {error && <div className="p-3 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Zone Name</label>
            <input
              type="text"
              required
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g. Chennai Central"
              className="w-full glass-input text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsZoneModalOpen(false)} className="glass-button-secondary text-sm py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-sm py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Zone'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Area Modal */}
      <Modal isOpen={isAreaModalOpen} onClose={() => setIsAreaModalOpen(false)} title="Create Area & Map to Zone">
        <form onSubmit={handleCreateArea} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Area Name / Locality</label>
            <input
              type="text"
              required
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. T.Nagar"
              className="w-full glass-input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Assign to Zone</label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full glass-input text-sm bg-slate-950"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsAreaModalOpen(false)} className="glass-button-secondary text-sm py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-sm py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save Area'}</button>
          </div>
        </form>
      </Modal>

      {/* Reassign Area Modal */}
      {reassignArea && (
        <Modal isOpen={!!reassignArea} onClose={() => setReassignArea(null)} title={`Reassign Area: ${reassignArea.name}`}>
          <form onSubmit={handleReassignArea} className="space-y-4">
            {error && <div className="p-3 rounded bg-rose-500/10 text-rose-400 text-xs">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">New Mapped Zone</label>
              <select
                value={newZoneId}
                onChange={(e) => setNewZoneId(e.target.value)}
                className="w-full glass-input text-sm bg-slate-950"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setReassignArea(null)} className="glass-button-secondary text-sm py-1.5">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="glass-button-primary text-sm py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Confirm Reassign'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
