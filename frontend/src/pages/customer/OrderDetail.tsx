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
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4 text-[#F8FAFC]">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#F8FAFC]">Order Not Found</h2>
        <p className="text-[#94A3B8] text-xs font-mono">{error || 'Could not locate the requested order ID.'}</p>
        <Link to="/orders" className="glass-button-secondary inline-flex items-center gap-2 text-xs font-mono">
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isFailed = order.currentStatus === 'FAILED';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F8FAFC]">
      {/* Top Nav */}
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#94A3B8] hover:text-indigo-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Orders List
      </Link>

      {/* Tracking Number Header */}
      <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-indigo-400 tracking-tight font-mono">
                #{order.orderNumber}
              </h1>
              <StatusBadge status={order.currentStatus} size="lg" />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 font-mono">
              Placed on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>

          {/* Reschedule Button if status FAILED */}
          {isFailed && (
            <button
              onClick={() => setIsRescheduleOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-md shadow-xs flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reschedule Delivery Attempt
            </button>
          )}
        </div>

        {/* Failed Notice Banner */}
        {isFailed && (
          <div className="p-4 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-400">Delivery Attempt Failed</strong>
              <p className="text-xs mt-0.5 text-rose-300/80">
                The last delivery attempt failed. You can reschedule a new target delivery date above, and an available field agent will be reassigned.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Route Info, Assigned Agent, Immutable Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route & Directional Flow Card */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs font-mono">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-2">
              Route Directional Flow & Delivery Addresses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Pickup Location */}
              <div className="space-y-1.5 bg-[#172033] p-4 rounded-md border border-[#263449]">
                <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider block">Pickup Origin</span>
                <p className="font-bold text-[#F8FAFC] text-sm">{order.pickupArea?.name}</p>
                <p className="text-[#94A3B8] text-[11px]">Hub Zone: {order.pickupArea?.zone?.name}</p>
                <p className="text-[#CBD5E1] mt-2 font-sans">{order.pickupAddress}</p>
              </div>

              {/* Drop-off Location */}
              <div className="space-y-1.5 bg-[#172033] p-4 rounded-md border border-[#263449]">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">Drop Destination</span>
                <p className="font-bold text-[#F8FAFC] text-sm">{order.dropArea?.name}</p>
                <p className="text-[#94A3B8] text-[11px]">Hub Zone: {order.dropArea?.zone?.name}</p>
                <p className="text-[#CBD5E1] mt-2 font-sans">{order.dropAddress}</p>
              </div>
            </div>
          </div>

          {/* Assigned Delivery Agent Card */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-3 shadow-xs font-mono">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-2 flex items-center justify-between">
              <span>Assigned Field Agent</span>
              <User className="w-4 h-4 text-indigo-400" />
            </h3>
            {order.assignedAgent ? (
              <div className="flex items-center justify-between text-xs bg-[#172033] p-3.5 rounded-md border border-[#263449]">
                <div>
                  <span className="font-bold text-[#F8FAFC] block text-sm">{order.assignedAgent.user.name}</span>
                  <span className="text-[#94A3B8] text-xs">
                    Hub Zone: {order.assignedAgent.zone?.name || 'Assigned Hub'}
                  </span>
                </div>
                <a
                  href={`tel:${order.assignedAgent.user.phone}`}
                  className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 font-bold text-xs text-emerald-400 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Call Agent ({order.assignedAgent.user.phone})
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#94A3B8] italic py-2">No field agent assigned yet. Pending dispatch assignment.</p>
            )}
          </div>

          {/* Immutable Delivery Timeline Card */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs font-mono">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-2 flex items-center justify-between">
              <span>Immutable Ledger Status Audit Trail</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h3>
            <Timeline history={order.statusHistory || []} />
          </div>
        </div>

        {/* RIGHT COLUMN: Billing Breakdown & Package Specifications */}
        <div className="space-y-6 font-mono">
          {/* Billing Breakdown Card */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-2">
              Financial Billing Breakdown
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Order Tier</span>
                <span className="text-[#F8FAFC] font-bold">{order.orderType}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Payment Scope</span>
                <span className="text-[#F8FAFC] font-bold">{order.paymentType}</span>
              </div>
              {order.distanceKm ? (
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Calculated Road Distance</span>
                  <span className="text-[#F8FAFC] font-bold">{order.distanceKm} km</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[#94A3B8]">
                <span>Distance Base Fee</span>
                <span className="font-bold text-[#F8FAFC]">₹{Number(order.baseFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Weight Fee ({order.chargeableWeightKg} kg)</span>
                <span className="font-bold text-[#F8FAFC]">₹{Number(order.weightCharge).toFixed(2)}</span>
              </div>
              {Number(order.codSurcharge) > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>COD Flat Surcharge</span>
                  <span className="font-bold">+₹{Number(order.codSurcharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#F8FAFC] pt-3 border-t border-[#263449]">
                <span>Total Billed Amount</span>
                <span className="text-lg font-bold text-indigo-400">₹{Number(order.totalCharge).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Package Specifications Card */}
          <div className="bg-[#111827] border border-[#263449] rounded-md p-6 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#CBD5E1] border-b border-[#263449] pb-2 flex items-center justify-between">
              <span>Package Specifications</span>
              <Package className="w-4 h-4 text-indigo-400" />
            </h3>
            <div className="space-y-2 text-xs text-[#94A3B8]">
              <div className="flex justify-between">
                <span>Dimensions (L×B×H):</span>
                <span className="text-[#F8FAFC] font-bold">{order.lengthCm} × {order.breadthCm} × {order.heightCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Actual Weight:</span>
                <span className="text-[#F8FAFC] font-bold">{order.actualWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Volumetric Weight:</span>
                <span className="text-[#F8FAFC] font-bold">{order.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-[#F8FAFC] border-t border-[#263449]">
                <span>Billable Chargeable Weight:</span>
                <span className="font-bold text-indigo-400">{order.chargeableWeightKg} kg</span>
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
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 font-mono">
          <p className="text-xs text-[#94A3B8]">
            Choose a new target delivery date. The order status will transition to <strong className="text-amber-400 uppercase">RESCHEDULED</strong> and be placed in agent dispatch queue.
          </p>

          {rescheduleError && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {rescheduleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
              New Target Delivery Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full glass-input text-xs font-mono bg-[#172033]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#263449]">
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

