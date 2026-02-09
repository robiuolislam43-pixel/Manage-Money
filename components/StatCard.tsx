
import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendType?: 'up' | 'down';
  icon: React.ReactNode;
  colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendType, icon, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trendType === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trendType === 'up' ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
