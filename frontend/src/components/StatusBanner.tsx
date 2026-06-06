import React from 'react';
import type { MetricStatus } from '../types';

interface StatusBannerProps {
  status: MetricStatus;
  message: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ status, message }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-800';

  if (status === 'normal') {
    bgColor = 'bg-[#16A34A]/10';
    textColor = 'text-[#16A34A]';
  } else if (status === 'warning') {
    bgColor = 'bg-[#D97706]/10';
    textColor = 'text-[#D97706]';
  } else if (status === 'critical') {
    bgColor = 'bg-[#DC2626]/10';
    textColor = 'text-[#DC2626]';
  }

  return (
    <div className={`w-full px-6 py-4 rounded-xl font-medium text-lg transition-colors duration-500 flex items-center gap-3 ${bgColor} ${textColor}`}>
      {status === 'normal' && (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
      )}
      {status === 'warning' && (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      )}
      {status === 'critical' && (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )}
      {message}
    </div>
  );
};
