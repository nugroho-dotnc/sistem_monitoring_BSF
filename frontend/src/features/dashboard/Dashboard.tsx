import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Device, SensorReading } from '../../types';
import { METRICS, getStatus, getWorstStatus } from '../../utils/dashboard';
import { subHours, subDays, subMonths } from 'date-fns';
import { Plus } from 'lucide-react';

import { ConnectionBanner } from '../../components/ConnectionBanner';
import { AlertBanner } from '../../components/AlertBanner';
import { MetricGrid } from '../../components/MetricGrid';
import type { TimeRange } from '../../components/TimeRangeFilter';
import { useThreshold } from '../../hooks/useThreshold';
import { Layout } from '../../components/Layout';
import { AddDeviceModal } from '../../components/AddDeviceModal';
import { SummaryCards } from './SummaryCards';
import { FeedWeightChart } from './charts/FeedWeightChart';
import { MultiSensorChart } from './charts/MultiSensorChart';
import { ScatterCorrelationChart } from './charts/ScatterCorrelationChart';
import { AutoInsightPanel, type InsightItem } from './AutoInsightPanel';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);
  
  const [latestData, setLatestData] = useState<SensorReading | undefined>(undefined);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [feedingLogs, setFeedingLogs] = useState<any[]>([]);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [isConnectionLost, setIsConnectionLost] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  const activeDevice = devices.find(d => d.id === activeDeviceId) || null;
  const { config: thresholds } = useThreshold(activeDevice?.unique_code);

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

  // Polling logic for active device
  useEffect(() => {
    if (!activeDevice) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        let start: string | undefined = undefined;
        const now = new Date();
        switch (timeRange) {
          case '1h': start = subHours(now, 1).toISOString(); break;
          case '24h': start = subHours(now, 24).toISOString(); break;
          case '7d': start = subDays(now, 7).toISOString(); break;
          case '1m': start = subMonths(now, 1).toISOString(); break;
        }

        const [latest, history, feeds, weights] = await Promise.all([
          api.getLatestData(activeDevice.unique_code).catch(() => undefined),
          api.getHistoricalData(activeDevice.unique_code, start, undefined).catch(() => []),
          api.getFeedingLogs(activeDevice.id).catch(() => []),
          api.getWeightLogs(activeDevice.id).catch(() => [])
        ]);

        if (isMounted) {
          setLatestData(latest);
          setHistoricalData(history);
          setFeedingLogs(feeds);
          setWeightLogs(weights);
          setIsConnectionLost(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isMounted) {
          setIsConnectionLost(true);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeDevice, timeRange]);

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
              Tambahkan perangkat kandang pertama Anda untuk mulai memantau suhu, kelembaban, dan data maggot.
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

  // Determine overall status
  const statuses = latestData ? METRICS.map(m => getStatus(m.key, (latestData as any)[m.key], thresholds)) : [];
  const overallStatus = getWorstStatus(statuses);

  let statusMessage = "Semua kondisi dalam batas aman.";
  if (latestData) {
    if (overallStatus === 'critical') {
      const criticalMetrics = METRICS.filter(m => getStatus(m.key, (latestData as any)[m.key], thresholds) === 'critical').map(m => m.label);
      statusMessage = `${criticalMetrics.join(' dan ')} butuh perhatian segera!`;
    } else if (overallStatus === 'warning') {
      const warningMetrics = METRICS.filter(m => getStatus(m.key, (latestData as any)[m.key], thresholds) === 'warning').map(m => m.label);
      statusMessage = `${warningMetrics.join(' dan ')} mendekati batas.`;
    }
  }

  // Generate Auto Insights
  const generateInsights = () => {
    const insights: InsightItem[] = [];
    
    // 1. FCR Insight
    let weightGain = 0;
    if (weightLogs.length >= 2) {
      const sorted = [...weightLogs].sort((a, b) => new Date(a.weighed_at).getTime() - new Date(b.weighed_at).getTime());
      weightGain = sorted[sorted.length - 1].weight_gram - sorted[0].weight_gram;
    }
    const totalFeed = feedingLogs.reduce((sum, log) => sum + log.weight_gram, 0);
    
    if (weightGain > 0) {
      const fcr = totalFeed / weightGain;
      if (fcr < 3) {
        insights.push({ color: 'green', title: 'FCR Sangat Baik', body: `Rasio konversi pakan (FCR) saat ini adalah ${fcr.toFixed(2)}, menunjukkan efisiensi tinggi.` });
      } else if (fcr <= 5) {
        insights.push({ color: 'amber', title: 'FCR Menengah', body: `Rasio konversi pakan (FCR) berada di angka ${fcr.toFixed(2)}.` });
      } else {
        insights.push({ color: 'red', title: 'FCR Buruk (Boros)', body: `FCR mencapai ${fcr.toFixed(2)}. Periksa kembali kualitas pakan atau suhu lingkungan.` });
      }
    } else {
      insights.push({ color: 'blue', title: 'Belum Ada Data FCR', body: 'Tambahkan data berat minimal 2 kali untuk menghitung efisiensi pakan.' });
    }

    // 2. Temp insight
    if (latestData && thresholds) {
       if (latestData.temperature > thresholds.temp_critical) {
         insights.push({ color: 'red', title: 'Suhu Kritis', body: 'Suhu ruangan terlalu panas. Ini dapat menghambat pertumbuhan maggot atau menyebabkan kematian.' });
       } else if (latestData.temperature > thresholds.temp_warning) {
         insights.push({ color: 'amber', title: 'Suhu Peringatan', body: 'Suhu mendekati batas kritis. Pastikan sirkulasi udara berjalan baik.' });
       } else {
         insights.push({ color: 'green', title: 'Suhu Optimal', body: 'Suhu lingkungan saat ini sangat baik untuk mempercepat siklus maggot.' });
       }
    }

    // 3. Activity insight
    if (feedingLogs.length === 0) {
      insights.push({ color: 'amber', title: 'Peringatan Pakan', body: 'Belum ada pakan yang diberikan ke rak ini. Segera tambahkan catatan pakan.' });
    }

    return insights;
  };

  return (
    <Layout device={activeDevice}>
      <ConnectionBanner isVisible={isConnectionLost} />
      
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

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Zone 1: Alert Banner */}
        <AlertBanner type={latestData ? (overallStatus === 'critical' ? 'critical' : overallStatus === 'warning' ? 'warning' : 'ok') : 'ok'} message={statusMessage} />

        {/* Zone 2: Live Sensor Cards */}
        <MetricGrid 
          latestData={latestData || null} 
          historyData={historicalData} 
          thresholds={thresholds} 
        />

        {/* Zone 3: Weekly KPI Row */}
        <SummaryCards 
          feedingLogs={feedingLogs} 
          weightLogs={weightLogs} 
          historicalData={historicalData} 
        />

        {/* Zone 4: Analytics Charts */}
        <div className="flex flex-col">
          <FeedWeightChart 
            feedingLogs={feedingLogs} 
            weightLogs={weightLogs} 
          />
          <MultiSensorChart 
            data={historicalData}
            thresholds={thresholds}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
        
        <ScatterCorrelationChart 
          feedingLogs={feedingLogs} 
          weightLogs={weightLogs} 
          historicalData={historicalData} 
        />

        {/* Zone 5: Auto Insight Panel */}
        <AutoInsightPanel insights={generateInsights()} />

        {lastUpdated && (
          <div className="text-center text-xs text-slate-400 mt-8">
            Terakhir diupdate: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </main>

      <AddDeviceModal 
        isOpen={isAddDeviceOpen} 
        onClose={() => setIsAddDeviceOpen(false)} 
        onSuccess={handleDeviceAdded} 
      />
    </Layout>
  );
};

