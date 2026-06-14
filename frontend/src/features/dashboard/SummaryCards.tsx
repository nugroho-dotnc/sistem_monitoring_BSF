import React from 'react';
import { Scale, TrendingUp, Utensils, Activity } from 'lucide-react';
import type { SensorReading } from '../../types';

interface SummaryCardsProps {
  feedingLogs: any[];
  weightLogs: any[];
  historicalData: SensorReading[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ feedingLogs, weightLogs }) => {
  // 1. Total Weight Gain (last vs first) & 2. Avg Daily Gain
  let weightGain = 0;
  let avgDailyGain = 0;
  let totalDays = 0;

  if (weightLogs.length >= 2) {
    const sorted = [...weightLogs].sort((a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime());
    const firstWeight = sorted[0].weight_gram;
    const lastWeight = sorted[sorted.length - 1].weight_gram;
    weightGain = lastWeight - firstWeight;

    const firstDate = new Date(sorted[0].weighed_at).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].weighed_at).getTime();
    totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (totalDays > 0) {
      avgDailyGain = weightGain / totalDays;
    }
  }

  // 4. Total Feed Given (all time, or within the weight log period?)
  // Let's assume total feed during the tracked period.
  const totalFeed = feedingLogs.reduce((sum, log) => sum + log.weight_gram, 0);

  // 3. FCR = total feed / weight gain
  let fcr = 0;
  let fcrColor = 'text-slate-900'; // default
  if (weightGain > 0) {
    fcr = totalFeed / weightGain;
    if (fcr < 3) {
      fcrColor = 'text-emerald-600';
    } else if (fcr >= 3 && fcr <= 5) {
      fcrColor = 'text-amber-600';
    } else {
      fcrColor = 'text-red-600';
    }
  }

  const cards = [
    {
      title: "Total Weight Gain",
      value: `${weightGain > 0 ? '+' : ''}${weightGain.toFixed(1)} g`,
      icon: <Scale size={20} className="text-blue-600" />,
      bg: "bg-blue-50",
      valColor: "text-slate-900"
    },
    {
      title: "Avg Daily Gain",
      value: `${avgDailyGain.toFixed(1)} g/day`,
      icon: <TrendingUp size={20} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      valColor: "text-slate-900"
    },
    {
      title: "FCR (Feed Conv Ratio)",
      value: weightGain > 0 ? `${fcr.toFixed(2)}x` : '-',
      icon: <Activity size={20} className={fcrColor} />,
      bg: "bg-slate-50",
      valColor: fcrColor
    },
    {
      title: "Total Feed Given",
      value: `${totalFeed.toFixed(1)} g`,
      icon: <Utensils size={20} className="text-amber-600" />,
      bg: "bg-amber-50",
      valColor: "text-slate-900"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${card.bg}`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 truncate">{card.title}</p>
            <h3 className={`text-xl font-bold font-mono truncate ${card.valColor}`}>{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};
