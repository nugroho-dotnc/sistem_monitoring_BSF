import type { MetricConfig, MetricStatus, ThresholdConfig } from '../types';

export const METRICS: MetricConfig[] = [
  { key: 'temperature',     label: 'Temperature',     unit: '°C', safeMax: 32,   color: '#0F766E' },
  { key: 'humidity',        label: 'Humidity',        unit: '%',  safeMin: 50,   color: '#7C3AED' },
  { key: 'light_intensity', label: 'Light Intensity', unit: 'lux',safeMin: 2000, color: '#D97706' },
];

export function getStatus(key: string, value: number, thresholds?: ThresholdConfig | null): MetricStatus {
  if (!thresholds) return 'normal'; // Default fallback if config not loaded

  if (key === 'temperature') {
    if (value > thresholds.temp_critical) return 'critical';
    if (value > thresholds.temp_warning) return 'warning';
    return 'normal';
  }
  if (key === 'humidity') {
    if (value < thresholds.humid_critical) return 'critical';
    if (value < thresholds.humid_warning) return 'warning';
    return 'normal';
  }
  if (key === 'light_intensity') {
    if (value < thresholds.light_critical) return 'critical';
    if (value < thresholds.light_warning) return 'warning';
    return 'normal';
  }
  return 'normal';
}

export function getWorstStatus(statuses: MetricStatus[]): MetricStatus {
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'normal';
}
