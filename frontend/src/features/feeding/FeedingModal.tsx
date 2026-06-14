import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X } from 'lucide-react';

interface FeedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: number;
  existingData?: any;
  onSuccess: () => void;
}

export const FeedingModal: React.FC<FeedingModalProps> = ({ isOpen, onClose, deviceId, existingData, onSuccess }) => {
  const [formData, setFormData] = useState({
    fed_at: '',
    feed_type: 'Sisa sayuran',
    other_feed_type: '',
    weight_gram: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const feedOptions = ['Sisa sayuran', 'Ampas tahu', 'Dedak', 'Sisa buah', 'Lainnya'];

  useEffect(() => {
    if (existingData) {
      const isOther = !feedOptions.includes(existingData.feed_type) && existingData.feed_type !== 'Lainnya';
      setFormData({
        fed_at: new Date(existingData.fed_at).toISOString().slice(0, 16),
        feed_type: isOther ? 'Lainnya' : existingData.feed_type,
        other_feed_type: isOther ? existingData.feed_type : '',
        weight_gram: existingData.weight_gram.toString(),
        notes: existingData.notes || ''
      });
    } else {
      setFormData({
        fed_at: new Date().toISOString().slice(0, 16),
        feed_type: 'Sisa sayuran',
        other_feed_type: '',
        weight_gram: '',
        notes: ''
      });
    }
  }, [existingData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const finalFeedType = formData.feed_type === 'Lainnya' ? formData.other_feed_type : formData.feed_type;

    if (!finalFeedType) {
      setError('Jenis pakan harus diisi');
      setIsLoading(false);
      return;
    }

    const payload = {
      fed_at: new Date(formData.fed_at).toISOString(),
      feed_type: finalFeedType,
      weight_gram: parseFloat(formData.weight_gram),
      notes: formData.notes
    };

    try {
      if (existingData) {
        await api.updateFeedingLog(deviceId, existingData.id, payload);
      } else {
        await api.createFeedingLog(deviceId, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal menyimpan data pakan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{existingData ? 'Edit Data Pakan' : 'Catat Pakan Baru'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <form id="feeding-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Waktu Pemberian</label>
              <input 
                type="datetime-local" 
                name="fed_at"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                value={formData.fed_at}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Jenis Pakan</label>
              <select 
                name="feed_type"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                value={formData.feed_type}
                onChange={handleChange}
              >
                {feedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {formData.feed_type === 'Lainnya' && (
              <div>
                <label className="block mb-1.5 font-medium text-slate-700 text-sm">Sebutkan Jenis Pakan</label>
                <input 
                  type="text" 
                  name="other_feed_type"
                  className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                  placeholder="Misal: Limbah Roti"
                  value={formData.other_feed_type}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Berat Pakan (gram)</label>
              <input 
                type="number" 
                name="weight_gram"
                min="0"
                step="0.1"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                placeholder="Contoh: 500"
                value={formData.weight_gram}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Catatan (Opsional)</label>
              <textarea 
                name="notes"
                rows={3}
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors resize-none" 
                placeholder="Tambahkan catatan jika perlu..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-white transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            form="feeding-form"
            disabled={isLoading}
            className="px-5 py-2.5 bg-brand-teal text-white rounded-md font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 min-w-[120px]"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};
