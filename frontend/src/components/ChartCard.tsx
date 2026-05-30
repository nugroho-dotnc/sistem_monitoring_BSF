import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { type SensorLog } from '../types';

interface ChartCardProps {
  data: SensorLog[];
  dataKey: keyof SensorLog;
  color: string;
  title: string;
  unit: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({ data, dataKey, color, title, unit }) => {
  const formatTime = (timeStr: string) => {
    try {
      return format(parseISO(timeStr), 'HH:mm:ss');
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 className="text-display" style={{ fontSize: '24px' }}>{title} <span style={{fontSize: '16px', color: 'var(--color-muted)', fontFamily: 'var(--font-body)'}}>({unit})</span></h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime} 
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              axisLine={false}
              tickLine={false}
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip 
              labelFormatter={(label) => formatTime(label as string)}
              contentStyle={{ 
                backgroundColor: 'var(--color-surface-dark)', 
                color: 'var(--color-on-dark)',
                borderRadius: '8px',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: 'var(--color-on-dark)' }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey as string} 
              stroke={color} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: color, stroke: 'var(--color-surface-dark)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
