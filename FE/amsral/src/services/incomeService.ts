import apiClient from '../config/api';

// Income Analytics Types
export interface IncomeSummary {
  totalIncome: number;
  totalInvoices: number;
  pendingIncome: number;
  pendingInvoices: number;
  overdueIncome: number;
  overdueInvoices: number;
}

export interface IncomeByPeriod {
  period: string;
  totalIncome: number;
  invoiceCount: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalPaid: number;
  invoiceCount: number;
}

export interface IncomeAnalytics {
  period: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  summary: IncomeSummary;
  incomeByPeriod: IncomeByPeriod[];
  topCustomers: TopCustomer[];
}

export interface IncomeTrendsData {
  period: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  trends: IncomeByPeriod[];
}

export interface IncomeSummaryData {
  period: string;
  currentPeriod: {
    startDate: string;
    endDate: string;
    totalIncome: number;
    invoiceCount: number;
    averageInvoiceValue: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    totalIncome: number;
    invoiceCount: number;
  };
  growth: {
    amount: number;
    percentage: number;
  };
}

export interface IncomeFilters {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  groupBy?: 'day' | 'week' | 'month' | 'year';
  limit?: number;
}

// Income Service
export class IncomeService {
  // Get comprehensive income analytics
  static async getIncomeAnalytics(filters: IncomeFilters = {}): Promise<IncomeAnalytics> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);

      const response = await apiClient.get(`/billing/income?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch income analytics');
    } catch (error) {
      console.error('Error fetching income analytics:', error);
      throw error;
    }
  }

  // Get income summary for dashboard
  static async getIncomeSummary(period: string = 'month'): Promise<IncomeSummaryData> {
    try {
      const response = await apiClient.get(`/billing/income/summary?period=${period}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch income summary');
    } catch (error) {
      console.error('Error fetching income summary:', error);
      throw error;
    }
  }

  // Get income trends for charts
  static async getIncomeTrends(filters: IncomeFilters = {}): Promise<IncomeTrendsData> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.groupBy) params.append('groupBy', filters.groupBy);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/billing/income/trends?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch income trends');
    } catch (error) {
      console.error('Error fetching income trends:', error);
      throw error;
    }
  }

  // Get top customers by income
  static async getTopCustomers(filters: IncomeFilters = {}): Promise<TopCustomer[]> {
    try {
      const analytics = await this.getIncomeAnalytics(filters);
      return analytics.topCustomers;
    } catch (error) {
      console.error('Error fetching top customers:', error);
      throw error;
    }
  }
}

export default IncomeService;
