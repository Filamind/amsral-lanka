import apiClient from '../config/api';

export interface CreateWashingTypeRequest {
  name: string;
  code: string;
  description?: string;
}

export interface WashingType {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WashingTypesResponse {
  success: boolean;
  data: {
    washingTypes: WashingType[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface PredefinedWashingTypesResponse {
  success: boolean;
  data: {
    predefinedTypes: WashingType[];
  };
}

export interface WashingTypeStatsResponse {
  success: boolean;
  data: {
    totalWashingTypes: number;
    activeTypes: number;
    inactiveTypes: number;
    mostUsedType: string;
  };
}

export interface WashingTypeResponse {
  success: boolean;
  data: WashingType;
  message?: string;
}

export const washingTypeService = {
  // GET /api/washing-types - Get all washing types with pagination and filtering
  getWashingTypes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<WashingTypesResponse> => {
    const response = await apiClient.get('/washing-types', { params });
    return response.data;
  },

  // GET /api/washing-types/predefined - Get predefined washing types
  getPredefinedWashingTypes: async (): Promise<PredefinedWashingTypesResponse> => {
    const response = await apiClient.get('/washing-types/predefined');
    return response.data;
  },

  // GET /api/washing-types/stats - Get washing type statistics
  getWashingTypeStats: async (): Promise<WashingTypeStatsResponse> => {
    const response = await apiClient.get('/washing-types/stats');
    return response.data;
  },

  // GET /api/washing-types/code/:code - Get washing type by code
  getWashingTypeByCode: async (code: string): Promise<WashingTypeResponse> => {
    const response = await apiClient.get(`/washing-types/code/${code}`);
    return response.data;
  },

  // GET /api/washing-types/:id - Get washing type by ID
  getWashingType: async (id: string): Promise<WashingTypeResponse> => {
    const response = await apiClient.get(`/washing-types/${id}`);
    return response.data;
  },

  // POST /api/washing-types - Create new washing type
  createWashingType: async (data: CreateWashingTypeRequest): Promise<WashingTypeResponse> => {
    const response = await apiClient.post('/washing-types', data);
    return response.data;
  },

  // PUT /api/washing-types/:id - Update washing type
  updateWashingType: async (id: string, data: Partial<CreateWashingTypeRequest>): Promise<WashingTypeResponse> => {
    const response = await apiClient.put(`/washing-types/${id}`, data);
    return response.data;
  },

  // DELETE /api/washing-types/:id - Delete washing type
  deleteWashingType: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/washing-types/${id}`);
    return response.data;
  },
};
