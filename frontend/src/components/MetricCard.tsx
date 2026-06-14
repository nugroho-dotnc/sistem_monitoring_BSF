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
    critical: "Cahaya tidak mencukupi — maggot berpotensi mengalami stres .",
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
    <div className={`card-base flex flex-col justify-between min-h-[12rem] p-5 transition-colors duration-300 ${
      status === 'critical' ? 'bg-red-50' :
      status === 'warning' ? 'bg-amber-50' :
      'bg-white'
    }`}>
      <div>
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{config.label}</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
              <span className="text-xs font-medium text-slate-400">{config.unit}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex flex-col items-end">
            <div className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
              status === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
              status === 'warning'  ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {status}
            </div>
          </div>
        </div>

        {/* Status Micro-copy */}
        <div 
          role="status" 
          className={`text-[11px] leading-tight mt-1 transition-opacity duration-300 min-h-[2rem] ${
            status === 'critical' ? 'text-red-600' :
            status === 'warning' ? 'text-amber-600' :
            'text-emerald-600'
          }`}
        >
          {STATUS_COPY[config.key]?.[status] || ""}
        </div>
      </div>

      <div className="flex-1 mt-2 relative -mx-2 min-h-[60px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={config.color} 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
