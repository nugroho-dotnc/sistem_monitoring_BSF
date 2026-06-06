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
    <div className="card-base h-[400px] flex flex-col gap-md">
      <h3 className="text-display text-2xl text-ink">
        {title} <span className="text-base text-muted font-sans font-normal">({unit})</span>
      </h3>
      <div className="flex-1 w-full min-h-0">
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
                backgroundColor: 'var(--color-canvas-dark)', 
                color: 'var(--color-on-dark)',
                borderRadius: '8px',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,30,43,0.12)'
              }}
              itemStyle={{ color: 'var(--color-on-dark)' }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey as string} 
              stroke={color} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: color, stroke: 'var(--color-canvas-dark)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
