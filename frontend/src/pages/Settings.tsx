import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreshold } from '../hooks/useThreshold';
import { ThresholdForm } from '../components/ThresholdForm';
import { api } from '../services/api';
import { Layout } from '../components/Layout';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [device, setDevice] = useState<any>(null);
  const [latestReadings, setLatestReadings] = useState<Record<string, number>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('device');
    if (!saved) {
      navigate('/');
      return;
    }
    const parsedDevice = JSON.parse(saved);
    setDevice(parsedDevice);
    
    // Fetch latest data for preview
    api.getLatestData(parsedDevice.unique_code).then(data => {
      setLatestReadings({
        temperature: data.temperature,
        humidity: data.humidity,
        light_intensity: data.light_intensity
      });
    }).catch(() => {
      // Ignore if we can't fetch latest data
    });
  }, [navigate]);

  const { config, loading, error, isDirty, saving, update, save, reset } = useThreshold(device?.unique_code);

  const handleSave = async () => {
    try {
      await save();
      setSuccessMsg(`Thresholds updated and synced to ${device?.unique_code}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      // Error is handled in useThreshold
    }
  };

  if (!device) return null;

  return (
    <Layout device={device}>
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Threshold Settings</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Define warning and critical thresholds for cage <strong className="text-slate-700">{device.unique_code}</strong>. 
            Changes are saved to the database and sent to the device automatically.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg transition-all duration-300">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#0F766E]/20 border-t-[#0F766E] rounded-full animate-spin"></div>
          </div>
        ) : config ? (
          <ThresholdForm 
            config={config} 
            currentReadings={latestReadings}
            onUpdate={update}
            onSave={handleSave}
            onReset={reset}
            isDirty={isDirty}
            saving={saving}
          />
        ) : null}
      </main>
    </Layout>
  );
};
