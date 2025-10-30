import { 
  BLOOD_GROUPS, 
  BLOOD_TYPES, 
  DEPARTMENTS, 
  RESERVATION_STATUS,
  type BloodGroup, 
  type BloodType, 
  type Department, 
  type ReservationStatus 
} from '../shared/constants/bloodConstants';
import { createAuthenticatedAPI } from './authInterceptors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// Create axios instance with auth interceptors
const api = createAuthenticatedAPI(API_BASE_URL);

// Interfaces
export interface BloodReservation {
  id: number;
  blood_group: BloodGroup;
  blood_type: BloodType;
  rh_factor: 'Positive' | 'Negative';
  quantity: number;
  patient_name: string;
  department: Department;
  status: ReservationStatus;
  reservation_date: string;
  user_id: number;
  reserved_by: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  approved_by_username?: string;
  completed_at?: string;
  completed_by?: number;
  completed_by_username?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  cancelled_by_username?: string;
  notes?: string;
  cancellation_notes?: string;
}

export interface CreateReservationData {
  blood_group: BloodGroup;
  blood_type: BloodType;
  rh_factor: 'Positive' | 'Negative';
  quantity: number;
  patient_name: string;
  department: Department;
  notes?: string;
}

export interface UpdateReservationData {
  blood_group?: BloodGroup;
  blood_type?: BloodType;
  rh_factor?: 'Positive' | 'Negative';
  quantity?: number;
  patient_name?: string;
  department?: Department;
  notes?: string;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  blood_group?: BloodGroup;
  department?: Department;
  id?: string;
  patient_name?: string;
  user_id?: number;
  page?: number;
  limit?: number;
}

export interface ReservationStats {
  status: ReservationStatus;
  count: number;
  blood_group: BloodGroup;
  department: Department;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: string;
}

class BloodReservationAPI {
  // Create reservation
  async createReservation(data: CreateReservationData): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.post('/reservations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างการจอง'
      };
    }
  }

  // Get all reservations with filters
  async getReservations(filters: ReservationFilters = {}): Promise<ApiResponse<BloodReservation[]>> {
    try {
      const response = await api.get('/reservations', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง'
      };
    }
  }

  // Get reservation by ID
  async getReservationById(id: number): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.get(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง'
      };
    }
  }

  // Update reservation
  async updateReservation(id: number, data: UpdateReservationData): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.put(`/reservations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตการจอง'
      };
    }
  }

  // Update reservation status
  async updateReservationStatus(id: number, status: ReservationStatus): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.patch(`/reservations/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะการจอง'
      };
    }
  }

  // Cancel reservation with reason
  async cancelReservationWithReason(id: number, reason: string): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.patch(`/reservations/${id}/status`, { 
        status: RESERVATION_STATUS.CANCELLED,
        cancellation_notes: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกการจอง'
      };
    }
  }

  // Cancel reservation by dispenser with reason
  async cancelReservationByDispenser(id: number, reason: string): Promise<ApiResponse<BloodReservation>> {
    try {
      const response = await api.patch(`/reservations/${id}/status`, { 
        status: RESERVATION_STATUS.CANCELLED_BY_DISPENSER,
        cancellation_notes: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling reservation by dispenser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกการจองโดยผู้จ่าย'
      };
    }
  }

  // Delete reservation
  async deleteReservation(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting reservation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบการจอง'
      };
    }
  }

  // Get reservation statistics
  async getReservationStats(): Promise<ApiResponse<ReservationStats[]>> {
    try {
      const response = await api.get('/reservations/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงสถิติการจอง'
      };
    }
  }

  // Get current user's reservations
  async getMyReservations(filters: { status?: ReservationStatus; limit?: number } = {}): Promise<ApiResponse<BloodReservation[]>> {
    try {
      const response = await api.get('/reservations/my/reservations', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองของคุณ'
      };
    }
  }

  // Get pending reservations summary for inventory
  async getPendingReservationsSummary(): Promise<ApiResponse<{ blood_type: string; blood_group: string; rh_factor: string; quantity: number }[]>> {
    try {
      const response = await api.get('/reservations/pending-summary');
      return response.data;
    } catch (error) {
      console.error('Error getting pending reservations summary:', error);
      return {
        success: false,
        error: 'Failed to fetch pending reservations summary'
      };
    }
  }

  // Get pending reservations count (จำนวนรายการจอง)
  async getPendingReservationsCount(): Promise<ApiResponse<{ count: number; totalQuantity: number }>> {
    try {
      const response = await api.get('/reservations/pending-count');
      return response.data;
    } catch (error) {
      console.error('Error getting pending reservations count:', error);
      return {
        success: false,
        error: 'Failed to fetch pending reservations count'
      };
    }
  }

  // Get reservation details with dispensed blood bags
  async getReservationDetails(id: number): Promise<ApiResponse<BloodReservation & { dispensed_blood_bags: any[] }>> {
    try {
      const response = await api.get(`/reservations/details/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting reservation details:', error);
      return {
        success: false,
        error: 'Failed to fetch reservation details'
      };
    }
  }

  // Dispense blood for reservation
  async dispenseBlood(data: {
    reservationId: number;
    bloodBags: { id: number }[];
    dispensedBy: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/reservations/dispense', data);
      return response.data;
    } catch (error) {
      console.error('Error dispensing blood:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to dispense blood'
      };
    }
  }

  // Helper method to get available blood types for a specific blood group
  getAvailableBloodTypes(): BloodType[] {
    return Object.values(BLOOD_TYPES);
  }

  // Helper method to get all blood groups
  getBloodGroups(): BloodGroup[] {
    return Object.values(BLOOD_GROUPS);
  }

  // Helper method to get all departments
  getDepartments(): Department[] {
    return Object.values(DEPARTMENTS);
  }

  // Helper method to get all reservation statuses
  getReservationStatuses(): ReservationStatus[] {
    return Object.values(RESERVATION_STATUS);
  }

  // Check blood availability for reservation
  async checkAvailability(data: {
    blood_type: BloodType;
    blood_group: BloodGroup;
    rh_factor: 'Positive' | 'Negative';
    quantity: number;
  }): Promise<ApiResponse<{
    available: boolean;
    availableCount: number;
    totalCount: number;
    pendingCount: number;
    actualAvailable: number;
    requiredQuantity: number;
    reservedUnits: number;
  }>> {
    try {
      const response = await api.post('/reservations/check-availability', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error checking availability:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อมใช้งาน'
      };
    }
  }
}

// Create and export a singleton instance
const bloodReservationAPI = new BloodReservationAPI();

export default bloodReservationAPI;