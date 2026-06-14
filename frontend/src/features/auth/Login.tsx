import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);

  const message = location.state?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append('username', formData.email);
      form.append('password', formData.password);
      
      const response = await api.login(form);
      setAuth(response.access_token, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal login, periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-[400px] shadow-sm">
        <h1 className="font-bold text-2xl mb-2 text-center text-slate-900">Masuk Akun</h1>
        <p className="text-slate-500 mb-6 text-sm text-center">
          Masuk ke dashboard peternakan Anda.
        </p>
        
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm font-medium text-center border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block mb-1.5 font-medium text-slate-700 text-sm">
              Email
            </label>
            <input 
              type="email" 
              name="email"
              className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
              placeholder="email@anda.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-slate-700 text-sm">
              Password
            </label>
            <input 
              type="password" 
              name="password"
              className="bg-white text-slate-900 font-normal rounded-md px-3.5 py-2.5 border border-slate-300 outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal w-full transition-colors" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="bg-brand-teal text-white font-semibold rounded-md px-6 py-2.5 mt-2 transition-colors hover:bg-teal-800 disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer w-full" 
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun? <Link to="/register" className="text-brand-teal font-medium hover:underline">Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
};
