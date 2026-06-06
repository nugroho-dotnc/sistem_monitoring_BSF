export interface ThresholdConfig {
  temp_warning: number;
  temp_critical: number;
  humid_warning: number;
  humid_critical: number;
  light_warning: number;
  light_critical: number;
  updated_at: string;
}

export interface ThresholdField {
  key: keyof Omit<ThresholdConfig, 'updated_at'>;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  safeDirection: 'below' | 'above'; // 'below' = lower is safer (temp), 'above' = higher is safer (humid/light)
}
