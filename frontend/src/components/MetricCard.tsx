import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { MetricConfig, SensorReading, ThresholdConfig } from '../types';
import { getStatus } from '../utils/dashboard';

const STATUS_COPY: Record<string, Record<string, string>> = {
  temperature: {
    normal:   "Suhu dalam rentang aman.",
    warning:  "Suhu mendekati batas — pantau secara berkala.",
    critical: "Suhu terlalu tinggi — segera periksa ventilasi kandang.",
  },
  humidity: {
    normal:   "Kelembaban cukup untuk pertumbuhan optimal.",
    warning:  "Kelembaban mulai menurun — pertimbangkan penyiraman.",
    critical: "Kelembaban terlalu rendah — larva dalam risiko stres.",
  },
  light_intensity: {
    normal:   "Intensitas cahaya mencukupi.",
    warning:  "Cahaya mulai melemah — periksa sumber cahaya.",
    critical: "Cahaya tidak mencukupi — proses kawin BSF terganggu.",
  },
};

interface MetricCardProps {
  config: MetricConfig;
  value: number;
  history: SensorReading[];
  thresholds?: ThresholdConfig | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({ config, value, history, thresholds }) => {
  const status = getStatus(config.key, value, thresholds);
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(value);
      const timer = setTimeout(() => setIsUpdating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  // Transform history data for sparkline
  const chartData = history.map(h => ({
    value: Number(h[config.key])
  })).reverse(); // Oldest to newest left to right

  return (
    <div className="card-base flex flex-col justify-between min-h-[20rem]">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{config.label}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">{value}</span>
              <span className="text-sm font-medium text-slate-400">{config.unit}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex flex-col items-end">
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              status === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' :
              status === 'warning'  ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        </div>

        {/* Status Micro-copy */}
        <div 
          role="status" 
          className={`text-xs mt-1 transition-opacity duration-300 min-h-[1.25rem] ${
            status === 'critical' ? 'text-red-600' :
            status === 'warning' ? 'text-amber-600' :
            'text-emerald-600'
          }`}
        >
          {STATUS_COPY[config.key]?.[status] || ""}
        </div>
      </div>

      <div className="flex-1 mt-4 relative -mx-2 min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
