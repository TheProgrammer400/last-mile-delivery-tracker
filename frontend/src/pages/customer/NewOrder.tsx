import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAreasApi } from '../../api/admin';
import { getQuoteApi, createOrderApi } from '../../api/orders';
import { Area, QuoteResult, Order } from '../../types';
import { Package, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Calculator } from 'lucide-react';

export const NewOrder: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);

  // Form State
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupAreaId, setPickupAreaId] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropAreaId, setDropAreaId] = useState('');
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [breadthCm, setBreadthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [actualWeightKg, setActualWeightKg] = useState<number>(2.0);
  const [orderType, setOrderType] = useState<'B2C' | 'B2B'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAreas() {
      try {
        const data = await getAreasApi();
        setAreas(data);
        if (data.length >= 2) {
          setPickupAreaId(data[0].id);
          setDropAreaId(data[1].id);
        } else if (data.length === 1) {
          setPickupAreaId(data[0].id);
          setDropAreaId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load areas', err);
      } finally {
        setIsLoadingAreas(false);
      }
    }
    loadAreas();
  }, []);

  const handleGetQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pickupAreaId || !dropAreaId) {
      setError('Please select both pickup and drop areas');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await getQuoteApi({
        pickupAreaId,
        dropAreaId,
        lengthCm,
        breadthCm,
        heightCm,
        actualWeightKg,
        orderType,
        paymentType,
      });
      setQuote(res);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to compute price quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createOrderApi({
        pickupAddress,
        pickupAreaId,
        dropAddress,
        dropAreaId,
        lengthCm,
        breadthCm,
        heightCm,
        actualWeightKg,
        orderType,
        paymentType,
      });
      setCreatedOrder(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-indigo-400" />
          Create New Delivery Order
        </h1>
        <p className="text-sm text-slate-400">
          Step {step} of 3: {step === 1 ? 'Shipment Details' : step === 2 ? 'Review Charge Breakdown' : 'Confirmation'}
        </p>
      </div>

      {/* Progress Steps Indicator */}
      <div className="flex items-center justify-between max-w-md mx-auto my-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>1</div>
        <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>2</div>
        <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>3</div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Input Details */}
      {step === 1 && (
        <form onSubmit={handleGetQuote} className="glass-panel p-6 space-y-6">
          {/* Pickup Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Pickup Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Pickup Area</label>
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full glass-input text-sm bg-slate-950"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.zone?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Full Pickup Address</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Street address, building, unit #"
                  className="w-full glass-input text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Drop Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Drop-off Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Drop Area</label>
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full glass-input text-sm bg-slate-950"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.zone?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Full Drop Address</label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Destination street address, building #"
                  className="w-full glass-input text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Package Weight & Dimensions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Package Dimensions & Weight</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={breadthCm}
                  onChange={(e) => setBreadthCm(Number(e.target.value))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Actual Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  className="w-full glass-input text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Type & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('B2C')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    orderType === 'B2C'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  B2C (Retail)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('B2B')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    orderType === 'B2B'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  B2B (Business)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('PREPAID')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    paymentType === 'PREPAID'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('COD')}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    paymentType === 'COD'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  COD
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-3"
          >
            <Calculator className="w-4 h-4" />
            <span>{isSubmitting ? 'Calculating Quote...' : 'Calculate Delivery Charge'}</span>
          </button>
        </form>
      )}

      {/* Step 2: Quote Breakdown & Confirm */}
      {step === 2 && quote && (
        <div className="glass-panel p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-100 mb-1">Calculated Charge Breakdown</h2>
            <p className="text-sm text-slate-400">
              Review rate details before placing order
            </p>
          </div>

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Pickup Zone</span>
              <span className="font-semibold text-slate-200">{quote.pickupZoneName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Drop Zone</span>
              <span className="font-semibold text-slate-200">{quote.dropZoneName}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Route Type:</span>
              <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {quote.rateType}
              </span>
            </div>
          </div>

          {/* Weight Calculation Formula */}
          <div className="glass-card p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weight Calculation</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Actual Weight</span>
                <span className="font-bold text-slate-200 text-sm">{actualWeightKg} kg</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Volumetric Weight</span>
                <span className="font-bold text-slate-200 text-sm">{quote.volumetricWeightKg} kg</span>
                <span className="text-[10px] text-slate-600 block">({lengthCm}×{breadthCm}×{heightCm} ÷ 5000)</span>
              </div>
              <div className="bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/30">
                <span className="text-indigo-400 block font-semibold">Billable Weight</span>
                <span className="font-bold text-indigo-300 text-sm">{quote.chargeableWeightKg} kg</span>
                <span className="text-[10px] text-indigo-400/70 block">(Higher picked)</span>
              </div>
            </div>
          </div>

          {/* Fee Table */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">
                Base Fee (<strong className="text-slate-200">{quote.distanceKm} km</strong> × ₹{quote.chargePerKm}/km)
              </span>
              <span className="font-mono text-slate-200">₹{quote.baseFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Weight Charge ({quote.chargeableWeightKg} kg × ₹{quote.ratePerKg}/kg)</span>
              <span className="font-mono text-slate-200">₹{quote.weightCharge.toFixed(2)}</span>
            </div>
            {paymentType === 'COD' && (
              <div className="flex justify-between py-1.5 border-b border-slate-800/60 text-amber-400">
                <span>COD Surcharge ({orderType})</span>
                <span className="font-mono">+₹{quote.codSurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-base font-bold text-slate-100 border-t border-slate-700">
              <span>Total Charge</span>
              <span className="text-xl font-bold text-indigo-400">₹{quote.totalCharge.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="glass-button-secondary flex-1 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Edit Details
            </button>
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="glass-button-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              <span>{isSubmitting ? 'Confirming...' : 'Confirm & Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {step === 3 && createdOrder && (
        <div className="glass-panel p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-100">Order Successfully Placed!</h2>
            <p className="text-slate-400 text-sm mt-1">
              Your tracking number is <strong className="text-indigo-400 font-mono">{createdOrder.orderNumber}</strong>
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Status:</span>
              <span className="font-semibold text-amber-400 uppercase">{createdOrder.currentStatus}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Paid/Due:</span>
              <span className="font-bold text-slate-200">₹{createdOrder.totalCharge}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/orders/${createdOrder.id}`)}
              className="glass-button-primary px-6"
            >
              View Order Detail & Timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
