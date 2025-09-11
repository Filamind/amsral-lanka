
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Pending,
  TrendingUp,
  AttachMoney,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/roleUtils';
import DashboardService from '../services/dashboardService';

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
  customerName: string;
  status: string;
  totalAmount: number;
  orderDate: string;
}

interface DashboardAnalytics {
  summary: DashboardSummary;
  trends: {
    dailyOrders: DailyOrderData[];
    orderStatusDistribution: OrderStatusDistribution[];
  };
  recentOrders: RecentOrder[];
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
import colors from '../styles/colors';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    period: 'month',
  });

  // Check if user has permission to view dashboard
  const canViewDashboard = hasPermission(user, 'canViewOrders') || hasPermission(user, 'canViewManagement');

  const fetchAnalytics = async () => {
    if (!canViewDashboard) return;

    try {
      setLoading(true);
      setError(null);

      const filters = {
        startDate: dateRange.startDate?.toISOString().split('T')[0],
        endDate: dateRange.endDate?.toISOString().split('T')[0],
        period: dateRange.period,
      };

      const data = await DashboardService.getAnalytics(filters);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, canViewDashboard]);

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
      ) : analytics ? (
        <>
          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Orders"
                value={analytics.summary.totalOrders.toLocaleString()}
                icon={<ShoppingCart />}
                color="primary"
                trend={{ value: 12, isPositive: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Completed Orders"
                value={analytics.summary.completedOrders.toLocaleString()}
                subtitle={`${Math.round((analytics.summary.completedOrders / analytics.summary.totalOrders) * 100)}% completion rate`}
                icon={<CheckCircle />}
                color="success"
                trend={{ value: 8, isPositive: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Pending Orders"
                value={analytics.summary.pendingOrders.toLocaleString()}
                icon={<Pending />}
                color="warning"
                trend={{ value: -5, isPositive: false }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Revenue"
                value={`$${analytics.summary.totalRevenue.toLocaleString()}`}
                subtitle={`Avg: $${analytics.summary.averageOrderValue.toLocaleString()}`}
                icon={<AttachMoney />}
                color="info"
                trend={{ value: 15, isPositive: true }}
              />
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <OrdersTrendChart
                data={analytics.trends.dailyOrders}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <OrderStatusPieChart
                data={analytics.trends.orderStatusDistribution}
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Recent Orders */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <RecentOrdersTable
                orders={analytics.recentOrders}
                loading={loading}
              />
            </Grid>
          </Grid>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No data available for the selected period.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
