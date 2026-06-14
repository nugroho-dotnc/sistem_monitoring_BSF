import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, X } from 'lucide-react';

export interface AlertBannerProps {
  type: 'ok' | 'warning' | 'critical';
  message: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Reset visibility if the message or type changes to something new
  useEffect(() => {
    setIsVisible(true);
  }, [type, message]);

  if (!isVisible || type === 'ok') return null;

  const config = {
    warning: {
      color: 'bg-amber-50 text-amber-800 border-amber-500',
      badge: 'bg-amber-100 text-amber-800',
      icon: <AlertTriangle size={20} className="text-amber-500" />,
      label: 'Warning'
    },
    critical: {
      color: 'bg-red-50 text-red-800 border-red-500',
      badge: 'bg-red-100 text-red-800',
      icon: <AlertCircle size={20} className="text-red-500" />,
      label: 'Critical'
    }
  }[type];

  return (
    <div className={`mb-6 rounded-lg border-l-4 p-4 flex items-start justify-between shadow-sm ${config.color}`}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.badge}`}>
            {config.label}
          </span>
          <p className="font-medium">{message}</p>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        aria-label="Dismiss alert"
      >
        <X size={18} />
      </button>
    </div>
  );
};
