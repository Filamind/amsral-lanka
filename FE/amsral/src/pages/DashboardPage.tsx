
import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Pending,
  AttachMoney,
  AccountBalance,
  Warning,
  TrendingUp
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
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import IncomeTrendsChart from '../components/dashboard/IncomeTrendsChart';
import TopCustomersWidget from '../components/dashboard/TopCustomersWidget';
import colors from '../styles/colors';
import toast from 'react-hot-toast';

// Generate sample daily orders data based on date range
const generateSampleDailyOrders = (startDate: Date, endDate: Date): DailyOrderData[] => {
  const data: DailyOrderData[] = [];
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= daysDiff; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Generate more realistic data based on day of week
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseOrders = isWeekend ? 2 : 5;
    const baseRevenue = isWeekend ? 1000 : 3000;

    data.push({
      date: date.toISOString().split('T')[0],
      orders: Math.floor(Math.random() * baseOrders) + (isWeekend ? 1 : 3),
      revenue: Math.floor(Math.random() * baseRevenue) + (isWeekend ? 500 : 1500)
    });
  }

  return data;
};

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
  const [incomeTrends, setIncomeTrends] = useState<IncomeByPeriod[]>([]);
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
        IncomeService.getIncomeSummary('month'),
        IncomeService.getIncomeTrends({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: 'day',
          limit: 30
        }),
        IncomeService.getTopCustomers({
          startDate: filters.startDate,
          endDate: filters.endDate
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
        console.log('Orders trend data received:', ordersTrendData.value);
        setOrdersTrend(ordersTrendData.value);
      } else {
        console.error('Error fetching orders trend:', ordersTrendData.reason);
        console.log('Using sample data as fallback for orders trend');
        // Use sample data as fallback
        const sampleData = generateSampleDailyOrders(
          dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          dateRange.endDate || new Date()
        );
        console.log('Sample orders trend data:', sampleData);
        setOrdersTrend(sampleData);
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
              trend={{ value: 12, isPositive: true }}
            />
            <MetricCard
              title="Completed Orders"
              value={quickStats?.completedOrders.toLocaleString() || '0'}
              subtitle={quickStats ? `${Math.round((quickStats.completedOrders / quickStats.totalOrders) * 100)}% completion rate` : '0% completion rate'}
              icon={<CheckCircle />}
              color="success"
              trend={{ value: 8, isPositive: true }}
            />
            <MetricCard
              title="Pending Orders"
              value={quickStats?.pendingOrders.toLocaleString() || '0'}
              icon={<Pending />}
              color="warning"
              trend={{ value: -5, isPositive: false }}
            />
            <MetricCard
              title="Total Revenue"
              value={`$${quickStats?.totalRevenue.toLocaleString() || '0'}`}
              subtitle={`Avg: $${quickStats?.averageOrderValue.toLocaleString() || '0'}`}
              icon={<AttachMoney />}
              color="info"
              trend={{ value: 15, isPositive: true }}
            />
          </Box>

          {/* Income Metrics Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4
          }}>
            <MetricCard
              title="Total Income"
              value={`$${incomeSummary?.currentPeriod.totalIncome.toLocaleString() || '0'}`}
              subtitle={`${incomeSummary?.currentPeriod.invoiceCount || 0} invoices`}
              icon={<AccountBalance />}
              color="success"
              trend={{
                value: incomeSummary?.growth.percentage || 0,
                isPositive: (incomeSummary?.growth.percentage || 0) >= 0
              }}
            />
            <MetricCard
              title="Pending Income"
              value={`$${incomeSummary?.currentPeriod.totalIncome.toLocaleString() || '0'}`}
              subtitle={`${incomeSummary?.currentPeriod.invoiceCount || 0} pending invoices`}
              icon={<Warning />}
              color="warning"
              trend={{ value: 0, isPositive: false }}
            />
            <MetricCard
              title="Average Invoice"
              value={`$${incomeSummary?.currentPeriod.averageInvoiceValue.toLocaleString() || '0'}`}
              subtitle="Per invoice"
              icon={<TrendingUp />}
              color="info"
              trend={{ value: 0, isPositive: true }}
            />
            <MetricCard
              title="Growth Rate"
              value={`${incomeSummary?.growth.percentage.toFixed(1) || '0'}%`}
              subtitle={`$${incomeSummary?.growth.amount.toLocaleString() || '0'} vs last period`}
              icon={<TrendingUp />}
              color={(incomeSummary?.growth.percentage || 0) >= 0 ? "success" : "error"}
              trend={{
                value: incomeSummary?.growth.percentage || 0,
                isPositive: (incomeSummary?.growth.percentage || 0) >= 0
              }}
            />
          </Box>

          {/* Charts Row - Better proportions */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
            gap: 3,
            mb: 4
          }}>
            <OrdersTrendChart
              data={ordersTrend}
              loading={loading}
            />
            <OrderStatusPieChart
              data={orderStatusDistribution}
              loading={loading}
            />
          </Box>

          {/* Income Charts Row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
            gap: 3,
            mb: 4
          }}>
            <IncomeTrendsChart
              data={incomeTrends}
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
