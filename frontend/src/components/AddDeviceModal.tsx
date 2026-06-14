import React, { useState } from 'react';
import { api } from '../services/api';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (device: any) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ unique_code: '', location: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const device = await api.claimDevice(formData);
      onSuccess(device);
      setFormData({ unique_code: '', location: '' });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal menambahkan perangkat.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Tambah Perangkat</h2>
          <p className="text-slate-500 text-sm mt-1">
            Masukkan kode perangkat pada alat ESP32 Anda untuk menghubungkannya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 font-medium text-slate-700 text-sm">
              Tempat Kandang (Nama)
            </label>
            <input 
              type="text" 
              name="location"
              className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
              placeholder="Contoh: Kandang Area A"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-slate-700 text-sm">
              Kode Perangkat (Device Code)
            </label>
            <input 
              type="text" 
              name="unique_code"
              className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
              placeholder="Contoh: BSF-001"
              value={formData.unique_code}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoading || !formData.unique_code || !formData.location}
              className="flex-1 px-4 py-2.5 bg-brand-teal text-white rounded-md font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : 'Tambah Perangkat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
