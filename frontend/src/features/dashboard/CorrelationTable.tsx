import React from 'react';
import type { SensorReading } from '../../types';

interface CorrelationTableProps {
  feedingLogs: any[];
  weightLogs: any[];
  historicalData: SensorReading[];
}

export const CorrelationTable: React.FC<CorrelationTableProps> = ({ feedingLogs, weightLogs, historicalData }) => {
  // 1. Group all data by Date (YYYY-MM-DD)
  const dailyData: Record<string, { tempSum: number, humSum: number, sensorCount: number, feedTotal: number, weight: number | null }> = {};

  // Helper to format date
  const toDateStr = (dateString: string | number) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Add Sensor Data
  historicalData.forEach(d => {
    const dateStr = toDateStr(d.timestamp);
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { tempSum: 0, humSum: 0, sensorCount: 0, feedTotal: 0, weight: null };
    }
    dailyData[dateStr].tempSum += d.temperature;
    dailyData[dateStr].humSum += d.humidity;
    dailyData[dateStr].sensorCount += 1;
  });

  // Add Feeding Data
  feedingLogs.forEach(f => {
    const dateStr = toDateStr(f.fed_at);
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { tempSum: 0, humSum: 0, sensorCount: 0, feedTotal: 0, weight: null };
    }
    dailyData[dateStr].feedTotal += f.weight_gram;
  });

  // Add Weight Data (take the last weight of the day if multiple)
  weightLogs.forEach(w => {
    const dateStr = toDateStr(w.weighed_at);
    if (!dailyData[dateStr]) {
      dailyData[dateStr] = { tempSum: 0, humSum: 0, sensorCount: 0, feedTotal: 0, weight: null };
    }
    dailyData[dateStr].weight = w.weight_gram;
  });

  // Convert to array and sort descending
  const tableRows = Object.keys(dailyData)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(dateStr => {
      const data = dailyData[dateStr];
      return {
        date: dateStr,
        avgTemp: data.sensorCount > 0 ? (data.tempSum / data.sensorCount).toFixed(1) : '-',
        avgHum: data.sensorCount > 0 ? (data.humSum / data.sensorCount).toFixed(1) : '-',
        feedTotal: data.feedTotal > 0 ? data.feedTotal.toFixed(1) : '-',
        weight: data.weight !== null ? data.weight.toFixed(1) : '-'
      };
    });

  if (tableRows.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900">Tabel Korelasi Harian</h3>
        <p className="text-sm text-slate-500">Ringkasan kondisi lingkungan, pakan, dan berat maggot per hari.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-semibold">Tanggal</th>
              <th className="px-5 py-3 font-semibold">Rata-rata Suhu (°C)</th>
              <th className="px-5 py-3 font-semibold">Rata-rata Kelembaban (%)</th>
              <th className="px-5 py-3 font-semibold">Total Pakan (g)</th>
              <th className="px-5 py-3 font-semibold">Berat Maggot (g)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {tableRows.slice(0, 14).map((row) => (
              <tr key={row.date} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">
                  {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3 whitespace-nowrap font-mono">{row.avgTemp}</td>
                <td className="px-5 py-3 whitespace-nowrap font-mono">{row.avgHum}</td>
                <td className="px-5 py-3 whitespace-nowrap font-mono text-amber-600 font-medium">{row.feedTotal}</td>
                <td className="px-5 py-3 whitespace-nowrap font-mono text-emerald-600 font-bold">{row.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tableRows.length > 14 && (
        <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
          Menampilkan 14 hari terakhir
        </div>
      )}
    </div>
  );
};
