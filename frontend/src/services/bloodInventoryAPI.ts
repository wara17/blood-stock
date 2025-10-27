import axios from 'axios';
import { createAuthenticatedAPI } from './authInterceptors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with shared auth interceptors
const api = createAuthenticatedAPI(API_BASE_URL);

export interface BloodInventoryItem {
  id?: number;
  received_date: string;
  blood_type: 'Whole blood' | 'PRC' | 'LPRC';
  blood_group: 'A' | 'B' | 'AB' | 'O';
  rh_factor: 'Positive' | 'Negative';
  bag_number: string;
  expiry_date: string;
  received_by: string;
  status?: 'available' | 'reserved' | 'used' | 'expired';
  reserved_for?: string;
  reserved_at?: string;
  used_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BloodInventoryFilter {
  blood_type?: string;
  blood_group?: string;
  rh_factor?: string;
  received_by?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface BloodInventoryResponse {
  success: boolean;
  message: string;
  data: BloodInventoryItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BloodInventoryStatistics {
  total: number;
  byType: Array<{ blood_type: string; count: string }>;
  byGroup: Array<{ blood_group: string; rh_factor: string; count: string }>;
  byStatus: Array<{ status: string; count: string }>;
  expiringSoon: number;
}

export interface DashboardStats {
  'Whole blood': {
    [key: string]: number; // A_Positive, A_Negative, etc.
  };
  'PRC': {
    [key: string]: number;
  };
  'LPRC': {
    [key: string]: number;
  };
}

export interface BloodGroupStats {
  A: {
    Whole_Positive: number;
    Whole_Negative: number;
    PRC_Positive: number;
    PRC_Negative: number;
    LPRC_Positive: number;
    LPRC_Negative: number;
  };
  B: {
    Whole_Positive: number;
    Whole_Negative: number;
    PRC_Positive: number;
    PRC_Negative: number;
    LPRC_Positive: number;
    LPRC_Negative: number;
  };
  AB: {
    Whole_Positive: number;
    Whole_Negative: number;
    PRC_Positive: number;
    PRC_Negative: number;
    LPRC_Positive: number;
    LPRC_Negative: number;
  };
  O: {
    Whole_Positive: number;
    Whole_Negative: number;
    PRC_Positive: number;
    PRC_Negative: number;
    LPRC_Positive: number;
    LPRC_Negative: number;
  };
}

export interface StatusStats {
  nearExpiry: number;
  reserved: number;
  usedToday: number;
}

export interface StatusUpdateRequest {
  status: 'available' | 'reserved' | 'used' | 'expired';
  reserved_for?: string;
  notes?: string;
}

const bloodInventoryAPI = {
  // Get all blood inventory with filters and pagination
  getAll: async (filters: BloodInventoryFilter = {}): Promise<BloodInventoryResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/blood-inventory?${params.toString()}`);
    return response.data;
  },

  // Get blood inventory by ID
  getById: async (id: number): Promise<{ success: boolean; message: string; data: BloodInventoryItem }> => {
    const response = await api.get(`/blood-inventory/${id}`);
    return response.data;
  },

  // Create new blood inventory
  create: async (data: Omit<BloodInventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; data: BloodInventoryItem }> => {
    const response = await api.post('/blood-inventory', data);
    return response.data;
  },

  // Update blood inventory
  update: async (id: number, data: Omit<BloodInventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; message: string; data: BloodInventoryItem }> => {
    const response = await api.put(`/blood-inventory/${id}`, data);
    return response.data;
  },

  // Delete blood inventory
  delete: async (id: number): Promise<{ success: boolean; message: string; data: BloodInventoryItem }> => {
    const response = await api.delete(`/blood-inventory/${id}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<{ success: boolean; message: string; data: BloodInventoryStatistics }> => {
    const response = await api.get('/blood-inventory/statistics');
    return response.data;
  },

  // Get dashboard statistics grouped by blood type
  getDashboardStats: async (): Promise<{ success: boolean; message: string; data: DashboardStats }> => {
    const response = await api.get('/blood-inventory/dashboard-stats');
    return response.data;
  },

  // Get blood group statistics for dashboard cards
  getBloodGroupStats: async (): Promise<{ success: boolean; message: string; data: BloodGroupStats }> => {
    const response = await api.get('/blood-inventory/blood-group-stats');
    return response.data;
  },

  // Get status statistics for dashboard
  getStatusStats: async (): Promise<{ success: boolean; message: string; data: StatusStats }> => {
    const response = await api.get('/blood-inventory/status-stats');
    return response.data;
  },

  // Update blood inventory status
  updateStatus: async (id: number, data: StatusUpdateRequest): Promise<{ success: boolean; message: string; data: BloodInventoryItem }> => {
    const response = await api.patch(`/blood-inventory/${id}/status`, data);
    return response.data;
  },

  // Get available blood inventory
  getAvailable: async (filters: BloodInventoryFilter = {}): Promise<BloodInventoryResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/blood-inventory/available?${params.toString()}`);
    return response.data;
  },
};

export default bloodInventoryAPI;