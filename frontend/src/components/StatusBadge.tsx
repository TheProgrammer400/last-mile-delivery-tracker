import React from 'react';
import { OrderStatus } from '../types';
import {
  Clock,
  UserCheck,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: React.ComponentType<any> }
> = {
  CREATED: {
    label: 'Created',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  ASSIGNED: {
    label: 'Assigned',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    icon: UserCheck,
  },
  PICKED_UP: {
    label: 'Picked Up',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    icon: Package,
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    icon: MapPin,
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    icon: XCircle,
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    icon: Calendar,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.CREATED;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5 font-mono font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-mono font-semibold',
    lg: 'px-3.5 py-1.5 text-xs gap-2 font-mono font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

