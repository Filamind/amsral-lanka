import apiClient from '../config/api';

// Dashboard Analytics Types
export interface DashboardSummary {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface DailyOrderData {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface RecentOrder {
  id: number;
  customerName: string;
  status: string;
  totalAmount: number;
  orderDate: string;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  trends: {
    dailyOrders: DailyOrderData[];
    orderStatusDistribution: OrderStatusDistribution[];
  };
  recentOrders: RecentOrder[];
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

// Dashboard Service
export class DashboardService {
  // Get dashboard analytics
  static async getAnalytics(filters: DashboardFilters = {}): Promise<DashboardAnalytics> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);

      const response = await apiClient.get(`/api/dashboard/analytics?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch dashboard analytics');
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  // Get quick stats (for header cards)
  static async getQuickStats(): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get('/api/dashboard/quick-stats');
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch quick stats');
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  }

  // Get orders trend data
  static async getOrdersTrend(filters: DashboardFilters = {}): Promise<DailyOrderData[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);

      const response = await apiClient.get(`/api/dashboard/orders-trend?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch orders trend');
    } catch (error) {
      console.error('Error fetching orders trend:', error);
      throw error;
    }
  }

  // Get order status distribution
  static async getOrderStatusDistribution(filters: DashboardFilters = {}): Promise<OrderStatusDistribution[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);

      const response = await apiClient.get(`/api/dashboard/order-status-distribution?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch order status distribution');
    } catch (error) {
      console.error('Error fetching order status distribution:', error);
      throw error;
    }
  }

  // Get recent orders
  static async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    try {
      const response = await apiClient.get(`/api/dashboard/recent-orders?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch recent orders');
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }
}

export default DashboardService;
