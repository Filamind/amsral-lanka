import apiClient from '../config/api';

export interface CreateMachineTypeRequest {
  name: string;
  type: string;
  description?: string;
}

export interface MachineType {
  id: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineTypesResponse {
  success: boolean;
  data: {
    machineTypes: MachineType[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface MachineTypesListResponse {
  success: boolean;
  data: MachineType[];
}

export interface MachineTypeStatsResponse {
  success: boolean;
  data: {
    total: number;
    byType: Record<string, number>;
    recentlyAdded: number;
  };
}

export interface UniqueMachineTypesResponse {
  success: boolean;
  data: string[];
}

export interface MachineTypeResponse {
  success: boolean;
  data: MachineType;
}

export interface MachineTypesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const machineTypeService = {
  // GET /api/machine-types - Get paginated machine types with search
  getMachineTypes: async (params: MachineTypesParams = {}): Promise<MachineTypesResponse> => {
    const response = await apiClient.get('/machine-types', { params });
    return response.data;
  },

  // GET /api/machine-types/list - Get simple list for dropdowns
  getMachineTypesList: async (): Promise<MachineTypesListResponse> => {
    const response = await apiClient.get('/machine-types/list');
    return response.data;
  },

  // GET /api/machine-types/stats - Get machine type statistics
  getMachineTypeStats: async (): Promise<MachineTypeStatsResponse> => {
    const response = await apiClient.get('/machine-types/stats');
    return response.data;
  },

  // GET /api/machine-types/unique-types - Get unique machine types
  getUniqueTypes: async (): Promise<UniqueMachineTypesResponse> => {
    const response = await apiClient.get('/machine-types/unique-types');
    return response.data;
  },

  // GET /api/machine-types/:id - Get machine type by ID
  getMachineType: async (id: string): Promise<MachineTypeResponse> => {
    const response = await apiClient.get(`/machine-types/${id}`);
    return response.data;
  },

  // POST /api/machine-types - Create new machine type
  createMachineType: async (data: CreateMachineTypeRequest): Promise<MachineTypeResponse> => {
    const response = await apiClient.post('/machine-types', data);
    return response.data;
  },

  // PUT /api/machine-types/:id - Update existing machine type
  updateMachineType: async (id: string, data: Partial<CreateMachineTypeRequest>): Promise<MachineTypeResponse> => {
    const response = await apiClient.put(`/machine-types/${id}`, data);
    return response.data;
  },

  // DELETE /api/machine-types/:id - Delete machine type
  deleteMachineType: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/machine-types/${id}`);
    return response.data;
  },
};
