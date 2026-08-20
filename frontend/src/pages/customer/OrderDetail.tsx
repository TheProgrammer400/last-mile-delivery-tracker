import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderByIdApi, rescheduleOrderApi } from '../../api/orders';
import { Order } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { Skeleton } from '../../components/Skeleton';
import { Modal } from '../../components/Modal';
import {
  Package,
  MapPin,
  Calendar,
  User,
  Clock,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Order Not Found</h2>
        <p className="text-slate-400 text-sm">{error || 'Could not locate the requested order.'}</p>
        <Link to="/orders" className="glass-button-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isFailed = order.currentStatus === 'FAILED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Nav */}
      <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to My Orders
      </Link>

      {/* Header Info Banner */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.currentStatus} size="lg" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>

          {/* Reschedule Button if status FAILED */}
          {isFailed && (
            <button
              onClick={() => setIsRescheduleOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all animate-pulse"
            >
              <RotateCcw className="w-4 h-4" />
              Reschedule Delivery
            </button>
          )}
        </div>

        {/* Failed Notice Banner */}
        {isFailed && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <strong className="block font-semibold text-rose-200">Delivery Attempt Failed</strong>
              <p className="text-xs mt-0.5">
                The last delivery attempt failed. You can reschedule a new delivery date above, and an available agent will be reassigned.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Shipment Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Addresses */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              Route & Addresses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-indigo-400 uppercase font-semibold block">Pickup Location</span>
                <p className="font-semibold text-slate-100">{order.pickupArea?.name} ({order.pickupArea?.zone?.name})</p>
                <p className="text-xs text-slate-400">{order.pickupAddress}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-emerald-400 uppercase font-semibold block">Drop-off Location</span>
                <p className="font-semibold text-slate-100">{order.dropArea?.name} ({order.dropArea?.zone?.name})</p>
                <p className="text-xs text-slate-400">{order.dropAddress}</p>
              </div>
            </div>
          </div>

          {/* Assigned Agent */}
          <div className="glass-panel p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Assigned Delivery Agent</span>
              <User className="w-4 h-4 text-indigo-400" />
            </h3>
            {order.assignedAgent ? (
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-slate-100 block">{order.assignedAgent.user.name}</span>
                  <span className="text-xs text-slate-400">{order.assignedAgent.user.phone} • Zone: {order.assignedAgent.zone?.name}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Assigned
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No agent assigned yet. Pending assignment.</p>
            )}
          </div>

          {/* Tracking Timeline */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              Immutable Tracking Timeline
            </h3>
            <Timeline history={order.statusHistory || []} />
          </div>
        </div>

        {/* Right Column: Pricing & Package Specs */}
        <div className="space-y-6">
          {/* Price Snapshot */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              Billing Breakdown
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Order Type</span>
                <span className="text-slate-200 font-medium">{order.orderType}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Type</span>
                <span className="text-slate-200 font-medium">{order.paymentType}</span>
              </div>
              {order.distanceKm ? (
                <div className="flex justify-between text-slate-400">
                  <span>Road Distance</span>
                  <span className="text-slate-200 font-medium">{order.distanceKm} km</span>
                </div>
              ) : null}
              <div className="flex justify-between text-slate-400">
                <span>Distance Base Fee</span>
                <span className="font-mono text-slate-200">₹{Number(order.baseFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Weight Charge ({order.chargeableWeightKg} kg)</span>
                <span className="font-mono text-slate-200">₹{Number(order.weightCharge).toFixed(2)}</span>
              </div>
              {Number(order.codSurcharge) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>COD Surcharge</span>
                  <span className="font-mono">+₹{Number(order.codSurcharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                <span>Total Billed</span>
                <span className="text-indigo-400 font-mono">₹{Number(order.totalCharge).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Package Specs */}
          <div className="glass-panel p-6 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
              Package Specifications
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions (L×B×H):</span>
                <span>{order.lengthCm} × {order.breadthCm} × {order.heightCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Weight:</span>
                <span>{order.actualWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volumetric Weight:</span>
                <span>{order.volumetricWeightKg} kg</span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-indigo-400 border-t border-slate-800/80">
                <span>Chargeable Weight:</span>
                <span>{order.chargeableWeightKg} kg</span>
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
          <p className="text-xs text-slate-400">
            Please choose a new delivery date. The order status will transition to <strong className="text-violet-400">RESCHEDULED</strong> and be reassigned for attempt.
          </p>

          {rescheduleError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {rescheduleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
              New Delivery Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full glass-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="glass-button-secondary text-sm py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRescheduling}
              className="glass-button-primary text-sm py-2 px-5"
            >
              {isRescheduling ? 'Rescheduling...' : 'Submit Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
