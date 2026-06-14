import React from 'react';

export interface InsightItem {
  color: 'green' | 'amber' | 'red' | 'blue';
  title: string;
  body: string;
}

interface AutoInsightPanelProps {
  insights: InsightItem[];
}

export const AutoInsightPanel: React.FC<AutoInsightPanelProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const colorMap = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
      <h3 className="font-semibold text-slate-900 mb-4">Auto Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${colorMap[insight.color]}`}></div>
            <div>
              <h4 className="text-sm font-medium text-slate-900">{insight.title}</h4>
              <p className="text-sm text-slate-500 mt-0.5">{insight.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
