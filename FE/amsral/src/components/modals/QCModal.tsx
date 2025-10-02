import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import colors from '../../styles/colors';
import { orderService } from '../../services/orderService';

interface OrderRecord {
    id: number;
    trackingNumber: string;
    itemName?: string;
    quantity: number;
    returnQuantity?: number;
    washType: string;
    processTypes: string | string[];
    status: string;
    damageCount?: number;
}

interface QCModalProps {
    open: boolean;
    onClose: () => void;
    order: {
        id: number;
        customerName: string;
        quantity: number;
        returnQuantity?: number;
        deliveryQuantity?: number;
        date: string;
        deliveryDate: string;
        status: string;
    };
    onSave: (damageCounts: { [recordId: number]: number }) => Promise<void>;
}

const QCModal: React.FC<QCModalProps> = ({
    open,
    onClose,
    order,
    onSave
}) => {
    const [records, setRecords] = useState<OrderRecord[]>([]);
    const [damageCounts, setDamageCounts] = useState<{ [recordId: number]: number }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderRecords = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch order details which includes records
            const response = await orderService.getOrderDetails(order.id);

            if (!response.success || !response.data) {
                throw new Error('Failed to fetch order details');
            }

            const orderRecords = response.data.records || [];
            setRecords(orderRecords);

            // Initialize damage counts (start with 0 for all records)
            const initialDamageCounts: { [recordId: number]: number } = {};
            orderRecords.forEach((record: OrderRecord) => {
                initialDamageCounts[record.id] = 0; // Initialize with 0 since damageCount is not in OrderDetailsRecord
            });
            setDamageCounts(initialDamageCounts);
        } catch (err) {
            console.error('Error fetching order records:', err);
            setError('Failed to fetch order records');
        } finally {
            setLoading(false);
        }
    }, [order]);

    useEffect(() => {
        if (open && order) {
            fetchOrderRecords();
        }
    }, [open, order, fetchOrderRecords]);

    const handleDamageCountChange = (recordId: number, value: string) => {
        const numValue = parseInt(value) || 0;
        setDamageCounts(prev => ({
            ...prev,
            [recordId]: numValue
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onSave(damageCounts);
        } catch (err) {
            console.error('Error saving damage counts:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setDamageCounts({});
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                borderBottom: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.card
            }}>
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                    Quality Control - Order :{order.id}
                </Typography>
                <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                    Customer: {order.customerName}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : (
                    <Box>
                        {/* Order Summary */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                                Order Summary
                            </Typography>
                            <Box sx={{
                                p: 2,
                                backgroundColor: colors.background.card,
                                borderRadius: '8px',
                                border: `1px solid ${colors.border.light}`
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color={colors.text.secondary}>Total Quantity (qTY):</Typography>
                                    <Typography variant="body2" fontWeight={500}>{order.returnQuantity || 0}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color={colors.text.secondary}>Order Date:</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(order.date).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color={colors.text.secondary}>Delivery Date:</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {new Date(order.deliveryDate).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Records List */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 2, fontWeight: 600 }}>
                                Order Records - Damage Count
                            </Typography>

                            {records.length === 0 ? (
                                <Typography variant="body2" color={colors.text.secondary} sx={{ textAlign: 'center', py: 2 }}>
                                    No records found for this order
                                </Typography>
                            ) : (
                                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {records.map((record) => (
                                        <Box
                                            key={record.id}
                                            sx={{
                                                p: 2,
                                                mb: 2,
                                                backgroundColor: colors.background.card,
                                                borderRadius: '8px',
                                                border: `1px solid ${colors.border.light}`,
                                                '&:last-child': { mb: 0 }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} color={colors.text.primary}>
                                                        Tracking ID: {record.trackingNumber}
                                                    </Typography>
                                                    <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                                                        Wash Type: {record.washType}
                                                    </Typography>
                                                    <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                                                        Process Types: {Array.isArray(record.processTypes) ? record.processTypes.join(', ') : record.processTypes}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Chip
                                                        label={`Qty: ${record.quantity || 0}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.75rem' }}
                                                    />
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2" color={colors.text.secondary} sx={{ minWidth: '120px' }}>
                                                    Damage Count:
                                                </Typography>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={damageCounts[record.id] || 0}
                                                    onChange={(e) => handleDamageCountChange(record.id, e.target.value)}
                                                    inputProps={{
                                                        min: 0,
                                                        max: record.quantity || 0,
                                                        step: 1,
                                                        pattern: '[0-9]*'
                                                    }}
                                                    sx={{
                                                        width: '120px',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '8px'
                                                        },
                                                        '& input': {
                                                            textAlign: 'center'
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" color={colors.text.secondary}>
                                                    Max: {record.quantity}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                borderTop: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.card
            }}>
                <Button
                    onClick={handleClose}
                    disabled={saving}
                    sx={{
                        minWidth: 100,
                        color: colors.text.primary,
                        '&:hover': {
                            backgroundColor: colors.primary[50]
                        }
                    }}
                >
                    Cancel
                </Button>
                <PrimaryButton
                    onClick={handleSave}
                    disabled={saving || loading}
                    style={{ minWidth: 140 }}
                >
                    {saving ? 'Saving...' : 'Save Damage Counts'}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default QCModal;
