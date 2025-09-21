import { Box, Typography, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import colors from '../../styles/colors';

// Local type definitions to avoid import issues
interface DailyOrderData {
    date: string;
    orders: number;
    revenue: number;
}

interface RevenueTrendChartProps {
    data: DailyOrderData[];
    loading?: boolean;
}

export function RevenueTrendChart({ data, loading = false }: RevenueTrendChartProps) {
    if (loading) {
        return (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading chart data...</Typography>
            </Card>
        );
    }

    // Debug: Log the data to see what we're getting
    console.log('RevenueTrendChart data:', data);

    // Handle empty data
    if (!data || data.length === 0) {
        return (
            <Card sx={{ height: 400, p: 0 }}>
                <CardContent sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.text.primary }}>
                        Revenue Trend
                    </Typography>
                    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                        No revenue data available for the selected period.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: 400, p: 0 }}>
            <CardContent sx={{ height: '100%', p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colors.text.primary }}>
                    Revenue Trend
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                            <XAxis
                                dataKey="date"
                                stroke={colors.text.secondary}
                                fontSize={12}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    // Show different formats based on data range
                                    if (data.length <= 7) {
                                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                                    } else if (data.length <= 30) {
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    } else {
                                        return date.toLocaleDateString('en-US', { month: 'short' });
                                    }
                                }}
                            />
                            <YAxis
                                stroke={colors.text.secondary}
                                fontSize={12}
                                tickFormatter={(value) => `Rs. ${value.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${colors.border.light}`,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke={colors.success[500]}
                                strokeWidth={3}
                                dot={{ fill: colors.success[500], strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: colors.success[500], strokeWidth: 2 }}
                                name="Revenue"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
}

export default RevenueTrendChart;
