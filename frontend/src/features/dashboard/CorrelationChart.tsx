import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
  Legend
} from 'recharts';

interface CorrelationChartProps {
  weightLogs: any[];
  feedingLogs: any[];
}

export const CorrelationChart: React.FC<CorrelationChartProps> = ({ weightLogs, feedingLogs }) => {
  // We need to merge weight and feeding data onto a unified timeline.
  // Group by date (YYYY-MM-DD) for simplicity, or just plot raw timestamps if there aren't too many.
  // Using raw timestamps sorted chronologically is better for precise scatter plot overlay.

  // 1. Gather all unique timestamps from both logs
  const allTimestamps = new Set<number>();
  weightLogs.forEach(log => allTimestamps.add(new Date(log.weighed_at).getTime()));
  feedingLogs.forEach(log => allTimestamps.add(new Date(log.fed_at).getTime()));

  // 2. Sort timestamps
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // 3. Build data array
  // Recharts needs an array of objects.
  let lastWeight: number | null = null;
  
  const chartData = sortedTimestamps.map(time => {
    const timeDate = new Date(time);
    const dateStr = timeDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Find if there's a weight at this exact time
    const weightEntry = weightLogs.find(w => new Date(w.weighed_at).getTime() === time);
    if (weightEntry) {
      lastWeight = weightEntry.weight_gram;
    }

    // Find if there's a feeding at this exact time
    const feedEntry = feedingLogs.find(f => new Date(f.fed_at).getTime() === time);
    
    return {
      time,
      dateStr,
      weight: lastWeight, // Carries forward the last known weight for a continuous line
      actualWeight: weightEntry ? weightEntry.weight_gram : undefined, // Just for tooltip/scatter
      feedWeight: feedEntry ? feedEntry.weight_gram : undefined,
      feedType: feedEntry ? feedEntry.feed_type : undefined,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-center h-[300px]">
        <p className="text-slate-500">Belum ada data timbang atau pakan untuk membuat grafik.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
          <p className="text-sm font-bold text-slate-800 mb-2">{data.dateStr}</p>
          {data.actualWeight !== undefined && (
            <p className="text-sm text-emerald-600 font-medium">Berat: {data.actualWeight} g</p>
          )}
          {data.feedWeight !== undefined && (
            <p className="text-sm text-amber-600 font-medium">Pakan: {data.feedWeight} g ({data.feedType})</p>
          )}
          {data.actualWeight === undefined && data.feedWeight === undefined && data.weight !== undefined && (
            <p className="text-sm text-slate-500">Estimasi Berat: {data.weight} g</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Korelasi Pertumbuhan & Pakan</h3>
      <p className="text-sm text-slate-500 mb-6">Melihat efek pemberian pakan terhadap kenaikan berat maggot.</p>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="dateStr" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#64748B' }}
              tickFormatter={(value) => `${value}g`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            
            {/* The continuous line connecting weights */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="weight" 
              name="Berat Maggot (g)"
              stroke="#059669" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls
            />

            {/* Scatter points for exact weigh-ins */}
            <Scatter 
              yAxisId="left"
              name="Timbang" 
              dataKey="actualWeight" 
              fill="#059669" 
            />

            {/* Scatter points for feeding events on the same axis or fixed at bottom */}
            {/* We map feedWeight just to show a dot. To keep it visible, we can just map it to the current weight */}
            <Scatter 
              yAxisId="left"
              name="Diberi Pakan" 
              dataKey="feedWeight" 
              fill="#D97706" 
              shape="triangle"
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
