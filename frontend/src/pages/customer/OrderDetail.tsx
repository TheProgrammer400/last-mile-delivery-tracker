import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderByIdApi, rescheduleOrderApi } from '../../api/orders';
import { Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import {
  User,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Phone,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetail() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getOrderByIdApi(id);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrderDetail();
  }, [id]);

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newDate) return;
    setRescheduleError(null);
    setIsRescheduling(true);

    try {
      const updated = await rescheduleOrderApi(id, newDate);
      setOrder(updated);
      setIsRescheduleOpen(false);
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule order');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#BA1A1A] mx-auto" />
        <h2 className="text-xl font-bold text-[#0F172A]">Order Not Found</h2>
        <p className="text-slate-500 text-xs">{error || 'Could not locate the requested order.'}</p>
        <Link to="/orders" className="glass-button-secondary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isFailed = order.currentStatus === 'FAILED';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Nav */}
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to My Orders
      </Link>

      {/* Screen 2 Header: Tracking Number in JetBrains Mono & Status Badge */}
      <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight font-mono">
                #{order.orderNumber}
              </h1>
              <StatusBadge status={order.currentStatus} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Placed on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>

          {/* Reschedule Button if status FAILED */}
          {isFailed && (
            <button
              onClick={() => setIsRescheduleOpen(true)}
              className="bg-[#BA1A1A] hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reschedule Delivery
            </button>
          )}
        </div>

        {/* Failed Notice Banner */}
        {isFailed && (
          <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#BA1A1A] mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-900">Delivery Attempt Failed</strong>
              <p className="text-xs mt-0.5">
                The last delivery attempt failed. You can reschedule a new delivery date above, and an available agent will be reassigned.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Layout (Stitch Screen 2 Structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Route Info, Assigned Agent, Immutable Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route & Directional Flow Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-2">
              Route & Address Directional Flow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Pickup Location */}
              <div className="space-y-1 bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0]">
                <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider block">Pickup Location</span>
                <p className="font-bold text-[#0F172A] text-sm">{order.pickupArea?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">Zone: {order.pickupArea?.zone?.name}</p>
                <p className="text-slate-700 mt-2">{order.pickupAddress}</p>
              </div>

              {/* Drop-off Location */}
              <div className="space-y-1 bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0]">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">Drop-off Location</span>
                <p className="font-bold text-[#0F172A] text-sm">{order.dropArea?.name}</p>
                <p className="text-slate-500 font-mono text-[11px]">Zone: {order.dropArea?.zone?.name}</p>
                <p className="text-slate-700 mt-2">{order.dropAddress}</p>
              </div>
            </div>
          </div>

          {/* Assigned Delivery Agent Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
              <span>Assigned Delivery Agent</span>
              <User className="w-4 h-4 text-slate-500" />
            </h3>
            {order.assignedAgent ? (
              <div className="flex items-center justify-between text-xs bg-[#F8FAFC] p-3.5 rounded border border-[#E2E8F0]">
                <div>
                  <span className="font-bold text-[#0F172A] block text-sm">{order.assignedAgent.user.name}</span>
                  <span className="text-slate-500 font-mono text-xs">
                    Hub Zone: {order.assignedAgent.zone?.name || 'Assigned Zone'}
                  </span>
                </div>
                <a
                  href={`tel:${order.assignedAgent.user.phone}`}
                  className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 font-mono font-bold text-xs text-[#0F172A] flex items-center gap-1.5 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {order.assignedAgent.user.phone}
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No agent assigned yet. Pending dispatch assignment.</p>
            )}
          </div>

          {/* Immutable Delivery Timeline Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
              <span>Immutable Delivery Timeline</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </h3>
            <Timeline history={order.statusHistory || []} />
          </div>
        </div>

        {/* RIGHT COLUMN: Billing Breakdown & Package Specifications */}
        <div className="space-y-6">
          {/* Billing Breakdown Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-2">
              Billing Breakdown
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order Type</span>
                <span className="text-[#0F172A] font-bold font-mono">{order.orderType}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method</span>
                <span className="text-[#0F172A] font-bold font-mono">{order.paymentType}</span>
              </div>
              {order.distanceKm ? (
                <div className="flex justify-between text-slate-600">
                  <span>Road Distance</span>
                  <span className="text-[#0F172A] font-bold font-mono">{order.distanceKm} km</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Distance Base Fee</span>
                <span className="font-mono font-bold text-[#0F172A]">₹{Number(order.baseFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Weight Charge ({order.chargeableWeightKg} kg)</span>
                <span className="font-mono font-bold text-[#0F172A]">₹{Number(order.weightCharge).toFixed(2)}</span>
              </div>
              {Number(order.codSurcharge) > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span className="font-semibold">COD Surcharge</span>
                  <span className="font-mono font-bold">+₹{Number(order.codSurcharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#0F172A] pt-3 border-t border-[#E2E8F0]">
                <span>Total Billed</span>
                <span className="text-lg font-mono font-bold text-[#0F172A]">₹{Number(order.totalCharge).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Package Specifications Card */}
          <div className="bg-white border border-[#E2E8F0] rounded p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#515F74] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
              <span>Package Specifications</span>
              <Package className="w-4 h-4 text-slate-500" />
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Dimensions (L×B×H):</span>
                <span className="font-mono text-[#0F172A] font-bold">{order.lengthCm} × {order.breadthCm} × {order.heightCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Actual Weight:</span>
                <span className="font-mono text-[#0F172A] font-bold">{order.actualWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Volumetric Weight:</span>
                <span className="font-mono text-[#0F172A] font-bold">{order.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-[#0F172A] border-t border-[#E2E8F0]">
                <span>Chargeable Weight:</span>
                <span className="font-mono font-bold text-indigo-600">{order.chargeableWeightKg} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Failed Delivery"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please choose a new delivery date. The order status will transition to <strong className="text-purple-700 font-mono uppercase">RESCHEDULED</strong> and be reassigned for attempt.
          </p>

          {rescheduleError && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-[#BA1A1A] text-xs font-medium">
              {rescheduleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Delivery Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full glass-input text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="glass-button-secondary text-xs py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRescheduling}
              className="glass-button-primary text-xs py-1.5 px-4"
            >
              {isRescheduling ? 'Rescheduling...' : 'Submit Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
