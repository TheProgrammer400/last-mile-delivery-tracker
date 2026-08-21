import React, { useState, useEffect } from 'react';
import { getRateCardsApi, createRateCardApi, getCodSurchargesApi, createCodSurchargeApi } from '../../api/admin';
import { RateCard, CodSurcharge } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import { CreditCard, DollarSign, Plus } from 'lucide-react';

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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#0F172A]" />
            Rate Cards & COD Surcharges
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">Configure zone calculation rates, per-kg fees, and COD surcharges</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              setIsCodModalOpen(true);
            }}
            className="glass-button-secondary text-xs py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-600" />
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
          {/* Rate Cards (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <span>Active & Historical Rate Cards ({rateCards.length})</span>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#191C1E]">
                <thead className="bg-[#ECEEF0] text-[#515F74] uppercase font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3">Order Type</th>
                    <th className="p-3">Route Type</th>
                    <th className="p-3">Charge / Km</th>
                    <th className="p-3">Rate / Kg</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {rateCards.map((rc) => (
                    <tr key={rc.id} className={rc.isActive ? 'hover:bg-[#F8FAFC]' : 'opacity-50'}>
                      <td className="p-3 font-bold text-[#0F172A]">{rc.orderType}</td>
                      <td className="p-3 font-mono">{rc.rateType}</td>
                      <td className="p-3 font-mono text-indigo-600 font-bold">₹{Number(rc.chargePerKm || 8).toFixed(2)}/km</td>
                      <td className="p-3 font-mono font-bold">₹{Number(rc.ratePerKg).toFixed(2)}/kg</td>
                      <td className="p-3">
                        {rc.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[10px] uppercase">
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
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <span>COD Surcharges</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </h3>

            <div className="space-y-3">
              {codSurcharges.map((cod) => (
                <div key={cod.id} className="bg-white border border-[#E2E8F0] p-4 rounded flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold text-[#0F172A] block text-sm">{cod.orderType} COD Surcharge</span>
                    <span className="text-xs text-[#475569] font-mono">+₹{Number(cod.amount).toFixed(2)} flat per order</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Rate Card Modal */}
      <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Create Rate Card">
        <form onSubmit={handleCreateRateCard} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Order Type</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="w-full glass-input text-xs bg-white font-mono">
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Rate Type</label>
              <select value={rateType} onChange={(e) => setRateType(e.target.value as any)} className="w-full glass-input text-xs bg-white font-mono">
                <option value="INTRA_ZONE">INTRA_ZONE</option>
                <option value="INTER_ZONE">INTER_ZONE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Charge Per Km (₹)</label>
              <input type="number" step="0.5" min="0.1" required value={chargePerKm} onChange={(e) => setChargePerKm(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Rate / Kg (₹)</label>
              <input type="number" step="0.5" min="0.1" required value={ratePerKg} onChange={(e) => setRatePerKg(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => setIsRateModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Publish Rate Card'}</button>
          </div>
        </form>
      </Modal>

      {/* New COD Surcharge Modal */}
      <Modal isOpen={isCodModalOpen} onClose={() => setIsCodModalOpen(false)} title="Configure COD Surcharge">
        <form onSubmit={handleCreateCodSurcharge} className="space-y-4">
          {error && <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Order Type</label>
            <select value={codOrderType} onChange={(e) => setCodOrderType(e.target.value as any)} className="w-full glass-input text-xs bg-white font-mono">
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Flat Surcharge Amount (₹)</label>
            <input type="number" step="1" min="0" required value={codAmount} onChange={(e) => setCodAmount(Number(e.target.value))} className="w-full glass-input text-xs font-mono" />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button type="button" onClick={() => setIsCodModalOpen(false)} className="glass-button-secondary text-xs py-1.5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="glass-button-primary text-xs py-1.5 px-4">{isSubmitting ? 'Saving...' : 'Save COD Surcharge'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
