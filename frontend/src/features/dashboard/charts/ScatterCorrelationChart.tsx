import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line
} from 'recharts';
import { format, startOfDay } from 'date-fns';
import type { SensorReading } from '../../../types';

interface ScatterCorrelationChartProps {
  feedingLogs: any[];
  weightLogs: any[];
  historicalData: SensorReading[];
}

function linearRegression(data: {x: number, y: number}[]) {
  const n = data.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const point of data) {
    ssTot += Math.pow(point.y - meanY, 2);
    const predictedY = slope * point.x + intercept;
    ssRes += Math.pow(point.y - predictedY, 2);
  }
  const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  return { slope, intercept, rSquared };
}

export const ScatterCorrelationChart: React.FC<ScatterCorrelationChartProps> = ({ feedingLogs, weightLogs, historicalData }) => {
  const { scatterData, regressionLine, rSquared } = useMemo(() => {
    // 1. Group everything by day
    const dailyData = new Map<string, { feed: number; weight: number | null; avgTemp: number | null }>();
    
    // Group feeds
    feedingLogs.forEach(log => {
      const dateStr = format(new Date(log.fed_at), 'yyyy-MM-dd');
      if (!dailyData.has(dateStr)) dailyData.set(dateStr, { feed: 0, weight: null, avgTemp: null });
      dailyData.get(dateStr)!.feed += log.weight_gram;
    });

    // Group weights
    const sortedWeights = [...weightLogs].sort((a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime());
    sortedWeights.forEach(log => {
      const dateStr = format(new Date(log.weighed_at), 'yyyy-MM-dd');
      if (!dailyData.has(dateStr)) dailyData.set(dateStr, { feed: 0, weight: null, avgTemp: null });
      dailyData.get(dateStr)!.weight = log.weight_gram;
    });

    // Group temperature (calculate daily average)
    const tempSumByDay = new Map<string, { sum: number; count: number }>();
    historicalData.forEach(d => {
      const dateStr = format(new Date(d.timestamp), 'yyyy-MM-dd');
      if (!tempSumByDay.has(dateStr)) tempSumByDay.set(dateStr, { sum: 0, count: 0 });
      const current = tempSumByDay.get(dateStr)!;
      current.sum += d.temperature;
      current.count += 1;
    });

    tempSumByDay.forEach((val, dateStr) => {
      if (dailyData.has(dateStr)) {
        dailyData.get(dateStr)!.avgTemp = val.sum / val.count;
      }
    });

    // Calculate daily weight gain
    // We need an array of sorted dates to find the "previous" weight
    const sortedDates = Array.from(dailyData.keys()).sort();
    let previousWeight: number | null = null;
    
    const points: { x: number; y: number; temp: number; date: string }[] = [];

    sortedDates.forEach(dateStr => {
      const day = dailyData.get(dateStr)!;
      let dailyGain = 0;
      
      if (day.weight !== null) {
        if (previousWeight !== null) {
          dailyGain = day.weight - previousWeight;
        }
        previousWeight = day.weight;
      }

      // Only plot if there was feed given OR we measured a gain
      if ((day.feed > 0 || dailyGain > 0) && day.avgTemp !== null) {
        points.push({
          x: day.feed,
          y: dailyGain,
          temp: day.avgTemp,
          date: dateStr
        });
      }
    });

    // 2. Compute Linear Regression
    const coords = points.map(p => ({ x: p.x, y: p.y }));
    const reg = linearRegression(coords);
    let lineData: any[] = [];
    
    if (reg && points.length >= 2) {
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      lineData = [
        { x: minX, y: reg.slope * minX + reg.intercept },
        { x: maxX, y: reg.slope * maxX + reg.intercept }
      ];
    }

    return { scatterData: points, regressionLine: lineData, rSquared: reg?.rSquared || 0 };
  }, [feedingLogs, weightLogs, historicalData]);

  const getColorByTemp = (temp: number) => {
    if (temp < 25) return '#3b82f6'; // blue
    if (temp <= 30) return '#10b981'; // green
    if (temp <= 35) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // Skip tooltip for the trendline points
      if (!data.date) return null;
      
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-semibold text-slate-900 mb-2">{format(new Date(data.date), 'dd MMM yyyy')}</p>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Pakan:</span>
            <span className="font-medium text-slate-900">{data.x.toFixed(1)} g</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Gain:</span>
            <span className="font-medium text-slate-900">{data.y.toFixed(1)} g</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Suhu:</span>
            <span className="font-medium text-slate-900" style={{ color: getColorByTemp(data.temp) }}>
              {data.temp.toFixed(1)} °C
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-slate-900">Efisiensi Pakan & Suhu</h3>
          <p className="text-sm text-slate-500">Pola sebaran gain vs pakan, diwarnai berdasar suhu</p>
        </div>
        {rSquared > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-md px-3 py-1 text-xs font-mono text-slate-600">
            R² = {rSquared.toFixed(3)}
          </div>
        )}
      </div>

      <div className="h-80 w-full">
        {scatterData.length < 2 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Dibutuhkan minimal 2 data hari untuk melihat korelasi.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Pakan" 
                unit="g"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Gain" 
                unit="g"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              
              <Scatter name="Korelasi" data={scatterData} fill="#8884d8">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorByTemp(entry.temp)} />
                ))}
              </Scatter>
              
              {regressionLine.length === 2 && (
                <Line 
                  dataKey="y" 
                  data={regressionLine} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Legend Suhu */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-600">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> &lt;25°C</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> 25-30°C</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> 30-35°C</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> &gt;35°C</div>
      </div>
    </div>
  );
};
