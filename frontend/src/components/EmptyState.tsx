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
    <div className="bg-white border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center my-6 shadow-xs rounded-md">
      <div className="w-14 h-14 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-[#0F172A]" />
      </div>
      <h3 className="text-base font-bold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-[#475569] text-xs max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
