import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { type Device, type SensorLog } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { ChartCard } from '../../components/ChartCard';
import { subYears, subMonths, subDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [latestData, setLatestData] = useState<SensorLog | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorLog[]>([]);
  const [timeFilter, setTimeFilter] = useState('all');

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('device');
    navigate('/');
  };

  // Load Initial Device
  useEffect(() => {
    const saved = localStorage.getItem('device');
    if (!saved) {
      navigate('/');
      return;
    }
    setDevice(JSON.parse(saved));
  }, [navigate]);

  // Polling Latest Data (Every 5 seconds)
  useEffect(() => {
    if (!device) return;

    const fetchLatest = async () => {
      try {
        const data = await api.getLatestData(device.unique_code);
        setLatestData(data);
      } catch (err) {
        console.error("Gagal mengambil data terbaru", err);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, [device]);

  // Fetch Historical Data
  useEffect(() => {
    if (!device) return;

    const fetchHistory = async () => {
      try {
        let start: string | undefined = undefined;
        const now = new Date();
        
        switch (timeFilter) {
          case '1y': start = subYears(now, 1).toISOString(); break;
          case '6m': start = subMonths(now, 6).toISOString(); break;
          case '3m': start = subMonths(now, 3).toISOString(); break;
          case '1m': start = subMonths(now, 1).toISOString(); break;
          case '7d': start = subDays(now, 7).toISOString(); break;
          case 'all': default: start = undefined; break;
        }
        
        const data = await api.getHistoricalData(device.unique_code, start, undefined);
        setHistoricalData(data);
      } catch (err) {
        console.error("Gagal mengambil histori", err);
      }
    };

    fetchHistory();
    // Refresh history every 30s
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [device, timeFilter]);

  if (!device) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="text-display" style={{ fontSize: '36px', color: 'var(--color-primary)' }}>
            Smart Maggot Farming
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>
            Kandang: {device.name} • {device.location}
          </p>
        </div>
        <button onClick={handleLogout} className="button-primary" style={{ backgroundColor: 'var(--color-surface-dark)' }}>
          Keluar
        </button>
      </header>

      {/* Real-time Metrics */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 className="text-display" style={{ fontSize: '28px', marginBottom: 'var(--spacing-md)' }}>Pemantauan Real-time</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <MetricCard 
            title="Suhu" 
            value={latestData?.temperature ?? '-'} 
            unit="°C" 
            isWarning={latestData ? (latestData.temperature > 32 || latestData.temperature < 24) : false}
          />
          <MetricCard 
            title="Kelembaban" 
            value={latestData?.humidity ?? '-'} 
            unit="%" 
            isWarning={latestData ? (latestData.humidity > 80 || latestData.humidity < 50) : false}
          />
          <MetricCard 
            title="Intensitas Cahaya" 
            value={latestData?.light_intensity ?? '-'} 
            unit="ADC" 
          />
        </div>
      </section>

      {/* Historical Charts */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
          <h2 className="text-display" style={{ fontSize: '28px' }}>Grafik Historis</h2>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-muted)' }}>Rentang Waktu</label>
              <select 
                className="text-input" 
                style={{ height: '32px', fontSize: '14px', minWidth: '150px' }}
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
              >
                <option value="all">Semua Data</option>
                <option value="1y">1 Tahun Terakhir</option>
                <option value="6m">6 Bulan Terakhir</option>
                <option value="3m">3 Bulan Terakhir</option>
                <option value="1m">1 Bulan Terakhir</option>
                <option value="7d">7 Hari Terakhir</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)' }}>
          <ChartCard 
            title="Tren Suhu" 
            data={historicalData} 
            dataKey="temperature" 
            color="#cc785c" 
            unit="°C" 
          />
          <ChartCard 
            title="Tren Kelembaban" 
            data={historicalData} 
            dataKey="humidity" 
            color="#5db8a6" 
            unit="%" 
          />
        </div>
      </section>
    </div>
  );
};
