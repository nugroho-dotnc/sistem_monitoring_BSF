import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Device, SensorReading } from '../../types';
import { METRICS, getStatus, getWorstStatus } from '../../utils/dashboard';
import { subHours, subDays, subMonths } from 'date-fns';

import { ConnectionBanner } from '../../components/ConnectionBanner';
import { StatusBanner } from '../../components/StatusBanner';
import { MetricGrid } from '../../components/MetricGrid';
import { HistorySection } from '../../components/HistorySection';
import type { TimeRange } from '../../components/TimeRangeFilter';
import { useThreshold } from '../../hooks/useThreshold';
import { Layout } from '../../components/Layout';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [latestData, setLatestData] = useState<SensorReading | undefined>(undefined);
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [isConnectionLost, setIsConnectionLost] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { config: thresholds } = useThreshold(device?.unique_code);

  // Load Initial Device
  useEffect(() => {
    const saved = localStorage.getItem('device');
    if (!saved) {
      navigate('/');
      return;
    }
    setDevice(JSON.parse(saved));
  }, [navigate]);

  // Polling logic
  useEffect(() => {
    if (!device) return;
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Calculate start time based on timeRange
        let start: string | undefined = undefined;
        const now = new Date();
        switch (timeRange) {
          case '1h': start = subHours(now, 1).toISOString(); break;
          case '24h': start = subHours(now, 24).toISOString(); break;
          case '7d': start = subDays(now, 7).toISOString(); break;
          case '1m': start = subMonths(now, 1).toISOString(); break;
        }

        // Fetch concurrently
        const [latest, history] = await Promise.all([
          api.getLatestData(device.unique_code),
          api.getHistoricalData(device.unique_code, start, undefined)
        ]);

        if (isMounted) {
          setLatestData(latest);
          setHistoricalData(history);
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
  }, [device, timeRange]);

  if (!device) return null;

  // Determine overall status
  const statuses = latestData ? METRICS.map(m => getStatus(m.key, latestData[m.key], thresholds)) : [];
  const overallStatus = getWorstStatus(statuses);

  let statusMessage = "All conditions are within safe range.";
  if (latestData) {
    if (overallStatus === 'critical') {
      const criticalMetrics = METRICS.filter(m => getStatus(m.key, latestData[m.key], thresholds) === 'critical').map(m => m.label);
      statusMessage = `Critical: ${criticalMetrics.join(' and ')} require${criticalMetrics.length > 1 ? '' : 's'} immediate attention.`;
    } else if (overallStatus === 'warning') {
      const warningMetrics = METRICS.filter(m => getStatus(m.key, latestData[m.key], thresholds) === 'warning').map(m => m.label);
      statusMessage = `Attention: ${warningMetrics.join(' and ')} ${warningMetrics.length > 1 ? 'are' : 'is'} approaching its threshold.`;
    }
  } else if (!isConnectionLost) {
    statusMessage = "Loading sensor data...";
  }

  return (
    <Layout device={device}>
      <ConnectionBanner isVisible={isConnectionLost} />
      
      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <StatusBanner status={latestData ? overallStatus : 'normal'} message={statusMessage} />
        </div>

        <MetricGrid 
          latestData={latestData || null} 
          historyData={historicalData} 
          thresholds={thresholds} 
        />

        <HistorySection 
          data={historicalData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          thresholds={thresholds}
        />

        {lastUpdated && (
          <div className="text-center text-xs text-slate-400 mt-8">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </main>
    </Layout>
  );
};
