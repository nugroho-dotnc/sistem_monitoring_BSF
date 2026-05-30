export interface Device {
  id: number;
  unique_code: string;
  name: string;
  location: string;
}

export interface SensorLog {
  id: number;
  device_id: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  light_intensity: number;
}
