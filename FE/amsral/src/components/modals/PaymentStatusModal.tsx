import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Divider
} from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import colors from '../../styles/colors';

interface Invoice {
    id: number;
    invoiceNumber: string;
    customerName: string;
    customerId: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    dueDate: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    paymentAmount?: number; // Legacy field
    payment?: number; // New payment field
    balance?: number; // Customer balance amount
    createdAt: string;
    updatedAt?: string;
}

interface PaymentStatusModalProps {
    open: boolean;
    onClose: () => void;
    order: Invoice | null;
    onUpdate: (orderId: number, paymentAmount: number) => Promise<void>;
    loading?: boolean;
}

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
    open,
    onClose,
    order,
    onUpdate,
    loading = false
}) => {
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialize form when order changes
    useEffect(() => {
        if (order) {
            // Calculate default payment amount as (Invoice Amount - Paid Amount)
            const invoiceAmount = order.total || 0;
            const paidAmount = order.payment || order.paymentAmount || 0;
            const remainingAmount = Math.max(0, invoiceAmount - paidAmount);

            setPaymentAmount(remainingAmount);
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

        const invoiceAmount = order.total || 0;
        const currentPaidAmount = order.payment || order.paymentAmount || 0;
        const totalPaymentAfterThis = currentPaidAmount + paymentAmount;

        if (totalPaymentAfterThis > invoiceAmount) {
            newErrors.paymentAmount = `Total payment (${currentPaidAmount} + ${paymentAmount} = ${totalPaymentAfterThis}) cannot exceed invoice amount (${invoiceAmount})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // Backend will determine payment status based on payment amount
            await onUpdate(order.id, paymentAmount);
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
                backgroundColor: colors.background.card
            }}>
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                    Record Payment
                </Typography>
                <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                    Invoice #{order.invoiceNumber}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Invoice Details
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.background.card,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.light}`
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Customer:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.customerName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Due Date:</Typography>
                            <Typography variant="body2" fontWeight={500}>
                                {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Invoice Amount:</Typography>
                            <Typography variant="body2" fontWeight={500} color={colors.button.primary}>
                                ${order.total || 0}
                            </Typography>
                        </Box>
                        {order.balance !== undefined && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color={colors.text.secondary}>Customer Balance:</Typography>
                                <Typography variant="body2" fontWeight={500} color={order.balance > 0 ? '#f57c00' : colors.text.primary}>
                                    ${order.balance || 0}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color={colors.text.secondary}>Status:</Typography>
                            <Typography variant="body2" fontWeight={500} sx={{
                                color: order.status === 'paid' ? colors.success :
                                    order.status === 'sent' ? colors.warning : colors.text.secondary
                            }}>
                                {order.status.toUpperCase()}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Payment Amount
                    </Typography>
                    {/* <Typography variant="body2" color={colors.text.secondary} sx={{ mb: 2 }}>
                        Enter the actual payment amount received. This may be less than the invoice amount due to discounts or partial payments.
                    </Typography> */}
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
                            max: order.total || 0,
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

                {paymentAmount < (order.total || 0) && (
                    <Box sx={{
                        p: 2,
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffc107',
                        mb: 2
                    }}>
                        <Typography variant="body2" color="#856404">
                            <strong>Note:</strong> Payment amount (${paymentAmount}) is less than invoice amount (${order.total || 0}).
                            This will be recorded as a partial payment.
                        </Typography>
                    </Box>
                )}

                {(() => {
                    const invoiceAmount = order.total || 0;
                    const currentPaidAmount = order.payment || order.paymentAmount || 0;
                    const totalPaymentAfterThis = currentPaidAmount + paymentAmount;

                    return totalPaymentAfterThis > invoiceAmount && (
                        <Box sx={{
                            p: 2,
                            backgroundColor: '#d1ecf1',
                            borderRadius: '8px',
                            border: '1px solid #17a2b8',
                            mb: 2
                        }}>
                            <Typography variant="body2" color="#0c5460">
                                <strong>Note:</strong> Total payment (${currentPaidAmount} + ${paymentAmount} = ${totalPaymentAfterThis}) exceeds invoice amount (${invoiceAmount}).
                                This will be recorded as an overpayment.
                            </Typography>
                        </Box>
                    );
                })()}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                pt: 0,
                borderTop: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.card
            }}>
                <PrimaryButton
                    onClick={handleClose}
                    disabled={loading}
                    style={{
                        backgroundColor: colors.text.muted,
                        color: colors.text.white
                    }}
                >
                    Cancel
                </PrimaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        backgroundColor: colors.button.primary,
                        color: colors.text.white
                    }}
                >
                    {loading ? 'Recording...' : 'Record Payment'}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentStatusModal;
