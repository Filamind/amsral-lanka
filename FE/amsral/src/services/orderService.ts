import apiClient from '../config/api';

// Order Status Types
export type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Confirmed' | 'Processing' | 'Delivered';

// Process Types
export type ProcessType = 'viscose' | 'rib' | 'sand_blast' | 'chevron' | 'stone_wash' | 'enzyme_wash';

// Wash Types
export type WashType = 'normal' | 'heavy' | 'light' | 'silicon' | 'soft';

// Request Interfaces
export interface CreateOrderRequest {
  date: string;
  customerId: string;
  quantity: number;
  notes?: string;
  deliveryDate: string;
  records: CreateOrderRecordRequest[]; // Empty array initially, records are added separately
}

export interface CreateOrderRecordRequest {
  orderId?: number; // Optional, can be included in request body if needed
  itemId: string;
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
}

export interface UpdateOrderRecordRequest {
  orderId?: number; // Optional, can be included in request body if needed
  itemId: string;
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
}

// Response Interfaces
export interface OrderRecord {
  id: number;
  orderId: number;
  itemId: string;
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  date: string;
  referenceNo: string;
  customerId: string;
  customerName: string;
  itemId: string | null;
  itemName: string | null;
  quantity: number;
  notes: string;
  deliveryDate: string;
  status: OrderStatus;
  recordsCount: number;
  complete: boolean;
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

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface OrderRecordResponse {
  success: boolean;
  data: OrderRecord;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: { [key: string]: string };
}

class OrderService {
  /**
   * 1. Create Order
   * POST /orders
   */
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

  /**
   * 2. Get Order Details
   * GET /orders/{orderId}
   */
  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch order' };
    }
  }

  /**
   * 3. Add Order Record
   * POST /orders/{orderId}/records
   */
  async addOrderRecord(orderId: number, recordData: CreateOrderRecordRequest): Promise<OrderRecordResponse> {
    try {
      const response = await apiClient.post(`/orders/${orderId}/records`, recordData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to add record' };
    }
  }

  /**
   * 4. Update Order Record
   * PUT /orders/{orderId}/records/{recordId}
   */
  async updateOrderRecord(orderId: number, recordId: number, recordData: UpdateOrderRecordRequest): Promise<OrderRecordResponse> {
    try {
      const response = await apiClient.put(`/orders/${orderId}/records/${recordId}`, recordData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to update record' };
    }
  }

  /**
   * 5. Delete Order Record
   * DELETE /orders/{orderId}/records/{recordId}
   */
  async deleteOrderRecord(orderId: number, recordId: number): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete(`/orders/${orderId}/records/${recordId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to delete record' };
    }
  }

  /**
   * 6. Get Orders List
   * GET /orders?page=1&limit=10&search=ORD001
   */
  async getOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<OrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await apiClient.get(`/orders?${queryParams.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch orders' };
    }
  }

  /**
   * 7. Update Order
   * PUT /orders/{orderId}
   */
  async updateOrder(orderId: number, orderData: Partial<CreateOrderRequest>): Promise<OrderResponse> {
    try {
      const response = await apiClient.put(`/orders/${orderId}`, orderData);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to update order' };
    }
  }

  /**
   * 8. Delete Order
   * DELETE /orders/{orderId}
   */
  async deleteOrder(orderId: number): Promise<DeleteResponse> {
    try {
      const response = await apiClient.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to delete order' };
    }
  }

  /**
   * 9. Get All Production Records
   * GET /orders/records
   */
  async getAllProductionRecords(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<OrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const response = await apiClient.get(`/orders/records?${queryParams.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch production records' };
    }
  }

  // Additional utility methods for backward compatibility
  async getOrdersWithDefaults(page: number = 1, limit: number = 10, search?: string): Promise<OrdersResponse> {
    return this.getOrders({ page, limit, search });
  }
}

export const orderService = new OrderService();
