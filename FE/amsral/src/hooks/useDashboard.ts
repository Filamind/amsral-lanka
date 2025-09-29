import { useQuery } from '@tanstack/react-query';
import DashboardService from '../services/dashboardService';
import IncomeService, { type IncomeSummaryData, type IncomeByPeriod, type TopCustomer } from '../services/incomeService';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  quickStats: (filters: DashboardFilters) => [...dashboardKeys.all, 'quickStats', filters] as const,
  ordersTrend: (filters: DashboardFilters) => [...dashboardKeys.all, 'ordersTrend', filters] as const,
  orderStatusDistribution: (filters: DashboardFilters) => [...dashboardKeys.all, 'orderStatusDistribution', filters] as const,
  recentOrders: (limit: number) => [...dashboardKeys.all, 'recentOrders', limit] as const,
  incomeSummary: (filters: DashboardFilters) => [...dashboardKeys.all, 'incomeSummary', filters] as const,
  incomeTrends: (filters: IncomeTrendsFilters) => [...dashboardKeys.all, 'incomeTrends', filters] as const,
  topCustomers: (filters: TopCustomersFilters) => [...dashboardKeys.all, 'topCustomers', filters] as const,
};

// Types
export interface DashboardFilters {
  startDate: string;
  endDate: string;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface IncomeTrendsFilters {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
  limit: number;
}

export interface TopCustomersFilters {
  startDate: string;
  endDate: string;
  limit: number;
}

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
  referenceNo: string;
  customerName: string;
  status: string;
  quantity: number;
  totalAmount: number;
  orderDate: string;
}

// Custom hook for fetching quick stats
export function useQuickStats(filters: DashboardFilters) {
  return useQuery<DashboardSummary>({
    queryKey: dashboardKeys.quickStats(filters),
    queryFn: async () => {
      const response = await DashboardService.getQuickStats(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - dashboard data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Custom hook for fetching orders trend
export function useOrdersTrend(filters: DashboardFilters) {
  return useQuery<DailyOrderData[]>({
    queryKey: dashboardKeys.ordersTrend(filters),
    queryFn: async () => {
      const response = await DashboardService.getOrdersTrend(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Custom hook for fetching order status distribution
export function useOrderStatusDistribution(filters: DashboardFilters) {
  return useQuery<OrderStatusDistribution[]>({
    queryKey: dashboardKeys.orderStatusDistribution(filters),
    queryFn: async () => {
      const response = await DashboardService.getOrderStatusDistribution(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Custom hook for fetching recent orders
export function useRecentOrders(limit: number = 10) {
  return useQuery<RecentOrder[]>({
    queryKey: dashboardKeys.recentOrders(limit),
    queryFn: async () => {
      const response = await DashboardService.getRecentOrders(limit);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - recent orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for fetching income summary
export function useIncomeSummary(filters: DashboardFilters) {
  return useQuery<IncomeSummaryData>({
    queryKey: dashboardKeys.incomeSummary(filters),
    queryFn: async () => {
      const response = await IncomeService.getIncomeSummaryWithFilters(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Custom hook for fetching income trends
export function useIncomeTrends(filters: IncomeTrendsFilters) {
  return useQuery<IncomeByPeriod[]>({
    queryKey: dashboardKeys.incomeTrends(filters),
    queryFn: async () => {
      const response = await IncomeService.getIncomeTrends(filters);
      return response.trends;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Custom hook for fetching top customers
export function useTopCustomers(filters: TopCustomersFilters) {
  return useQuery<TopCustomer[]>({
    queryKey: dashboardKeys.topCustomers(filters),
    queryFn: async () => {
      const response = await IncomeService.getTopCustomers(filters);
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!filters.startDate && !!filters.endDate,
  });
}
