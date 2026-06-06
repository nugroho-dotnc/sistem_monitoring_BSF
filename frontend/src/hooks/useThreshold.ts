import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { ThresholdConfig } from '../types';

export const useThreshold = (uniqueCode: string | undefined) => {
  const [config, setConfig] = useState<ThresholdConfig | null>(null);
  const [localConfig, setLocalConfig] = useState<ThresholdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreshold = useCallback(async () => {
    if (!uniqueCode) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getThreshold(uniqueCode);
      setConfig(data);
      setLocalConfig(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch thresholds');
    } finally {
      setLoading(false);
    }
  }, [uniqueCode]);

  useEffect(() => {
    fetchThreshold();
  }, [fetchThreshold]);

  const isDirty = JSON.stringify(config) !== JSON.stringify(localConfig);

  const update = (updates: Partial<ThresholdConfig>) => {
    if (localConfig) {
      setLocalConfig({ ...localConfig, ...updates });
    }
  };

  const save = async () => {
    if (!uniqueCode || !localConfig) return;
    try {
      setSaving(true);
      setError(null);
      const data = await api.updateThreshold(uniqueCode, localConfig);
      setConfig(data);
      setLocalConfig(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save thresholds');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setLocalConfig(config);
    setError(null);
  };

  return {
    config: localConfig,
    loading,
    saving,
    error,
    isDirty,
    update,
    save,
    reset,
  };
};
