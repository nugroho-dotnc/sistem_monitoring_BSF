import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SensorReading, MetricConfig } from '../types';

interface SensorChartProps {
  data: SensorReading[];
  timeRange: string;
  metrics: MetricConfig[];
  height?: string;
}

export const SensorChart: React.FC<SensorChartProps> = ({ data, timeRange, metrics, height = 'h-[240px] sm:h-[320px]' }) => {
  const formatTime = (timeStr: string) => {
    try {
      const date = parseISO(timeStr);
      // Show time for 1h/24h, show date for 7d+
      if (timeRange === '1h' || timeRange === '24h') {
        return format(date, 'HH:mm');
      }
      return format(date, 'MMM dd');
    } catch {
      return timeStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg">
          <p className="text-sm font-semibold text-slate-500 mb-3 border-b border-slate-100 pb-2">
            {format(parseISO(label), 'MMM dd, yyyy HH:mm:ss')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 text-sm">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-600 w-24">{entry.name}:</span>
              <span className="font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-slate-50 rounded-xl`}>
        <span className="text-slate-400">No historical data available</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTime} 
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            dy={10}
            minTickGap={40}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#475569' }} 
            iconType="circle"
          />
          
          {metrics.map(metric => (
            <Line 
              key={metric.key}
              type="monotone" 
              dataKey={metric.key} 
              name={metric.label}
              stroke={metric.color} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
