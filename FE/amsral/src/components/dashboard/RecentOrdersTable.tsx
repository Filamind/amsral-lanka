import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import colors from '../../styles/colors';

// Local type definition to avoid import issues
interface RecentOrder {
    id: number;
    customerName: string;
    status: string;
    totalAmount: number;
    orderDate: string;
}

interface RecentOrdersTableProps {
    orders: RecentOrder[];
    loading?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return { bg: '#dcfce7', color: '#166534' };
        case 'pending':
            return { bg: '#dbeafe', color: '#1e40af' };
        case 'in progress':
            return { bg: '#fef3c7', color: '#92400e' };
        case 'confirmed':
            return { bg: '#e9d5ff', color: '#6b21a8' };
        case 'processing':
            return { bg: '#fed7aa', color: '#c2410c' };
        case 'delivered':
            return { bg: '#f3f4f6', color: '#374151' };
        default:
            return { bg: '#f3f4f6', color: '#374151' };
    }
};

export default function RecentOrdersTable({ orders, loading = false }: RecentOrdersTableProps) {
    const navigate = useNavigate();

    const handleOrderClick = (orderId: number) => {
        navigate(`/management/orders/${orderId}`);
    };

    if (loading) {
        return (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading recent orders...</Typography>
            </Card>
        );
    }

    return (
        <Card sx={{ height: 400, p: 0 }}>
            <CardContent sx={{ height: '100%', p: 0 }}>
                <Box sx={{ p: 3, pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                        Recent Orders
                    </Typography>
                </Box>

                <TableContainer sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: colors.text.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                                    Order ID
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.text.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                                    Customer
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.text.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.text.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                                    Amount
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.text.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                                    Date
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: colors.text.secondary }}>
                                        No recent orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => {
                                    const statusColors = getStatusColor(order.status);
                                    return (
                                        <TableRow
                                            key={order.id}
                                            hover
                                            onClick={() => handleOrderClick(order.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: colors.primary[50],
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ color: colors.primary[600], fontWeight: 500 }}>
                                                #{order.id}
                                            </TableCell>
                                            <TableCell sx={{ color: colors.text.primary }}>
                                                {order.customerName}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={order.status}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: statusColors.bg,
                                                        color: statusColors.color,
                                                        fontWeight: 500,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: colors.text.primary, fontWeight: 500 }}>
                                                ${order.totalAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell sx={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
                                                {new Date(order.orderDate).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
}
