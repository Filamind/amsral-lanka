import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import colors from '../../styles/colors';

// Local type definitions to avoid import issues
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

interface OrdersTrendChartProps {
    data: DailyOrderData[];
    loading?: boolean;
}

interface OrderStatusPieChartProps {
    data: OrderStatusDistribution[];
    loading?: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export function OrdersTrendChart({ data, loading = false }: OrdersTrendChartProps) {
    if (loading) {
        return (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading chart data...</Typography>
            </Card>
        );
    }

    return (
        <Card sx={{ height: 400, p: 0 }}>
            <CardContent sx={{ height: '100%', p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colors.text.primary }}>
                    Orders Trend
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                            <XAxis
                                dataKey="date"
                                stroke={colors.text.secondary}
                                fontSize={12}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                stroke={colors.text.secondary}
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${colors.border.light}`,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                formatter={(value: any, name: string) => [
                                    name === 'orders' ? `${value} orders` : `$${value}`,
                                    name === 'orders' ? 'Orders' : 'Revenue'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke={colors.primary[500]}
                                strokeWidth={3}
                                dot={{ fill: colors.primary[500], strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: colors.primary[500], strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
}

export function OrderStatusPieChart({ data, loading = false }: OrderStatusPieChartProps) {
    if (loading) {
        return (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading chart data...</Typography>
            </Card>
        );
    }

    return (
        <Card sx={{ height: 400, p: 0 }}>
            <CardContent sx={{ height: '100%', p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colors.text.primary }}>
                    Order Status Distribution
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name} (${percentage}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any, name: string) => [`${value} orders`, 'Count']}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${colors.border.light}`,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
}
