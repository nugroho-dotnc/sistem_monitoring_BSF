import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export const Login: React.FC = () => {
  const [uniqueCode, setUniqueCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const device = await api.verifyDevice(uniqueCode);
      localStorage.setItem('device', JSON.stringify(device));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal login, periksa kembali kode Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-[400px] text-center shadow-sm">
        <h1 className="font-bold text-2xl mb-2 text-slate-900">Masuk Dashboard</h1>
        <p className="text-slate-500 mb-8 text-sm">
          Masukkan kode unik kandang untuk melihat data sensor.
        </p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block mb-1.5 font-medium text-slate-700 text-sm">
              Unique Code
            </label>
            <input 
              type="text" 
              className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
              placeholder="Contoh: BSF-001"
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="bg-brand-teal text-white font-semibold rounded-md px-6 py-2.5 mt-2 transition-colors hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer w-full" 
            disabled={isLoading || !uniqueCode.trim()}
          >
            {isLoading ? 'Memverifikasi...' : 'Akses Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
