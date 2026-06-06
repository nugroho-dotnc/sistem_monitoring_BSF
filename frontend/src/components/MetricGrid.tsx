import React from 'react';
import { MetricCard } from './MetricCard';
import { METRICS } from '../utils/dashboard';
import type { SensorReading, ThresholdConfig } from '../types';

interface MetricGridProps {
  latestData: SensorReading | null;
  historyData: SensorReading[];
  thresholds?: ThresholdConfig | null;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ latestData, historyData, thresholds }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {METRICS.map(config => (
        <MetricCard
          key={config.key}
          config={config}
          value={latestData ? Number(latestData[config.key]) : 0}
          history={historyData}
          thresholds={thresholds}
        />
      ))}
    </div>
  );
};
