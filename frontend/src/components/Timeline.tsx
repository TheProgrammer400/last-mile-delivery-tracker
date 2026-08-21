import React from 'react';
import { OrderStatusHistory } from '../types';
import { StatusBadge } from './StatusBadge';
import { User, Clock } from 'lucide-react';

interface TimelineProps {
  history: OrderStatusHistory[];
}

export const Timeline: React.FC<TimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-[#94A3B8] text-xs py-4 italic font-mono">No status history recorded for this shipment.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#263449]">
      {history.map((item, index) => {
        const isLatest = index === history.length - 1;
        const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest
                  ? 'bg-indigo-600 border-indigo-400 ring-4 ring-indigo-500/20 scale-110'
                  : 'bg-[#172033] border-[#263449]'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-[#94A3B8]'}`} />
            </div>

            {/* Event Card */}
            <div className={`bg-[#172033] border rounded p-4 shadow-xs transition-all ${isLatest ? 'border-indigo-500/50' : 'border-[#263449]'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#CBD5E1]">
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#CBD5E1] mb-1">
                <User className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="font-semibold text-[#F8FAFC]">
                  {item.changedByUser?.name || 'System Operator'}
                </span>
                <span className="text-[#94A3B8] font-mono text-[10px]">({item.changedByUser?.role || 'SYSTEM'})</span>
              </div>

              {item.note && (
                <p className="mt-2 text-xs text-[#CBD5E1] bg-[#1E293B] p-2.5 rounded border border-[#263449] italic font-mono">
                  "{item.note}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

