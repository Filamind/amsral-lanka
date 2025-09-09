import apiClient from '../config/api';

export interface CreateProcessTypeRequest {
  name: string;
  code: string;
  description?: string;
}

export interface ProcessType {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessTypesResponse {
  success: boolean;
  data: {
    processTypes: ProcessType[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface ProcessTypesListResponse {
  success: boolean;
  data: {
    id: number;
    value: number;
    label: string;
    name: string;
    code: string;
    description?: string;
  }[];
}

export interface ProcessTypeStatsResponse {
  success: boolean;
  data: {
    totalProcessTypes: number;
    activeTypes: number;
    inactiveTypes: number;
    mostUsedType: string;
  };
}

export interface ProcessTypeResponse {
  success: boolean;
  data: ProcessType;
  message?: string;
}

export const processTypeService = {
  // GET /api/process-types - Get all process types with pagination and filtering
  getProcessTypes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProcessTypesResponse> => {
    const response = await apiClient.get('/process-types', { params });
    return response.data;
  },

  // GET /api/process-types/list - Get process types list for dropdowns/selects
  getProcessTypesList: async (): Promise<ProcessTypesListResponse> => {
    const response = await apiClient.get('/process-types/list');
    return response.data;
  },

  // GET /api/process-types/stats - Get process type statistics
  getProcessTypeStats: async (): Promise<ProcessTypeStatsResponse> => {
    const response = await apiClient.get('/process-types/stats');
    return response.data;
  },

  // GET /api/process-types/code/:code - Get process type by code
  getProcessTypeByCode: async (code: string): Promise<ProcessTypeResponse> => {
    const response = await apiClient.get(`/process-types/code/${code}`);
    return response.data;
  },

  // GET /api/process-types/:id - Get process type by ID
  getProcessType: async (id: string): Promise<ProcessTypeResponse> => {
    const response = await apiClient.get(`/process-types/${id}`);
    return response.data;
  },

  // POST /api/process-types - Create new process type
  createProcessType: async (data: CreateProcessTypeRequest): Promise<ProcessTypeResponse> => {
    const response = await apiClient.post('/process-types', data);
    return response.data;
  },

  // PUT /api/process-types/:id - Update existing process type
  updateProcessType: async (id: string, data: Partial<CreateProcessTypeRequest>): Promise<ProcessTypeResponse> => {
    const response = await apiClient.put(`/process-types/${id}`, data);
    return response.data;
  },

  // DELETE /api/process-types/:id - Delete process type
  deleteProcessType: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/process-types/${id}`);
    return response.data;
  },
};
