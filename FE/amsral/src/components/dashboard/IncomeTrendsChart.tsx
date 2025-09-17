import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { TrendingUp, AttachMoney } from '@mui/icons-material';
import colors from '../../styles/colors';
import type { IncomeByPeriod } from '../../services/incomeService';

interface IncomeTrendsChartProps {
    data: IncomeByPeriod[];
    loading?: boolean;
}

const IncomeTrendsChart: React.FC<IncomeTrendsChartProps> = ({ data, loading = false }) => {
    // Format data for the chart
    const chartData = data.map(item => ({
        period: new Date(item.period).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }),
        income: item.totalIncome,
        invoices: item.invoiceCount,
        fullDate: item.period
    }));

    const totalIncome = data.reduce((sum, item) => sum + item.totalIncome, 0);
    const totalInvoices = data.reduce((sum, item) => sum + item.invoiceCount, 0);

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={40} sx={{ color: colors.primary[500] }} />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: 400 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ color: colors.primary[500], fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                        Income Trends
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.success[500] }}>
                        ${totalIncome.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {totalInvoices} invoices
                    </Typography>
                </Box>
            </Box>

            {/* Chart */}
            <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                        <XAxis
                            dataKey="period"
                            stroke={colors.text.secondary}
                            fontSize={12}
                        />
                        <YAxis
                            stroke={colors.text.secondary}
                            fontSize={12}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: colors.background.paper,
                                border: `1px solid ${colors.border.light}`,
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => [
                                name === 'income' ? `$${value.toLocaleString()}` : value,
                                name === 'income' ? 'Income' : 'Invoices'
                            ]}
                            labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                    return new Date(payload[0].payload.fullDate).toLocaleDateString();
                                }
                                return label;
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke={colors.primary[500]}
                            strokeWidth={3}
                            dot={{ fill: colors.primary[500], strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: colors.primary[500], strokeWidth: 2 }}
                            name="Income"
                        />
                        <Line
                            type="monotone"
                            dataKey="invoices"
                            stroke={colors.info[500]}
                            strokeWidth={2}
                            dot={{ fill: colors.info[500], strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5, stroke: colors.info[500], strokeWidth: 2 }}
                            name="Invoices"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default IncomeTrendsChart;
