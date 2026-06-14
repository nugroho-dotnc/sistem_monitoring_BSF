import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { WeightModal } from './WeightModal';
import { Layout } from '../../components/Layout';
import type { Device } from '../../types';
import { AddDeviceModal } from '../../components/AddDeviceModal';

export const WeightPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

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

  const fetchLogs = async () => {
    if (!activeDeviceId) return;
    setIsLoading(true);
    try {
      const data = await api.getWeightLogs(activeDeviceId);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeDeviceId]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      try {
        await api.deleteWeightLog(activeDeviceId!, id);
        fetchLogs();
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data');
      }
    }
  };

  const handleEdit = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedLog(null);
    setIsModalOpen(true);
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
              Tambahkan perangkat kandang pertama Anda untuk mulai mencatat pertumbuhan maggot.
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

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8">
          
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Riwayat Berat Maggot</h1>
                <p className="text-slate-500 text-sm">Kelola data pertumbuhan berat maggot untuk {activeDevice?.location}</p>
              </div>
            </div>
            <button 
              onClick={handleAddNew}
              className="bg-brand-teal text-white font-semibold px-4 py-2 rounded-md hover:bg-teal-800 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Catat Timbang
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Waktu</th>
                    <th className="px-6 py-4 font-semibold">Berat (g)</th>
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Catatan</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        <div className="animate-pulse flex flex-col items-center gap-2">
                          <div className="h-4 w-24 bg-slate-200 rounded"></div>
                          <div className="text-sm">Memuat data...</div>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        Belum ada riwayat timbang.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {new Date(log.weighed_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 font-medium">
                          {log.weight_gram}
                        </td>
                        <td className="px-6 py-4 text-sm hidden md:table-cell text-slate-500 max-w-xs truncate">
                          {log.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(log)}
                              className="p-1.5 text-slate-400 hover:text-brand-teal hover:bg-teal-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(log.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </main>

        <WeightModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          deviceId={activeDeviceId || 0}
          existingData={selectedLog}
          onSuccess={fetchLogs}
        />
      
      <AddDeviceModal 
        isOpen={isAddDeviceOpen} 
        onClose={() => setIsAddDeviceOpen(false)} 
        onSuccess={handleDeviceAdded} 
      />
    </Layout>
  );
};
