import React from 'react';
import { OrderStatusHistory } from '../types';
import { StatusBadge } from './StatusBadge';
import { User, Clock } from 'lucide-react';

interface TimelineProps {
  history: OrderStatusHistory[];
}

export const Timeline: React.FC<TimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return <p className="text-slate-400 text-sm py-4">No status history available.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
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
                  ? 'bg-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/50 scale-110'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-slate-500'}`} />
            </div>

            {/* Event Card */}
            <div className={`glass-card p-4 transition-all ${isLatest ? 'border-indigo-500/40 bg-slate-900/80' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-slate-200">
                  {item.changedByUser?.name || 'System'}
                </span>
                <span className="text-slate-500">({item.changedByUser?.role || 'SYSTEM'})</span>
              </div>

              {item.note && (
                <p className="mt-2 text-sm text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 italic">
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
