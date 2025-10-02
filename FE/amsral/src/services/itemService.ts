import apiClient from '../config/api';

export interface CreateItemRequest {
  name: string;
  code: string;
  description?: string;
}

export interface Item {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemsResponse {
  success: boolean;
  data: {
    items: Item[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface ItemsListResponse {
  success: boolean;
  data: {
    value: string;
    label: string;
  }[];
}

export interface ItemStatsResponse {
  success: boolean;
  data: {
    totalItems: number;
    recentlyAdded: number;
    mostUsedItems: {
      id: string;
      name: string;
      orderCount: number;
    }[];
  };
}

export interface CreateItemResponse {
  success: boolean;
  message: string;
  data: Item;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: { [key: string]: string };
}

class ItemService {
  async getItems(page: number = 1, limit: number = 10, search?: string): Promise<ItemsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await apiClient.get(`/items?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch items' };
    }
  }

  async getItemsList(): Promise<ItemsListResponse> {
    try {
      const response = await apiClient.get('/items/list');
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch items list' };
    }
  }

  async getItemStats(): Promise<ItemStatsResponse> {
    try {
      const response = await apiClient.get('/items/stats');
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch item stats' };
    }
  }

  async getItem(id: string): Promise<{ success: boolean; data: Item }> {
    try {
      const response = await apiClient.get(`/items/${id}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch item' };
    }
  }

  async createItem(itemData: CreateItemRequest): Promise<CreateItemResponse> {
    try {
      console.log('🔧 Creating item with data:', itemData);
      console.log('🔧 API Base URL:', apiClient.defaults.baseURL);
      console.log('🔧 Full endpoint:', `${apiClient.defaults.baseURL}/items`);
      console.log('🔧 Request headers:', apiClient.defaults.headers);
      
      // Test if the endpoint is reachable first
      try {
        const testResponse = await apiClient.get('/items?page=1&limit=1');
        console.log('✅ Items endpoint is reachable, test response:', testResponse.status);
      } catch (testError) {
        console.error('❌ Items endpoint test failed:', testError);
      }
      
      const response = await apiClient.post('/items', itemData);
      console.log('✅ Item created successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error creating item:', error);
      const apiError = error as { response?: { data?: ErrorResponse; status?: number; statusText?: string }; code?: string; message?: string };
      
      // Log detailed error information
      if (apiError.response) {
        console.error('❌ API Error Details:', {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data,
          url: `${apiClient.defaults.baseURL}/items`
        });
      } else {
        console.error('❌ Network Error Details:', {
          code: apiError.code,
          message: apiError.message,
          url: `${apiClient.defaults.baseURL}/items`
        });
      }
      
      throw apiError.response?.data || { success: false, message: 'Failed to create item' };
    }
  }

  async updateItem(id: string, itemData: CreateItemRequest): Promise<CreateItemResponse> {
    try {
      const response = await apiClient.put(`/items/${id}`, itemData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to update item' };
    }
  }

  async deleteItem(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/items/${id}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to delete item' };
    }
  }
}

export const itemService = new ItemService();
