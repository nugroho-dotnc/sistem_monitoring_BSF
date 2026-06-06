export interface Device {
  id: number;
  unique_code: string;
  name: string;
  location: string;
}

export interface SensorReading {
  id?: number;
  device_id?: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  light_intensity: number;
}

export type SensorLog = SensorReading; // Alias for backward compatibility if needed

export type MetricStatus = 'normal' | 'warning' | 'critical';

export interface MetricConfig {
  key: keyof Omit<SensorReading, 'timestamp' | 'id' | 'device_id'>;
  label: string;
  unit: string;
  safeMin?: number;
  safeMax?: number;
  color: string;
}

export * from './threshold';
