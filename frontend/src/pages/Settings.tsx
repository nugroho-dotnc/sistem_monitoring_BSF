import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreshold } from '../hooks/useThreshold';
import { ThresholdForm } from '../components/ThresholdForm';
import { api } from '../services/api';
import { Layout } from '../components/Layout';
import type { Device } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { AddDeviceModal } from '../components/AddDeviceModal';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);
  
  const [latestReadings, setLatestReadings] = useState<Record<string, number>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  // Load Devices
  useEffect(() => {
    const fetchDevices = async () => {
      setIsLoadingDevices(true);
      try {
        const userDevices = await api.getUserDevices();
        setDevices(userDevices);
        if (userDevices.length > 0) {
          const savedId = sessionStorage.getItem('activeDeviceId');
          const exists = userDevices.some(d => d.id.toString() === savedId);
          if (exists && savedId) {
            setActiveDeviceId(parseInt(savedId));
          } else {
            setActiveDeviceId(userDevices[0].id);
            sessionStorage.setItem('activeDeviceId', userDevices[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch devices", err);
      } finally {
        setIsLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  const handleDeviceChange = (id: number) => {
    setActiveDeviceId(id);
    sessionStorage.setItem('activeDeviceId', id.toString());
  };

  const activeDevice = devices.find(d => d.id === activeDeviceId) || null;

  // Fetch latest readings for preview when active device changes
  useEffect(() => {
    if (!activeDevice) return;
    
    api.getLatestData(activeDevice.unique_code).then(data => {
      setLatestReadings({
        temperature: data.temperature,
        humidity: data.humidity,
        light_intensity: data.light_intensity
      });
    }).catch(() => {
      setLatestReadings({}); // Ignore if we can't fetch latest data
    });
  }, [activeDevice]);

  const { config, loading, error, isDirty, saving, update, save, reset } = useThreshold(activeDevice?.unique_code);

  const handleSave = async () => {
    try {
      await save();
      setSuccessMsg(`Thresholds updated and synced to ${activeDevice?.unique_code}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      // Error is handled in useThreshold
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDevice = async () => {
    if (!activeDevice) return;
    const confirm = window.confirm(`Apakah Anda yakin ingin menghapus kandang "${activeDevice.name}"? Perangkat ini akan dilepas dari akun Anda.`);
    if (!confirm) return;

    setIsDeleting(true);
    try {
      await api.deleteDevice(activeDevice.id);
      
      const newDevices = devices.filter(d => d.id !== activeDevice.id);
      setDevices(newDevices);
      
      if (newDevices.length > 0) {
        setActiveDeviceId(newDevices[0].id);
        sessionStorage.setItem('activeDeviceId', newDevices[0].id.toString());
      } else {
        setActiveDeviceId(null);
        sessionStorage.removeItem('activeDeviceId');
      }
      
      setSuccessMsg(`Kandang ${activeDevice.name} berhasil dilepas dari akun.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus kandang');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeviceAdded = (newDevice: Device) => {
    setDevices([...devices, newDevice]);
    setActiveDeviceId(newDevice.id);
    sessionStorage.setItem('activeDeviceId', newDevice.id.toString());
  };

  if (isLoadingDevices) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  // Empty State
  if (devices.length === 0) {
    return (
      <Layout device={null as any}>
        <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md text-center">
            <div className="bg-teal-100 text-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Belum Ada Perangkat</h2>
            <p className="text-slate-500 mb-8">
              Tambahkan perangkat kandang pertama Anda untuk mulai mengatur threshold.
            </p>
            <button 
              onClick={() => setIsAddDeviceOpen(true)}
              className="bg-brand-teal text-white font-semibold px-6 py-3 rounded-lg hover:bg-teal-800 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Tambah Perangkat Pertama
            </button>
          </div>
        </div>
        <AddDeviceModal 
          isOpen={isAddDeviceOpen} 
          onClose={() => setIsAddDeviceOpen(false)} 
          onSuccess={handleDeviceAdded} 
        />
      </Layout>
    );
  }

  return (
    <Layout device={activeDevice as any}>
      {/* Device Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 py-3">
            {devices.map(d => (
              <button
                key={d.id}
                onClick={() => handleDeviceChange(d.id)}
                className={`px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors ${
                  activeDeviceId === d.id 
                    ? 'bg-brand-teal text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.location}
              </button>
            ))}
            <button
              onClick={() => setIsAddDeviceOpen(true)}
              className="px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap text-brand-teal bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Threshold Settings</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Define warning and critical thresholds for cage <strong className="text-slate-700">{activeDevice?.unique_code}</strong>. 
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
          <>
            <ThresholdForm 
              config={config} 
              currentReadings={latestReadings}
              onUpdate={update}
              onSave={handleSave}
              onReset={reset}
              isDirty={isDirty}
              saving={saving}
            />

            {/* Danger Zone */}
            <div className="mt-12 bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                  <Trash2 size={20} />
                  Zona Berbahaya (Hapus Kandang)
                </h3>
                <p className="text-slate-600 mb-6 text-sm">
                  Menghapus kandang akan melepas perangkat <strong>{activeDevice?.unique_code}</strong> dari akun Anda. 
                  Anda dapat menambahkannya kembali nanti menggunakan menu tambah perangkat.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={handleDeleteDevice}
                    disabled={isDeleting}
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Menghapus...' : 'Hapus Kandang Ini'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
      
      <AddDeviceModal 
        isOpen={isAddDeviceOpen} 
        onClose={() => setIsAddDeviceOpen(false)} 
        onSuccess={handleDeviceAdded} 
      />
    </Layout>
  );
};
