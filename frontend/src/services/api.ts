import axios from 'axios';
import type { ScanResponse, ScanHistoryItem, DashboardSummary } from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Scans
  scanText: async (text: string, customWeights?: Record<string, number>): Promise<ScanResponse> => {
    const response = await apiClient.post<ScanResponse>('/scan/text', {
      text,
      custom_weights: customWeights,
    });
    return response.data;
  },

  scanDocument: async (file: File): Promise<ScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ScanResponse>('/scan/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  },

  // History
  getHistory: async (limit: number = 50, skip: number = 0): Promise<ScanHistoryItem[]> => {
    const response = await apiClient.get<ScanHistoryItem[]>('/history', {
      params: { limit, skip },
    });
    return response.data;
  },

  getScanDetails: async (scanId: string): Promise<ScanResponse> => {
    const response = await apiClient.get<ScanResponse>(`/history/${scanId}`);
    return response.data;
  },

  deleteScan: async (scanId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/history/${scanId}`);
    return response.data;
  },

  clearAllHistory: async (): Promise<{ message: string; cleared_count: number }> => {
    const response = await apiClient.delete<{ message: string; cleared_count: number }>('/history');
    return response.data;
  },

  // Reports
  getReportDownloadUrl: (scanId: string): string => {
    return `${API_BASE}/reports/${scanId}`;
  },

  // Anonymize
  anonymizeText: async (text: string, maskingChar: string = '*', entitiesToMask?: string[]) => {
    const response = await apiClient.post('/anonymize', {
      text,
      masking_char: maskingChar,
      entities_to_mask: entitiesToMask,
    });
    return response.data;
  },

  // Health
  checkHealth: async () => {
    const response = await axios.get('/health');
    return response.data;
  },
};
