import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { type Device, type SensorLog } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor untuk menambahkan token Authorization
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const fixDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Jika string berupa format ISO 8601 tapi tanpa zona waktu 'Z' atau '+00:00'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(obj)) {
      return obj + 'Z'; // Force ke UTC agar JS mengonversinya ke local time secara otomatis
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(fixDates);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = fixDates(obj[key]);
    }
    return newObj;
  }
  return obj;
};

// Interceptor untuk mem-parsing Date ke Local Time, dan menangani error 401
apiClient.interceptors.response.use(
  (response) => {
    response.data = fixDates(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth endpoints (yang baru)
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  
  login: async (data: FormData) => {
    const res = await apiClient.post('/auth/login', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },

  // Devices endpoints
  getUserDevices: async (): Promise<Device[]> => {
    const res = await apiClient.get('/devices');
    return res.data;
  },

  claimDevice: async (data: { unique_code: string; location: string }): Promise<Device> => {
    const res = await apiClient.post('/devices', data);
    return res.data;
  },

  // Endpoint lama (mungkin perlu diupdate nanti kalau butuh filter by user)
  verifyDevice: async (uniqueCode: string): Promise<Device> => {
    const res = await apiClient.get(`/device/${uniqueCode}`);
    return res.data;
  },

  getLatestData: async (uniqueCode: string): Promise<SensorLog> => {
    const res = await apiClient.get(`/sensor/${uniqueCode}/latest`);
    return res.data;
  },

  getHistoricalData: async (
    uniqueCode: string,
    startTime?: string,
    endTime?: string
  ): Promise<SensorLog[]> => {
    const res = await apiClient.get(`/sensor/${uniqueCode}`, {
      params: { start_time: startTime, end_time: endTime, limit: 100 }
    });
    return res.data;
  },

  getThreshold: async (uniqueCode: string): Promise<any> => {
    const res = await apiClient.get(`/threshold/${uniqueCode}`);
    return res.data;
  },

  updateThreshold: async (uniqueCode: string, data: any): Promise<any> => {
    const res = await apiClient.put(`/threshold/${uniqueCode}`, data);
    return res.data;
  },

  deleteDevice: async (deviceId: number): Promise<any> => {
    const res = await apiClient.delete(`/devices/${deviceId}`);
    return res.data;
  },

  // Feeding Endpoints
  getFeedingLogs: async (deviceId: number, params?: { from?: string, to?: string }): Promise<any[]> => {
    const res = await apiClient.get(`/devices/${deviceId}/feeding`, { params });
    return res.data;
  },
  createFeedingLog: async (deviceId: number, data: any): Promise<any> => {
    const res = await apiClient.post(`/devices/${deviceId}/feeding`, data);
    return res.data;
  },
  updateFeedingLog: async (deviceId: number, logId: number, data: any): Promise<any> => {
    const res = await apiClient.put(`/devices/${deviceId}/feeding/${logId}`, data);
    return res.data;
  },
  deleteFeedingLog: async (deviceId: number, logId: number): Promise<any> => {
    const res = await apiClient.delete(`/devices/${deviceId}/feeding/${logId}`);
    return res.data;
  },

  // Weight Endpoints
  getWeightLogs: async (deviceId: number, params?: { from?: string, to?: string }): Promise<any[]> => {
    const res = await apiClient.get(`/devices/${deviceId}/weight`, { params });
    return res.data;
  },
  createWeightLog: async (deviceId: number, data: any): Promise<any> => {
    const res = await apiClient.post(`/devices/${deviceId}/weight`, data);
    return res.data;
  },
  updateWeightLog: async (deviceId: number, logId: number, data: any): Promise<any> => {
    const res = await apiClient.put(`/devices/${deviceId}/weight/${logId}`, data);
    return res.data;
  },
  deleteWeightLog: async (deviceId: number, logId: number): Promise<any> => {
    const res = await apiClient.delete(`/devices/${deviceId}/weight/${logId}`);
    return res.data;
  }
};

