import React from 'react';
import { Box, Typography, Paper, Avatar, List, ListItem, ListItemAvatar, ListItemText, CircularProgress } from '@mui/material';
import { Person, AttachMoney, Receipt } from '@mui/icons-material';
import colors from '../../styles/colors';
import type { TopCustomer } from '../../services/incomeService';

interface TopCustomersWidgetProps {
    customers: TopCustomer[];
    loading?: boolean;
}

const TopCustomersWidget: React.FC<TopCustomersWidgetProps> = ({ customers, loading = false }) => {
    if (loading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={40} sx={{ color: colors.primary[500] }} />
            </Paper>
        );
    }

    // Handle case where customers is undefined or null
    if (!customers) {
        return (
            <Paper sx={{ p: 3, height: 400 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Person sx={{ color: colors.primary[500], fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                        Top Customers
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 300,
                    color: colors.text.secondary
                }}>
                    <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2">No customer data available</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: 400 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Person sx={{ color: colors.primary[500], fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                    Top Customers
                </Typography>
            </Box>

            {/* Customers List */}
            <Box sx={{ height: 300, overflow: 'auto' }}>
                {customers.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: colors.text.secondary
                    }}>
                        <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2">No customer data available</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {customers.map((customer, index) => (
                            <ListItem
                                key={customer.customerId}
                                sx={{
                                    borderBottom: index < customers.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                                    py: 2,
                                    px: 0
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: colors.primary[100],
                                            color: colors.primary[600],
                                            fontWeight: 600,
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        {customer.customerName.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.text.primary }}>
                                            {customer.customerName}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AttachMoney sx={{ fontSize: 16, color: colors.success[500] }} />
                                                <Typography variant="body2" sx={{ color: colors.success[600], fontWeight: 500 }}>
                                                    Rs. {customer.totalPaid.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Receipt sx={{ fontSize: 16, color: colors.info[500] }} />
                                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                    {customer.invoiceCount} invoices
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default TopCustomersWidget;
