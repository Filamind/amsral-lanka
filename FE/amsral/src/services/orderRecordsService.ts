/**
 * Order Records Service
 * Service for fetching order records details
 */

import api from '../config/api';

export interface OrderRecord {
  trackingId: string;
  itemName: string;
  washType: string;
  processType: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRecordsDetails {
  orderId: number;
  customerName: string;
  orderQuantity: number;
  orderRecords: OrderRecord[];
  remainingQuantity: number;
}

export interface OrderRecordsResponse {
  success: boolean;
  data: OrderRecordsDetails;
}

class OrderRecordsService {
  /**
   * Get order records details by order ID
   */
  async getOrderRecordsDetails(orderId: number): Promise<OrderRecordsResponse> {
    try {
      const response = await api.get(`/orders/${orderId}/records-details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order records details:', error);
      throw error;
    }
  }
}

// Export singleton instance
const orderRecordsService = new OrderRecordsService();
export default orderRecordsService;
