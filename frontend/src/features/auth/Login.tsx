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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '8px' }}>Masuk Dashboard</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '32px' }}>
          Masukkan kode unik kandang untuk melihat data sensor.
        </p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Unique Code
            </label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="Contoh: BSF-001"
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div style={{ color: 'var(--color-error)', fontSize: '14px', textAlign: 'left' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="button-primary" 
            disabled={isLoading || !uniqueCode.trim()}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? 'Memverifikasi...' : 'Akses Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
