/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Pending,
  AttachMoney,
  AccountBalance,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import DashboardService from '../services/dashboardService';
import IncomeService, { type IncomeSummaryData, type IncomeByPeriod, type TopCustomer } from '../services/incomeService';

// Local type definitions to avoid import issues
interface DashboardSummary {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface DailyOrderData {
  date: string;
  orders: number;
  revenue: number;
}

interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface RecentOrder {
  id: number;
  referenceNo: string;
  customerName: string;
  status: string;
  quantity: number;
  totalAmount: number;
  orderDate: string;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}
import MetricCard from '../components/dashboard/MetricCard';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import { OrdersTrendChart, OrderStatusPieChart } from '../components/dashboard/OrdersChart';
import RevenueTrendChart from '../components/dashboard/RevenueTrendChart';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import TopCustomersWidget from '../components/dashboard/TopCustomersWidget';
import PaymentStatusPieChart from '../components/dashboard/PaymentStatusPieChart';
import colors from '../styles/colors';
import toast from 'react-hot-toast';


export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate state for each component to prevent unnecessary re-renders
  const [quickStats, setQuickStats] = useState<DashboardSummary | null>(null);
  const [ordersTrend, setOrdersTrend] = useState<DailyOrderData[]>([]);
  const [orderStatusDistribution, setOrderStatusDistribution] = useState<OrderStatusDistribution[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Income-related state
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummaryData | null>(null);
  const [, setIncomeTrends] = useState<IncomeByPeriod[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    period: 'month',
  });

  // Check if user has permission to view dashboard
  const canViewDashboard = hasPermission(user, 'canViewDashboard');

  const fetchAnalytics = useCallback(async () => {
    if (!canViewDashboard) return;

    try {
      setLoading(true);
      setError(null);

      const filters = {
        startDate: dateRange.startDate?.toISOString().split('T')[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: dateRange.endDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        period: dateRange.period,
      };

      console.log('Dashboard filters being sent:', filters);

      // Fetch all data in parallel for better performance
      const [quickStatsData, ordersTrendData, statusDistributionData, recentOrdersData, incomeSummaryData, incomeTrendsData, topCustomersData] = await Promise.allSettled([
        DashboardService.getQuickStats(filters),
        DashboardService.getOrdersTrend(filters),
        DashboardService.getOrderStatusDistribution(filters),
        DashboardService.getRecentOrders(10),
        IncomeService.getIncomeSummaryWithFilters(filters),
        IncomeService.getIncomeTrends({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: 'day',
          limit: 30
        }),
        IncomeService.getTopCustomers({
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: 10
        })
      ]);

      // Handle quick stats
      if (quickStatsData.status === 'fulfilled') {
        setQuickStats(quickStatsData.value);
      } else {
        console.error('Error fetching quick stats:', quickStatsData.reason);
      }

      // Handle orders trend
      if (ordersTrendData.status === 'fulfilled') {
        setOrdersTrend(ordersTrendData.value);
      } else {
        console.error('Error fetching orders trend:', ordersTrendData.reason);
        setOrdersTrend([]);
      }

      // Handle order status distribution
      if (statusDistributionData.status === 'fulfilled') {
        setOrderStatusDistribution(statusDistributionData.value);
      } else {
        console.error('Error fetching order status distribution:', statusDistributionData.reason);
      }

      // Handle recent orders
      if (recentOrdersData.status === 'fulfilled') {
        setRecentOrders(recentOrdersData.value);
      } else {
        console.error('Error fetching recent orders:', recentOrdersData.reason);
      }

      // Handle income summary
      if (incomeSummaryData.status === 'fulfilled') {
        setIncomeSummary(incomeSummaryData.value);
      } else {
        console.error('Error fetching income summary:', incomeSummaryData.reason);
      }

      // Handle income trends
      if (incomeTrendsData.status === 'fulfilled') {
        setIncomeTrends(incomeTrendsData.value.trends);
      } else {
        console.error('Error fetching income trends:', incomeTrendsData.reason);
      }

      // Handle top customers
      if (topCustomersData.status === 'fulfilled') {
        setTopCustomers(topCustomersData.value);
      } else {
        console.error('Error fetching top customers:', topCustomersData.reason);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [canViewDashboard, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  if (!canViewDashboard) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          You don't have permission to view the dashboard.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text.secondary, mb: 3 }}>
          Welcome back! Here's what's happening with your orders today.
        </Typography>

        {/* Date Range Filter */}
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          loading={loading}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={40} sx={{ color: colors.primary[500] }} />
        </Box>
      ) : (
        <>
          {/* Metrics Cards - Better organized */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4
          }}>
            <MetricCard
              title="Total Orders"
              value={quickStats?.totalOrders.toLocaleString() || '0'}
              icon={<ShoppingCart />}
              color="primary"
            />
            <MetricCard
              title="Completed Orders"
              value={quickStats?.completedOrders.toLocaleString() || '0'}
              subtitle={quickStats ? `${Math.round((quickStats.completedOrders / quickStats.totalOrders) * 100)}% completion rate` : '0% completion rate'}
              icon={<CheckCircle />}
              color="success"
            />
            <MetricCard
              title="Pending Orders"
              value={quickStats?.pendingOrders.toLocaleString() || '0'}
              icon={<Pending />}
              color="warning"
            />
          </Box>

          {/* Income Metrics Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4
          }}>
            <MetricCard
              title="Total Revenue"
              value={`Rs. ${incomeSummary?.summary?.totalRevenue?.toLocaleString() || '0'}`}
              subtitle={`${incomeSummary?.summary?.totalRecords || 0} total records`}
              icon={<AttachMoney />}
              color="primary"
            />
            <MetricCard
              title="Total Income"
              value={`Rs. ${incomeSummary?.summary?.totalIncome?.toLocaleString() || '0'}`}
              subtitle={`${incomeSummary?.summary?.paidRecords || 0} paid records`}
              icon={<AccountBalance />}
              color="success"
            />
            <MetricCard
              title="Pending Income"
              value={`Rs. ${incomeSummary?.summary?.pendingIncome?.toLocaleString() || '0'}`}
              subtitle={`${incomeSummary?.summary?.invoicedRecords || 0} invoiced records`}
              icon={<Warning />}
              color="warning"
            />
          </Box>

          {/* Charts Row - Orders and Revenue Trends */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            mb: 4
          }}>
            <OrdersTrendChart
              data={ordersTrend}
              loading={loading}
            />
            <RevenueTrendChart
              data={ordersTrend}
              loading={loading}
            />
          </Box>

          {/* Charts Row - Payment Status, Order Status Distribution, Top Customers */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' },
            gap: 3,
            mb: 4
          }}>
            <PaymentStatusPieChart
              paidRecords={incomeSummary?.summary?.paidRecords || 0}
              invoicedRecords={incomeSummary?.summary?.invoicedRecords || 0}
              loading={loading}
            />
            <OrderStatusPieChart
              data={orderStatusDistribution}
              loading={loading}
            />
            <TopCustomersWidget
              customers={topCustomers}
              loading={loading}
            />
          </Box>

          {/* Recent Orders - Full width */}
          <Box sx={{ width: '100%' }}>
            <RecentOrdersTable
              orders={recentOrders}
              loading={loading}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
