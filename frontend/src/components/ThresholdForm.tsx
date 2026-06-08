import React, { useState, useEffect } from 'react';
import type { ThresholdConfig } from '../types';
import { getStatus } from '../utils/dashboard';

interface ThresholdFormProps {
  config: ThresholdConfig;
  currentReadings?: Record<string, number>;
  onUpdate: (updates: Partial<ThresholdConfig>) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  isDirty: boolean;
  saving: boolean;
}

interface FieldConfig {
  metric: string;
  label: string;
  unit: string;
  warnKey: keyof Omit<ThresholdConfig, 'updated_at'>;
  critKey: keyof Omit<ThresholdConfig, 'updated_at'>;
  min: number;
  max: number;
  step: number;
  safeDirection: 'below' | 'above';
}

const FIELDS: FieldConfig[] = [
  { metric: 'temperature', label: 'Temperature', unit: '°C', warnKey: 'temp_warning', critKey: 'temp_critical', min: 0, max: 60, step: 0.1, safeDirection: 'below' },
  { metric: 'humidity', label: 'Humidity', unit: '%', warnKey: 'humid_warning', critKey: 'humid_critical', min: 0, max: 100, step: 1, safeDirection: 'above' },
  { metric: 'light_intensity', label: 'Light Intensity', unit: '%', warnKey: 'light_warning', critKey: 'light_critical', min: 0, max: 100, step: 1, safeDirection: 'below' },
];

export const ThresholdForm: React.FC<ThresholdFormProps> = ({ config, currentReadings, onUpdate, onSave, onReset, isDirty, saving }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (updatedConfig: ThresholdConfig) => {
    const newErrors: Record<string, string> = {};
    if (updatedConfig.temp_warning >= updatedConfig.temp_critical) {
      newErrors.temperature = 'Warning must be strictly less than Critical for Temperature.';
    }
    if (updatedConfig.humid_warning <= updatedConfig.humid_critical) {
      newErrors.humidity = 'Warning must be strictly greater than Critical for Humidity.';
    }
    if (updatedConfig.light_warning >= updatedConfig.light_critical) {
      newErrors.light_intensity = 'Warning must be strictly less than Critical for Light Intensity.';
    }
    setErrors(newErrors);
  };

  useEffect(() => {
    validate(config);
  }, [config]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (key: keyof ThresholdConfig, value: number) => {
    const updated = { ...config, [key]: value };
    onUpdate({ [key]: value });
    validate(updated);
  };

  const renderSection = (field: FieldConfig) => {
    const currentVal = currentReadings ? currentReadings[field.metric] : undefined;
    const currentStatus = currentVal !== undefined ? getStatus(field.metric, currentVal, config) : null;
    
    return (
      <div key={field.metric} className="card-base mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">{field.label} Configuration</h2>
          {currentVal !== undefined && currentStatus && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="text-sm text-slate-500">Current: {currentVal} {field.unit}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                currentStatus === 'critical' ? 'bg-red-100 text-red-700' :
                currentStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {currentStatus.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {errors[field.metric] && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {errors[field.metric]}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Warning Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Warning Threshold</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input 
                type="range" 
                min={field.min} max={field.max} step={field.step}
                value={config[field.warnKey]}
                onChange={(e) => handleChange(field.warnKey, Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="relative w-full sm:w-24 shrink-0">
                <input 
                  type="number"
                  min={field.min} max={field.max} step={field.step}
                  value={config[field.warnKey]}
                  onChange={(e) => handleChange(field.warnKey, Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">{field.unit}</span>
              </div>
            </div>
          </div>

          {/* Critical Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Critical Threshold</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input 
                type="range" 
                min={field.min} max={field.max} step={field.step}
                value={config[field.critKey]}
                onChange={(e) => handleChange(field.critKey, Number(e.target.value))}
                className="w-full accent-red-500"
              />
              <div className="relative w-full sm:w-24 shrink-0">
                <input 
                  type="number"
                  min={field.min} max={field.max} step={field.step}
                  value={config[field.critKey]}
                  onChange={(e) => handleChange(field.critKey, Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">{field.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {FIELDS.map(renderSection)}
      
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white border-t border-slate-200 p-4 rounded-xl shadow-sm mt-8 gap-4">
        <div className="text-sm text-slate-500">
          Last saved: {new Date(config.updated_at).toLocaleString()}
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          {isDirty && (
            <button 
              onClick={onReset}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors w-full sm:w-auto"
            >
              Reset
            </button>
          )}
          <button 
            onClick={onSave}
            disabled={!isDirty || hasErrors || saving}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors w-full sm:w-auto flex justify-center items-center ${
              !isDirty || hasErrors ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#0F766E] hover:bg-[#0D655E]'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Save & sync to device'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
