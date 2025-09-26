import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    TextField,
    Divider
} from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import colors from '../../styles/colors';

interface BillingOrder {
    id: number;
    date: string;
    referenceNo: string;
    customerId: string;
    customerName: string;
    quantity: number;
    notes: string | null;
    deliveryDate: string;
    status: string;
    billingStatus: 'pending' | 'invoiced' | 'paid';
    recordsCount: number;
    complete: boolean;
    createdAt: string;
    updatedAt: string;
    records: unknown[];
    amount?: number;
    paymentAmount?: number;
}

interface PaymentStatusModalProps {
    open: boolean;
    onClose: () => void;
    order: BillingOrder | null;
    onUpdate: (orderId: number, isPaid: boolean, paymentAmount: number) => Promise<void>;
    loading?: boolean;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
    open,
    onClose,
    order,
    onUpdate,
    loading = false
}) => {
    const [isPaid, setIsPaid] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialize form when order changes
    useEffect(() => {
        if (order) {
            setIsPaid(order.billingStatus === 'paid');
            setPaymentAmount(order.paymentAmount || order.amount || 0);
            setErrors({});
        }
    }, [order]);

    const handleSubmit = async () => {
        if (!order) return;

        // Validation
        const newErrors: { [key: string]: string } = {};

        if (paymentAmount < 0) {
            newErrors.paymentAmount = 'Payment amount cannot be negative';
        }

        if (paymentAmount > (order.amount || 0)) {
            newErrors.paymentAmount = `Payment amount cannot exceed invoice amount (${order.amount || 0})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onUpdate(order.id, isPaid, paymentAmount);
            onClose();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!order) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                borderBottom: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.light
            }}>
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                    Update Payment Status
                </Typography>
                <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                    Order #{order.referenceNo}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Order Details
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.background.light,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.light}`
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Customer:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.customerName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Quantity:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.quantity}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Invoice Amount:</Typography>
                            <Typography variant="body2" fontWeight={500} color={colors.button.primary}>
                                ${order.amount || 0}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color={colors.text.secondary}>Status:</Typography>
                            <Typography variant="body2" fontWeight={500} sx={{
                                color: order.billingStatus === 'paid' ? colors.success :
                                    order.billingStatus === 'invoiced' ? colors.warning.main : colors.text.secondary
                            }}>
                                {order.billingStatus.toUpperCase()}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isPaid}
                                onChange={(e) => setIsPaid(e.target.checked)}
                                sx={{
                                    color: colors.button.primary,
                                    '&.Mui-checked': {
                                        color: colors.button.primary,
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography variant="body1" fontWeight={500} color={colors.text.primary}>
                                Mark as Paid
                            </Typography>
                        }
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Payment Amount
                    </Typography>
                    <Typography variant="body2" color={colors.text.secondary} sx={{ mb: 2 }}>
                        Enter the actual payment amount received. This may be less than the invoice amount due to discounts or partial payments.
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        error={!!errors.paymentAmount}
                        helperText={errors.paymentAmount}
                        placeholder="Enter payment amount"
                        inputProps={{
                            min: 0,
                            max: order.amount || 0,
                            step: 0.01
                        }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, color: colors.text.secondary }}>$</Typography>
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '& fieldset': {
                                    borderColor: errors.paymentAmount ? colors.error : colors.border.light,
                                },
                                '&:hover fieldset': {
                                    borderColor: errors.paymentAmount ? colors.error : colors.border.medium,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: errors.paymentAmount ? colors.error : colors.button.primary,
                                },
                            },
                        }}
                    />
                </Box>

                {paymentAmount < (order.amount || 0) && (
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.warning.light || '#fff3cd',
                        borderRadius: '8px',
                        border: `1px solid ${colors.warning.main || '#ffc107'}`,
                        mb: 2
                    }}>
                        <Typography variant="body2" color={colors.warning.dark || '#856404'}>
                            <strong>Note:</strong> Payment amount (${paymentAmount}) is less than invoice amount (${order.amount || 0}).
                            This will be recorded as a partial payment.
                        </Typography>
                    </Box>
                )}

                {paymentAmount > (order.amount || 0) && (
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.info.light || '#d1ecf1',
                        borderRadius: '8px',
                        border: `1px solid ${colors.info.main || '#17a2b8'}`,
                        mb: 2
                    }}>
                        <Typography variant="body2" color={colors.info.dark || '#0c5460'}>
                            <strong>Note:</strong> Payment amount (${paymentAmount}) exceeds invoice amount (${order.amount || 0}).
                            This will be recorded as an overpayment.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                pt: 0,
                borderTop: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.light
            }}>
                <PrimaryButton
                    onClick={handleClose}
                    disabled={loading}
                    sx={{
                        backgroundColor: colors.text.muted,
                        color: colors.text.white,
                        '&:hover': {
                            backgroundColor: colors.text.muted,
                            opacity: 0.9
                        }
                    }}
                >
                    Cancel
                </PrimaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        backgroundColor: colors.button.primary,
                        color: colors.text.white,
                        '&:hover': {
                            backgroundColor: colors.button.primary,
                            opacity: 0.9
                        }
                    }}
                >
                    {loading ? 'Updating...' : 'Update Payment'}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentStatusModal;
