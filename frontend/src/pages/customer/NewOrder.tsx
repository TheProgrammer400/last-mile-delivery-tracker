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
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
          <Package className="w-6 h-6 text-[#0F172A]" />
          New Order
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Step {step} of 3: {step === 1 ? '1. Details' : step === 2 ? '2. Quote Review' : '3. Confirmation'}
        </p>
      </div>

      {/* 3-Step Wizard Progress Bar (Stitch Screen 3 Specification) */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${step >= 1 ? 'bg-[#0F172A] text-white' : 'bg-[#ECEEF0] text-slate-500'}`}>1</div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Details</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 mb-4 ${step >= 2 ? 'bg-[#0F172A]' : 'bg-[#ECEEF0]'}`} />

          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${step >= 2 ? 'bg-[#0F172A] text-white' : 'bg-[#ECEEF0] text-slate-500'}`}>2</div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Quote Review</span>
          </div>

          <div className={`flex-1 h-0.5 mx-3 mb-4 ${step >= 3 ? 'bg-[#0F172A]' : 'bg-[#ECEEF0]'}`} />

          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-[#ECEEF0] text-slate-500'}`}>3</div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Confirmation</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded text-[#BA1A1A] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Details Input Form */}
      {step === 1 && (
        <form onSubmit={handleGetQuote} className="bg-white border border-[#E2E8F0] rounded p-6 space-y-6 shadow-sm">
          {/* Pickup Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pickup Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Pickup Area</label>
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full glass-input text-xs font-mono bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Pickup Address</label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Street address, building, unit #"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#E2E8F0]" />

          {/* Drop Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Drop-off Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Drop Area</label>
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full glass-input text-xs font-mono bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Drop Address</label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Destination street address, building #"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#E2E8F0]" />

          {/* Package Weight & Dimensions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Package Dimensions & Weight</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={breadthCm}
                  onChange={(e) => setBreadthCm(Number(e.target.value))}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Actual Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Number(e.target.value))}
                  className="w-full glass-input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#E2E8F0]" />

          {/* Type & Payment Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('B2C')}
                  className={`py-2 rounded text-xs font-bold transition-all border ${
                    orderType === 'B2C'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  B2C (Retail)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('B2B')}
                  className={`py-2 rounded text-xs font-bold transition-all border ${
                    orderType === 'B2B'
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  B2B (Business)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('PREPAID')}
                  className={`py-2 rounded text-xs font-bold transition-all border ${
                    paymentType === 'PREPAID'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('COD')}
                  className={`py-2 rounded text-xs font-bold transition-all border ${
                    paymentType === 'COD'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
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
            className="w-full glass-button-primary flex items-center justify-center gap-2 py-2.5"
          >
            <Calculator className="w-4 h-4" />
            <span>{isSubmitting ? 'Calculating Quote...' : 'Calculate Delivery Charge'}</span>
          </button>
        </form>
      )}

      {/* STEP 2: Quote Review Screen */}
      {step === 2 && quote && (
        <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-6 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-4">
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">Calculated Charge Breakdown</h2>
            <p className="text-xs text-slate-500 font-medium">
              Review full route rates and weight calculations before confirming order placement
            </p>
          </div>

          {/* Route Info Card */}
          <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0] text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Pickup Zone</span>
              <span className="font-bold text-[#0F172A] text-sm">{quote.pickupZoneName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Drop Zone</span>
              <span className="font-bold text-[#0F172A] text-sm">{quote.dropZoneName}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-slate-500">Route Rate Type:</span>
              <span className="font-bold text-[#0F172A] bg-slate-200 px-2 py-0.5 rounded font-mono">
                {quote.rateType}
              </span>
            </div>
          </div>

          {/* Volumetric vs Actual Weight Comparison Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Weight Comparison & Selection</h4>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                <span className="text-slate-500 block text-[10px]">Actual Weight</span>
                <span className="font-mono font-bold text-[#0F172A] text-sm">{actualWeightKg} kg</span>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                <span className="text-slate-500 block text-[10px]">Volumetric Weight</span>
                <span className="font-mono font-bold text-[#0F172A] text-sm">{quote.volumetricWeightKg} kg</span>
                <span className="text-[10px] text-slate-400 block font-mono">({lengthCm}×{breadthCm}×{heightCm} ÷ 5000)</span>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <span className="text-blue-700 block font-bold text-[10px] uppercase">Billable Weight</span>
                <span className="font-mono font-bold text-blue-900 text-sm">{quote.chargeableWeightKg} kg</span>
                <span className="text-[10px] text-blue-700 block font-semibold">(Higher Picked)</span>
              </div>
            </div>
          </div>

          {/* Fee Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
              <span className="text-slate-600">
                Base Distance Fee (<strong className="text-[#0F172A] font-mono">{quote.distanceKm} km</strong> × ₹{quote.chargePerKm}/km)
              </span>
              <span className="font-mono font-bold text-[#0F172A]">₹{quote.baseFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E2E8F0]">
              <span className="text-slate-600">Weight Charge ({quote.chargeableWeightKg} kg × ₹{quote.ratePerKg}/kg)</span>
              <span className="font-mono font-bold text-[#0F172A]">₹{quote.weightCharge.toFixed(2)}</span>
            </div>
            {paymentType === 'COD' && (
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] text-amber-700 font-semibold">
                <span>COD Surcharge ({orderType})</span>
                <span className="font-mono font-bold">+₹{quote.codSurcharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-sm font-bold text-[#0F172A] border-t border-[#0F172A]">
              <span>Total Payable Charge</span>
              <span className="text-xl font-mono font-bold text-[#0F172A]">₹{quote.totalCharge.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="glass-button-secondary flex-1 flex items-center justify-center gap-2 py-2.5 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Edit Details
            </button>
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="glass-button-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-xs"
            >
              <span>{isSubmitting ? 'Confirming...' : 'Confirm & Place Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Order Confirmation Screen */}
      {step === 3 && createdOrder && (
        <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center space-y-6 shadow-2xs">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Order Successfully Placed!</h2>
            <p className="text-slate-600 text-xs mt-1">
              Your tracking number is <strong className="text-[#0F172A] font-mono text-base">#{createdOrder.orderNumber}</strong>
            </p>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0] text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Current Status:</span>
              <span className="font-bold text-[#0F172A] uppercase font-mono">{createdOrder.currentStatus}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Charge Billed:</span>
              <span className="font-mono font-bold text-[#0F172A]">₹{createdOrder.totalCharge}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/orders/${createdOrder.id}`)}
              className="glass-button-primary px-6 py-2.5 text-xs"
            >
              View Order Detail & Live Timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
