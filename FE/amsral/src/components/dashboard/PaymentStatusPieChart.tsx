import React from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import colors from '../../styles/colors';

interface PaymentStatusData {
    name: string;
    value: number;
    color: string;
}

interface PaymentStatusPieChartProps {
    paidRecords: number;
    invoicedRecords: number;
    loading?: boolean;
}

const PaymentStatusPieChart: React.FC<PaymentStatusPieChartProps> = ({
    paidRecords,
    invoicedRecords,
    loading = false
}) => {
    if (loading) {
        return (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={40} sx={{ color: colors.primary[500] }} />
            </Card>
        );
    }

    const data: PaymentStatusData[] = [
        {
            name: 'Paid Records',
            value: paidRecords,
            color: '#3b82f6' // Blue for paid
        },
        {
            name: 'Invoiced Records',
            value: invoicedRecords,
            color: '#ef4444' // Red for invoiced
        }
    ];

    // Handle empty data
    if (paidRecords === 0 && invoicedRecords === 0) {
        return (
            <Card sx={{ height: 400, p: 0 }}>
                <CardContent sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colors.text.primary }}>
                        Payment Status
                    </Typography>
                    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                        No payment data available for the selected period.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: 400, p: 0 }}>
            <CardContent sx={{ height: '100%', p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colors.text.primary }}>
                    Payment Status
                </Typography>
                <Box sx={{ height: 'calc(100% - 60px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any, name: string) => [`${value} records`, name]}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: `1px solid ${colors.border.light}`,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value, entry) => (
                                    <span style={{ color: entry.color }}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PaymentStatusPieChart;
