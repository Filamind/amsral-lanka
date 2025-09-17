import apiClient from '../config/api';

// Billing interfaces
export interface BillingOrder {
  id: number;
  referenceNo: string;
  customerName: string;
  customerId: string;
  date: string;
  quantity: number;
  billingStatus: 'pending' | 'invoiced' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  orderId: number;
  recordId: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderRecordPricing {
  recordId: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderPricing {
  orderId: number;
  totalPrice: number;
  records: OrderRecordPricing[];
}

export interface SavePricingRequest {
  orderPricing: OrderPricing[];
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  customerName: string;
  orderIds: number[];
  records: InvoiceRecord[];
  orderTotals: { orderId: number; totalPrice: number }[];
  taxRate: number;
  paymentTerms: number;
  notes?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  orderIds: number[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentTerms: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
  orders: BillingOrder[];
}

export interface BillingFilters {
  page?: number;
  limit?: number;
  customerName?: string;
  orderId?: string;
  billingStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BillingResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedBillingResponse {
  orders: BillingOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Billing Service Class
export class BillingService {
  /**
   * Get orders with billing status
   */
  static async getBillingOrders(filters: BillingFilters = {}): Promise<BillingResponse<PaginatedBillingResponse>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.orderId) params.append('orderId', filters.orderId);
      if (filters.billingStatus) params.append('billingStatus', filters.billingStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await apiClient.get(`/billing/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing orders:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(invoiceData: CreateInvoiceRequest): Promise<BillingResponse<Invoice>> {
    try {
      const response = await apiClient.post('/billing/invoices', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Save order and record pricing
   */
  static async saveOrderPricing(pricingData: SavePricingRequest): Promise<BillingResponse<{
    message: string;
    savedOrders: { orderId: number; totalPrice: number; recordsCount: number }[];
  }>> {
    try {
      const response = await apiClient.post('/billing/orders/pricing', pricingData);
      return response.data;
    } catch (error) {
      console.error('Error saving order pricing:', error);
      throw error;
    }
  }

  /**
   * Get order pricing history
   */
  static async getOrderPricingHistory(orderId: number): Promise<BillingResponse<{
    orderId: number;
    currentPricing: {
      totalPrice: number;
      lastUpdated: string;
      records: {
        recordId: number;
        itemName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        lastUpdated: string;
      }[];
    };
    pricingHistory: {
      id: number;
      totalPrice: number;
      createdAt: string;
      createdBy: string;
      notes: string;
    }[];
  }>> {
    try {
      const response = await apiClient.get(`/billing/orders/${orderId}/pricing`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order pricing history:', error);
      throw error;
    }
  }

  /**
   * Update order record pricing
   */
  static async updateOrderRecordPricing(
    orderId: number, 
    recordId: number, 
    pricingData: { unitPrice: number; notes?: string }
  ): Promise<BillingResponse<{
    recordId: number;
    orderId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    updatedAt: string;
  }>> {
    try {
      const response = await apiClient.patch(`/billing/orders/${orderId}/records/${recordId}/pricing`, pricingData);
      return response.data;
    } catch (error) {
      console.error('Error updating order record pricing:', error);
      throw error;
    }
  }

  /**
   * Get all invoices
   */
  static async getInvoices(filters: {
    page?: number;
    limit?: number;
    customerName?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<BillingResponse<{ invoices: Invoice[]; pagination: any }>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await apiClient.get(`/billing/invoices?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(invoiceId: number): Promise<BillingResponse<Invoice>> {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId: number, status: string): Promise<BillingResponse<Invoice>> {
    try {
      const response = await apiClient.patch(`/billing/invoices/${invoiceId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  static async markInvoiceAsPaid(invoiceId: number, paymentData: {
    paymentDate: string;
    paymentMethod: string;
    paymentReference?: string;
    notes?: string;
  }): Promise<BillingResponse<Invoice>> {
    try {
      const response = await apiClient.patch(`/billing/invoices/${invoiceId}/pay`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(invoiceId: number): Promise<BillingResponse<{ message: string }>> {
    try {
      const response = await apiClient.delete(`/billing/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Get billing statistics
   */
  static async getBillingStats(filters: {
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
  } = {}): Promise<BillingResponse<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageInvoiceValue: number;
  }>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.customerId) params.append('customerId', filters.customerId);

      const response = await apiClient.get(`/billing/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   */
  static async getOverdueInvoices(): Promise<BillingResponse<Invoice[]>> {
    try {
      const response = await apiClient.get('/billing/invoices/overdue');
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Send invoice reminder
   */
  static async sendInvoiceReminder(invoiceId: number): Promise<BillingResponse<{ message: string }>> {
    try {
      const response = await apiClient.post(`/billing/invoices/${invoiceId}/remind`);
      return response.data;
    } catch (error) {
      console.error('Error sending invoice reminder:', error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF
   */
  static async generateInvoicePDF(invoiceId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Update order billing status
   */
  static async updateOrderBillingStatus(orderId: number, status: 'pending' | 'invoiced' | 'paid'): Promise<BillingResponse<any>> {
    try {
      const response = await apiClient.patch(`/billing/orders/${orderId}/status`, { billingStatus: status });
      return response.data;
    } catch (error) {
      console.error('Error updating order billing status:', error);
      throw error;
    }
  }

  /**
   * Get customer billing history
   */
  static async getCustomerBillingHistory(customerId: string, filters: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<BillingResponse<{
    invoices: Invoice[];
    orders: BillingOrder[];
    pagination: any;
  }>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await apiClient.get(`/billing/customers/${customerId}/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer billing history:', error);
      throw error;
    }
  }
}

export default BillingService;
