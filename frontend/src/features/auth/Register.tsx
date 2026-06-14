import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

export const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    farm_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.farm_name || !formData.email) {
        setError('Harap isi Nama Peternakan dan Email');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Password tidak cocok');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      await api.register({
        farm_name: formData.farm_name,
        email: formData.email,
        password: formData.password
      });
      navigate('/login', { state: { message: 'Registrasi berhasil, silakan login.' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal registrasi, periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-[400px] shadow-sm">
        <h1 className="font-bold text-2xl mb-2 text-center text-slate-900">Daftar Akun</h1>
        <p className="text-slate-500 mb-6 text-sm text-center">
          Langkah {step} dari 2
        </p>
        
        {error && (
          <div className="text-red-500 text-sm font-medium mb-4 text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Nama Peternakan</label>
              <input 
                type="text" 
                name="farm_name"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                placeholder="Contoh: Maggot Berkah"
                value={formData.farm_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Email</label>
              <input 
                type="email" 
                name="email"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                placeholder="email@anda.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <button 
              onClick={nextStep}
              className="bg-brand-teal text-white font-semibold rounded-md px-6 py-2.5 mt-2 transition-colors hover:bg-teal-800 w-full"
            >
              Lanjut
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Password</label>
              <input 
                type="password" 
                name="password"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 font-medium text-slate-700 text-sm">Konfirmasi Password</label>
              <input 
                type="password" 
                name="confirm_password"
                className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
                placeholder="Ketik ulang password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                type="button"
                onClick={prevStep}
                className="border border-slate-300 text-slate-700 font-semibold rounded-md px-6 py-2.5 transition-colors hover:bg-slate-50 w-1/3"
              >
                Kembali
              </button>
              <button 
                type="submit" 
                className="bg-brand-teal text-white font-semibold rounded-md px-6 py-2.5 transition-colors hover:bg-teal-800 disabled:bg-slate-300 w-2/3" 
                disabled={isLoading}
              >
                {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun? <Link to="/login" className="text-brand-teal font-medium hover:underline">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
};
