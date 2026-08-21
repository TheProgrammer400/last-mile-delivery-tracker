import React, { useState, useEffect } from 'react';
import { getRateCardsApi, createRateCardApi, getCodSurchargesApi, createCodSurchargeApi } from '../../api/admin';
import { RateCard, CodSurcharge } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { CreditCard, DollarSign, Plus, Zap } from 'lucide-react';

export const RateCards: React.FC = () => {
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [codSurcharges, setCodSurcharges] = useState<CodSurcharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Rate Card Modal
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [rateType, setRateType] = useState<'INTRA_ZONE' | 'INTER_ZONE'>('INTRA_ZONE');
  const [chargePerKm, setChargePerKm] = useState<number>(8);
  const [ratePerKg, setRatePerKg] = useState<number>(10);
  const [baseFee, setBaseFee] = useState<number>(0);

  // New COD Modal
  const [isCodModalOpen, setIsCodModalOpen] = useState(false);
  const [codOrderType, setCodOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [codAmount, setCodAmount] = useState<number>(30);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rc, cod] = await Promise.all([getRateCardsApi(), getCodSurchargesApi()]);
      setRateCards(rc);
      setCodSurcharges(cod);
    } catch (err) {
      console.error('Failed to load rate cards', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createRateCardApi({ orderType, rateType, chargePerKm, ratePerKg, baseFee });
      setIsRateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create rate card');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCodSurcharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createCodSurchargeApi({ orderType: codOrderType, amount: codAmount });
      setIsCodModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create COD surcharge');
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
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Rate Cards & COD Financial Matrix
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">Configure distance pricing, weight calculation tiers, and cash-on-delivery fees</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => {
              setError(null);
              setIsCodModalOpen(true);
            }}
            className="glass-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Config COD Surcharge
          </button>

          <button
            onClick={() => {
              setError(null);
              setIsRateModalOpen(true);
            }}
            className="glass-button-primary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Rate Card
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={3} className="h-32" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Cards Matrix (2 Cols) */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-3 flex items-center justify-between font-mono">
              <span>Active & Historical Rate Cards ({rateCards.length})</span>
              <CreditCard className="w-4 h-4 text-indigo-400" />
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#CBD5E1]">
                <thead className="bg-[#172033] text-[#94A3B8] uppercase font-mono font-semibold border-b border-[#263449]">
                  <tr>
                    <th className="p-3.5">Order Tier</th>
                    <th className="p-3.5">Route Scope</th>
                    <th className="p-3.5">Distance Rate</th>
                    <th className="p-3.5">Weight Rate</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263449]">
                  {rateCards.map((rc) => (
                    <tr key={rc.id} className={rc.isActive ? 'hover:bg-[#172033]/60 transition-colors' : 'opacity-40'}>
                      <td className="p-3.5 font-mono font-bold text-[#F8FAFC]">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${rc.orderType === 'B2B' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-sky-500/10 text-sky-400 border-sky-500/30'}`}>
                          {rc.orderType}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-xs font-semibold text-[#CBD5E1]">
                        {rc.rateType}
                      </td>
                      <td className="p-3.5 font-mono text-indigo-400 font-bold text-sm">
                        ₹{Number(rc.chargePerKm || 8).toFixed(2)}/km
                      </td>
                      <td className="p-3.5 font-mono text-[#F8FAFC] font-bold text-sm">
                        ₹{Number(rc.ratePerKg).toFixed(2)}/kg
                      </td>
                      <td className="p-3.5">
                        {rc.isActive ? (
                          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px] uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-[#1E293B] text-slate-500 font-mono font-bold text-[10px] uppercase">
                            Deactivated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COD Surcharges (1 Col) */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-3 flex items-center justify-between font-mono">
              <span>COD Surcharges</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </h3>

            <div className="space-y-3">
              {codSurcharges.map((cod) => (
                <div key={cod.id} className="bg-[#172033] border border-[#263449] p-4 rounded-md flex items-center justify-between shadow-xs hover:border-[#374151] transition-all">
                  <div className="space-y-1 font-mono">
                    <span className="font-bold text-[#F8FAFC] block text-sm">{cod.orderType} COD Surcharge</span>
                    <span className="text-xs text-amber-400 font-bold">+₹{Number(cod.amount).toFixed(2)} flat per order</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                    Active Fee
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Rate Card Modal */}
      <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Publish New Rate Card">
        <form onSubmit={handleCreateRateCard} className="space-y-4 font-mono">
          {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Order Tier</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="w-full glass-input text-xs bg-[#172033]">
                <option value="B2C">B2C (Retail)</option>
                <option value="B2B">B2B (Business)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Route Scope</label>
              <select value={rateType} onChange={(e) => setRateType(e.target.value as any)} className="w-full glass-input text-xs bg-[#172033]">
                <option value="INTRA_ZONE">INTRA_ZONE</option>
                <option value="INTER_ZONE">INTER_ZONE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Distance Rate (₹ / km)</label>
              <input type="number" step="0.5" min="0.1" required value={chargePerKm} onChange={(e) => setChargePerKm(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Weight Rate (₹ / kg)</label>
              <input type="number" step="0.5" min="0.1" required value={ratePerKg} onChange={(e) => setRatePerKg(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
            <button type="button" onClick={() => setIsRateModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Publish Rate Card'}</button>
          </div>
        </form>
      </Modal>

      {/* New COD Surcharge Modal */}
      <Modal isOpen={isCodModalOpen} onClose={() => setIsCodModalOpen(false)} title="Configure COD Surcharge">
        <form onSubmit={handleCreateCodSurcharge} className="space-y-4 font-mono">
          {error && <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Order Tier</label>
            <select value={codOrderType} onChange={(e) => setCodOrderType(e.target.value as any)} className="w-full glass-input text-xs bg-[#172033]">
              <option value="B2C">B2C (Retail)</option>
              <option value="B2B">B2B (Business)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Flat Surcharge Amount (₹)</label>
            <input type="number" step="1" min="0" required value={codAmount} onChange={(e) => setCodAmount(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
            <button type="button" onClick={() => setIsCodModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save COD Surcharge'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

