import React from 'react';
import { OrderStatusHistory } from '../types';
import { StatusBadge } from './StatusBadge';
import { User, Clock } from 'lucide-react';

interface TimelineProps {
  history: OrderStatusHistory[];
}

export const Timeline: React.FC<TimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-slate-500 text-xs py-4 italic">No status history available.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0]">
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
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isLatest
                  ? 'bg-[#0F172A] border-[#0F172A] scale-110'
                  : 'bg-[#F1F5F9] border-[#CBD5E1]'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-slate-400'}`} />
            </div>

            {/* Event Card */}
            <div className={`bg-white border rounded p-4 shadow-xs transition-all ${isLatest ? 'border-[#0F172A]' : 'border-[#E2E8F0]'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#475569]">
                  <Clock className="w-3 h-3" />
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#475569] mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-[#0F172A]">
                  {item.changedByUser?.name || 'System'}
                </span>
                <span className="text-slate-500 font-mono text-[10px]">({item.changedByUser?.role || 'SYSTEM'})</span>
              </div>

              {item.note && (
                <p className="mt-2 text-xs text-slate-800 bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0] italic">
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
