import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface FeedWeightChartProps {
  feedingLogs: any[];
  weightLogs: any[];
}

type TimeFilter = '7d' | '14d' | '30d';

export const FeedWeightChart: React.FC<FeedWeightChartProps> = ({ feedingLogs, weightLogs }) => {
  const [filter, setFilter] = useState<TimeFilter>('7d');

  const chartData = useMemo(() => {
    const daysToSubtract = filter === '7d' ? 7 : filter === '14d' ? 14 : 30;
    const startDate = startOfDay(subDays(new Date(), daysToSubtract));

    // Create a map of dates to aggregate data
    const dailyData = new Map<string, { date: string; feed: number; weight: number | null }>();

    // Initialize map with all days in range
    for (let i = 0; i <= daysToSubtract; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      dailyData.set(dateStr, { date: dateStr, feed: 0, weight: null });
    }

    // Aggregate feed
    feedingLogs.forEach(log => {
      const dateStr = format(new Date(log.fed_at), 'yyyy-MM-dd');
      if (dailyData.has(dateStr)) {
        const current = dailyData.get(dateStr)!;
        current.feed += log.weight_gram;
      }
    });

    // Aggregate weight (take the last weight of the day if multiple)
    const sortedWeights = [...weightLogs].sort((a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime());
    sortedWeights.forEach(log => {
      const dateStr = format(new Date(log.weighed_at), 'yyyy-MM-dd');
      if (dailyData.has(dateStr)) {
        const current = dailyData.get(dateStr)!;
        current.weight = log.weight_gram;
      }
    });

    return Array.from(dailyData.values()).map(d => ({
      ...d,
      displayDate: format(new Date(d.date), 'dd MMM')
    }));
  }, [feedingLogs, weightLogs, filter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-semibold text-slate-900">Pertumbuhan vs Pakan</h3>
          <p className="text-sm text-slate-500">Korelasi antara pakan harian dan berat maggot</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(['7d', '14d', '30d'] as TimeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === t ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#3b82f6"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              label={{ value: 'Pakan (g)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 12 } }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#0f766e"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              label={{ value: 'Berat (g)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#0f766e', fontSize: 12 } }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar yAxisId="left" dataKey="feed" name="Pakan Harian (g)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="weight" name="Berat Maggot (g)" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
