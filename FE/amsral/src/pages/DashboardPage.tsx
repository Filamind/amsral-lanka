
import { useState } from 'react';
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
import {
  useQuickStats,
  useOrdersTrend,
  useOrderStatusDistribution,
  useRecentOrders,
  useIncomeSummary,
  useIncomeTrends,
  useTopCustomers,
  type DashboardFilters,
  type IncomeTrendsFilters,
  type TopCustomersFilters
} from '../hooks/useDashboard';

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


export default function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    period: 'month',
  });

  // Check if user has permission to view dashboard
  const canViewDashboard = hasPermission(user, 'canViewDashboard');

  // Prepare filters for TanStack Query hooks
  const dashboardFilters: DashboardFilters = {
    startDate: dateRange.startDate?.toISOString().split('T')[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: dateRange.endDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    period: dateRange.period,
  };

  const incomeTrendsFilters: IncomeTrendsFilters = {
    startDate: dashboardFilters.startDate,
    endDate: dashboardFilters.endDate,
    groupBy: 'day',
    limit: 30
  };

  const topCustomersFilters: TopCustomersFilters = {
    startDate: dashboardFilters.startDate,
    endDate: dashboardFilters.endDate,
    limit: 10
  };

  // TanStack Query hooks
  const {
    data: quickStats,
    isLoading: quickStatsLoading,
    error: quickStatsError
  } = useQuickStats(dashboardFilters);

  const {
    data: ordersTrend = [],
    isLoading: ordersTrendLoading,
    error: ordersTrendError
  } = useOrdersTrend(dashboardFilters);

  const {
    data: orderStatusDistribution = [],
    isLoading: orderStatusDistributionLoading,
    error: orderStatusDistributionError
  } = useOrderStatusDistribution(dashboardFilters);

  const {
    data: recentOrders = [],
    isLoading: recentOrdersLoading,
    error: recentOrdersError
  } = useRecentOrders(10);

  const {
    data: incomeSummary,
    isLoading: incomeSummaryLoading,
    error: incomeSummaryError
  } = useIncomeSummary(dashboardFilters);

  const {
    data: _incomeTrends = [],
    isLoading: incomeTrendsLoading,
    error: incomeTrendsError
  } = useIncomeTrends(incomeTrendsFilters);

  const {
    data: topCustomers = [],
    isLoading: topCustomersLoading,
    error: topCustomersError
  } = useTopCustomers(topCustomersFilters);

  // Derived loading and error states
  const loading = quickStatsLoading || ordersTrendLoading || orderStatusDistributionLoading ||
    recentOrdersLoading || incomeSummaryLoading || incomeTrendsLoading || topCustomersLoading;

  const error = quickStatsError || ordersTrendError || orderStatusDistributionError ||
    recentOrdersError || incomeSummaryError || incomeTrendsError || topCustomersError;


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
          {error.message || 'An error occurred'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Dashboard
        </h2>
        <Typography variant="body1" sx={{ color: colors.text.secondary, mb: 3 }}>
          Welcome back! Here's what's happening with your orders today.
        </Typography>

        {/* Date Range Filter */}
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          loading={loading}
        />
      </div>

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
              subtitle={quickStats && quickStats.totalOrders > 0 ? `${Math.round((quickStats.completedOrders / quickStats.totalOrders) * 100)}% completion rate` : '0% completion rate'}
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
