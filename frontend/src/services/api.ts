import { type Device, type SensorLog } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  verifyDevice: async (uniqueCode: string): Promise<Device> => {
    const response = await fetch(`${API_BASE_URL}/device/${uniqueCode}`);
    if (!response.ok) {
      throw new Error('Device tidak ditemukan');
    }
    return response.json();
  },

  getLatestData: async (uniqueCode: string): Promise<SensorLog> => {
    const response = await fetch(`${API_BASE_URL}/sensor/${uniqueCode}/latest`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data terbaru');
    }
    return response.json();
  },

  getHistoricalData: async (
    uniqueCode: string,
    startTime?: string,
    endTime?: string
  ): Promise<SensorLog[]> => {
    let url = `${API_BASE_URL}/sensor/${uniqueCode}?limit=100`;
    if (startTime) url += `&start_time=${startTime}`;
    if (endTime) url += `&end_time=${endTime}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Gagal mengambil data historis');
    }
    return response.json();
  }
};
