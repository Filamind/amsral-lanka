import apiClient from '../config/api';

export interface CreateOrderRequest {
  date: string;
  customerId: string;
  itemId: string;
  quantity: number;
  notes?: string;
  deliveryDate: string;
  records: {
    quantity: number;
    washType: string;
    processTypes: string[];
  }[];
}

export interface OrderRecord {
  id: number;
  orderId: number;
  quantity: number;
  washType: string;
  processTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  date: string;
  referenceNo: string;
  customerId: string;
  customerName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  notes: string;
  deliveryDate: string;
  status: string;
  recordsCount: number;
  createdAt: string;
  updatedAt: string;
  records: OrderRecord[];
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: { [key: string]: string };
}

class OrderService {
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse }; code?: string };
      
      // Handle network errors (API not available)
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ERR_NETWORK') {
        throw { 
          success: false, 
          message: 'API server is not available. Please contact your administrator.' 
        };
      }
      
      throw apiError.response?.data || { success: false, message: 'Failed to create order' };
    }
  }

  async getOrders(page: number = 1, limit: number = 10, search?: string): Promise<OrdersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await apiClient.get(`/orders?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch orders' };
    }
  }

  async getOrder(id: number): Promise<{ success: boolean; data: Order }> {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch order' };
    }
  }

  async updateOrder(id: number, orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await apiClient.put(`/orders/${id}`, orderData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to update order' };
    }
  }

  async deleteOrder(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/orders/${id}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to delete order' };
    }
  }
}

export const orderService = new OrderService();
