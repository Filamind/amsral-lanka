import apiClient from '../config/api';
import type { ErrorResponse } from '../config/api';

// Types
export interface ProcessRecord {
  id: string;
  orderId: number;
  orderRef: string;
  customerName: string;
  item: string;
  itemId?: string;
  quantity: number;
  remainingQuantity: number;
  washType: string;
  processTypes: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineAssignment {
  id: string;
  recordId: string;
  orderId: number;
  orderRef: string;
  customerName: string;
  item: string;
  assignedBy: string;
  assignedById: string;
  assignedTo: string;
  quantity: number;
  washingMachine: string;
  dryingMachine: string;
  assignedAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentStats {
  totalQuantity: number;
  assignedQuantity: number;
  remainingQuantity: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  completionPercentage: number;
}

export interface CreateAssignmentRequest {
  assignedById: string;
  quantity: number;
  washingMachine: string;
  dryingMachine: string;
  orderId: number;
  itemId: string;
  recordId: string;
}

export interface UpdateAssignmentRequest {
  assignedById?: string;
  quantity?: number;
  washingMachine?: string;
  dryingMachine?: string;
  status?: string;
}

export interface AssignmentsResponse {
  success: boolean;
  data: {
    assignments: MachineAssignment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface RecordResponse {
  success: boolean;
  data: ProcessRecord;
}

export interface StatsResponse {
  success: boolean;
  data: AssignmentStats;
}

class RecordService {
  // Get single record details
  async getRecord(recordId: string): Promise<ProcessRecord> {
    try {
      const response = await apiClient.get(`/records/${recordId}`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch record details' };
    }
  }

  // Get machine assignments for a record
  async getRecordAssignments(
    recordId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<AssignmentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await apiClient.get(`/records/${recordId}/assignments?${queryParams.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch assignments' };
    }
  }

  // Create machine assignment
  async createAssignment(
    recordId: string,
    assignmentData: CreateAssignmentRequest
  ): Promise<MachineAssignment> {
    try {
      const response = await apiClient.post(`/records/${recordId}/assignments`, assignmentData);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to create assignment' };
    }
  }

  // Update machine assignment
  async updateAssignment(
    recordId: string,
    assignmentId: string,
    assignmentData: UpdateAssignmentRequest
  ): Promise<MachineAssignment> {
    try {
      const response = await apiClient.put(`/records/${recordId}/assignments/${assignmentId}`, assignmentData);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to update assignment' };
    }
  }

  // Delete machine assignment
  async deleteAssignment(recordId: string, assignmentId: string): Promise<void> {
    try {
      await apiClient.delete(`/records/${recordId}/assignments/${assignmentId}`);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to delete assignment' };
    }
  }

  // Complete assignment
  async completeAssignment(recordId: string, assignmentId: string): Promise<MachineAssignment> {
    try {
      const response = await apiClient.put(`/records/${recordId}/assignments/${assignmentId}/complete`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to complete assignment' };
    }
  }

  // Set assignment to In Progress
  async setAssignmentInProgress(recordId: string, assignmentId: string): Promise<MachineAssignment> {
    try {
      const response = await apiClient.put(`/records/${recordId}/assignments/${assignmentId}`, {
        status: 'In Progress'
      });
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to set assignment to In Progress' };
    }
  }

  // Get assignment statistics
  async getAssignmentStats(recordId: string): Promise<AssignmentStats> {
    try {
      const response = await apiClient.get(`/records/${recordId}/assignments/stats`);
      return response.data.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch assignment statistics' };
    }
  }
}

export default new RecordService();
