import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, subHours, subDays } from 'date-fns';
import type { SensorReading, ThresholdConfig } from '../../../types';
import { METRICS } from '../../../utils/dashboard';

export type TimeRange = '1h' | '24h' | '7d';

interface MultiSensorChartProps {
  data: SensorReading[];
  thresholds?: ThresholdConfig | null;
  timeRange: string;
  onTimeRangeChange: (range: any) => void;
}

export const MultiSensorChart: React.FC<MultiSensorChartProps> = ({ data, thresholds, timeRange, onTimeRangeChange }) => {
  const chartData = useMemo(() => {
    if (!thresholds || data.length === 0) return [];

    const now = new Date();
    let cutoff = new Date();
    if (timeRange === '1h') cutoff = subHours(now, 1);
    else if (timeRange === '24h') cutoff = subHours(now, 24);
    else if (timeRange === '7d') cutoff = subDays(now, 7);

    const filtered = data.filter(d => new Date(d.timestamp) >= cutoff).reverse();

    // Normalization helper: maps warning->80%, critical->100%
    const normalize = (val: number, warning: number, critical: number) => {
      if (warning === critical) return 0;
      const A = 20 / (critical - warning);
      const B = 100 - (A * critical);
      const norm = A * val + B;
      return Math.max(0, Math.min(120, norm)); // cap between 0 and 120%
    };

    return filtered.map(d => {
      const tempNorm = normalize(d.temperature, thresholds.temp_warning, thresholds.temp_critical);
      const humidNorm = normalize(d.humidity, thresholds.humid_warning, thresholds.humid_critical);
      const lightNorm = normalize(d.light_intensity, thresholds.light_warning, thresholds.light_critical);

      return {
        timestamp: d.timestamp,
        displayTime: timeRange === '1h' ? format(new Date(d.timestamp), 'HH:mm') : format(new Date(d.timestamp), 'dd MMM HH:mm'),
        tempNorm,
        humidNorm,
        lightNorm,
        // Keep raw values for tooltip
        rawTemp: d.temperature,
        rawHumid: d.humidity,
        rawLight: d.light_intensity
      };
    });
  }, [data, thresholds, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((p: any, i: number) => {
            let rawKey = '';
            let unit = '';
            if (p.dataKey === 'tempNorm') { rawKey = 'rawTemp'; unit = '°C'; }
            if (p.dataKey === 'humidNorm') { rawKey = 'rawHumid'; unit = '%'; }
            if (p.dataKey === 'lightNorm') { rawKey = 'rawLight'; unit = 'lux'; }
            
            return (
              <div key={i} className="flex items-center justify-between gap-4 text-sm">
                <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
                <span className="font-mono text-slate-700">{p.payload[rawKey]?.toFixed(1)} {unit}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-slate-900">Riwayat Sensor Terpadu</h3>
          <p className="text-sm text-slate-500">Suhu & Kelembapan (Atas) vs Intensitas Cahaya (Bawah)</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(['1h', '24h', '7d'] as TimeRange[]).map(t => (
            <button
              key={t}
              onClick={() => onTimeRangeChange(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === t ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-80 w-full flex items-center justify-center text-slate-400">
          {thresholds ? "Belum ada data sensor." : "Menunggu pengaturan threshold..."}
        </div>
      ) : (
        <>
          {/* Main Chart: Temp & Humidity */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayTime" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 120]}
                  ticks={[0, 20, 40, 60, 80, 100, 120]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Kritis', fill: '#ef4444', fontSize: 12 }} />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Peringatan', fill: '#f59e0b', fontSize: 12 }} />
                
                <Line type="monotone" dataKey="tempNorm" name="Temperature" stroke={METRICS[0].color} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidNorm" name="Humidity" stroke={METRICS[1].color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sub Chart: Light Intensity */}
          <div className="h-48 w-full mt-2">
            <h4 className="text-sm font-medium text-slate-700 mb-2 px-10">Intensitas Cahaya</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayTime" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 120]}
                  ticks={[0, 50, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={() => null} /> {/* Hide legend for the subchart since title is there */}
                
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" />
                
                <Line type="stepAfter" dataKey="lightNorm" name="Light Intensity" stroke={METRICS[2].color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};
