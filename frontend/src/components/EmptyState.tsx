import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<any>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon: Icon = PackageOpen,
}) => {
  return (
    <div className="bg-[#111827] border border-[#263449] p-12 text-center flex flex-col items-center justify-center my-6 shadow-xs rounded-md">
      <div className="w-14 h-14 rounded bg-[#172033] border border-[#263449] text-indigo-400 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-bold text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-[#94A3B8] text-xs max-w-sm mb-6 font-mono">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

