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
  itemId: string;
  quantity: number;
  gpNo?: string;
  notes?: string;
  deliveryDate: string;
  records: CreateOrderRecordRequest[]; // Empty array initially, records are added separately
}

export interface CreateOrderRecordRequest {
  orderId?: number; // Optional, can be included in request body if needed
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
  trackingNumber?: string; // Optional, will be generated if not provided
}

export interface UpdateOrderRecordRequest {
  orderId?: number; // Optional, can be included in request body if needed
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
  trackingNumber?: string; // Optional, for updating tracking number if needed
}

export interface UpdateOrderRequest {
  date?: string;
  customerId?: string;
  itemId?: string;
  quantity?: number;
  notes?: string;
  deliveryDate?: string;
  status?: OrderStatus;
}

// Response Interfaces
export interface OrderRecord {
  id: number;
  orderId: number;
  itemId: string;
  quantity: number;
  washType: WashType;
  processTypes: ProcessType[];
  trackingNumber: string; // Required in response
  createdAt: string;
  updatedAt: string;
}

// Management API Interfaces
export interface ManagementOrder {
  id: number;
  date: string;
  referenceNo: string;
  customerId: string;
  customerName: string;
  quantity: number;
  notes: string;
  deliveryDate: string;
  status: OrderStatus;
  billingStatus?: 'pending' | 'invoiced' | 'paid';
  recordsCount: number;
  complete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailsRecord {
  id: number;
  orderId: number;
  itemId: string;
  itemName?: string; // Add itemName to the interface
  quantity: number;
  washType: string;
  processTypes: string[];
  trackingNumber: string;
  status: string;
  complete: boolean;
  assignments: OrderAssignment[];
  stats: RecordStats;
}

export interface OrderAssignment {
  id: number;
  recordId: number;
  orderId: number;
  assignedTo: string;
  quantity: number;
  washingMachine: string;
  dryingMachine: string;
  trackingNumber: string;
  status: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordStats {
  totalQuantity: number;
  assignedQuantity: number;
  remainingQuantity: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  completionPercentage: number;
}

export interface OverallStats {
  totalQuantity: number;
  totalAssignedQuantity: number;
  totalCompletedQuantity: number;
  remainingQuantity: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  overallCompletionPercentage: number;
  recordsCount: number;
  completeRecordsCount: number;
  assignmentCompleteness: {
    totalAssignments: number;
    completedAssignments: number;
    inProgressAssignments: number;
    cancelledAssignments: number;
    assignmentCompletionPercentage: number;
  };
  workCompletion: {
    totalQuantity: number;
    assignedQuantity: number;
    completedQuantity: number;
    remainingQuantity: number;
    workCompletionPercentage: number;
  };
}

export interface OrderDetailsResponse {
  order: ManagementOrder;
  records: OrderDetailsRecord[];
  overallStats: OverallStats;
}

export interface OrdersListResponse {
  orders: ManagementOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
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
  billingStatus?: 'pending' | 'invoiced' | 'paid';
  recordsCount: number;
  complete: boolean;
  overdue: boolean;
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

// Invoice Preview Data
export interface InvoicePreviewData {
  customerId: number;
  customerCode: string;
  customerName: string;
  currentIncrement: number;
  nextIncrement: number;
  nextInvoiceNo: string;
}

// Order Summary for Gatepass
export interface OrderSummaryRecord {
  id: number;
  quantity: number;
  washType: string;
  processTypes: string[];
  itemName: string;
  itemId: string;
  status: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummaryData {
  id: number;
  customerId: number; // Customer ID for invoice number generation
  customerName: string;
  orderDate: string;
  totalQuantity: number;
  createdDate: string;
  referenceNo: string;
  deliveryDate: string;
  status: string;
  notes: string | null;
  balance?: number; // Customer balance amount
  records: OrderSummaryRecord[];
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
    customerName?: string;
    orderId?: string;
    billingStatus?: string;
    excludeDelivered?: boolean; // New parameter to exclude delivered orders
  }): Promise<OrdersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.customerName) queryParams.append('customerName', params.customerName);
      if (params?.orderId) queryParams.append('orderId', params.orderId);
      if (params?.billingStatus) queryParams.append('billingStatus', params.billingStatus);
      if (params?.excludeDelivered) queryParams.append('excludeDelivered', 'true');
      
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
  async updateOrder(orderId: number, orderData: UpdateOrderRequest): Promise<OrderResponse> {
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

  /**
   * Management API Methods
   */

  /**
   * Get orders list with filters for Management
   * GET /api/orders?page=1&limit=10
   * GET /api/orders?customerName=John&page=1&limit=5
   * GET /api/orders?orderId=3&page=1&limit=5
   * GET /api/orders?status=Pending&page=1&limit=10
   */
  async getManagementOrders(params?: {
    page?: number;
    limit?: number;
    customerName?: string;
    orderId?: number;
    status?: OrderStatus;
  }): Promise<{ success: boolean; data: OrdersListResponse }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.customerName) queryParams.append('customerName', params.customerName);
      if (params?.orderId) queryParams.append('orderId', params.orderId.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const response = await apiClient.get(`/orders?${queryParams.toString()}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch orders' };
    }
  }

  /**
   * Get order details with records and assignments
   * GET /api/orders/:id/details
   */
  async getOrderDetails(orderId: number): Promise<{ success: boolean; data: OrderDetailsResponse }> {
    try {
      const response = await apiClient.get(`/orders/${orderId}/details`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch order details' };
    }
  }

  /**
   * Get order summary for gatepass
   * GET /api/orders/:id/summary
   */
  async getOrderSummary(orderId: number): Promise<{ success: boolean; data: OrderSummaryData }> {
    try {
      const response = await apiClient.get(`/orders/${orderId}/summary`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch order summary' };
    }
  }

  /**
   * Get invoice preview data for a customer
   * GET /api/orders/invoice-preview/:customerId
   */
  async getInvoicePreview(customerId: number): Promise<{ success: boolean; data: InvoicePreviewData }> {
    try {
      const response = await apiClient.get(`/orders/invoice-preview/${customerId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: ErrorResponse } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch invoice preview' };
    }
  }
}

export const orderService = new OrderService();
export { OrderService };
