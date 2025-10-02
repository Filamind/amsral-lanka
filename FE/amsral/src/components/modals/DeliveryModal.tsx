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
    Divider
} from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryNumberInput from '../common/PrimaryNumberInput';
import colors from '../../styles/colors';

interface DeliveryModalProps {
    open: boolean;
    onClose: () => void;
    order: {
        id: number;
        customerName: string;
        quantity: number;
        returnQuantity?: number;
        deliveryQuantity?: number;
        status?: string;
    } | null;
    onUpdate: (orderId: number, deliveryCount: number, isDelivered: boolean) => Promise<void>;
    loading?: boolean;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({
    open,
    onClose,
    order,
    onUpdate,
    loading = false
}) => {
    const [deliveryCount, setDeliveryCount] = useState<number | null>(null);
    const [isDelivered, setIsDelivered] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialize form when order changes
    useEffect(() => {
        if (order) {
            setDeliveryCount(null);
            setIsDelivered(true); // Default to true (checked)
            setErrors({});
        }
    }, [order]);

    // Ensure isDelivered is always true when modal opens
    useEffect(() => {
        if (open) {
            setIsDelivered(true);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!order) return;

        // Validation
        const newErrors: { [key: string]: string } = {};

        // Calculate the final delivery count for validation
        const finalDeliveryCount = (deliveryCount === null || deliveryCount === 0)
            ? availableQuantity
            : deliveryCount;

        if (finalDeliveryCount < 0) {
            newErrors.deliveryCount = 'Delivery count cannot be negative';
        }

        if (finalDeliveryCount > availableQuantity) {
            newErrors.deliveryCount = `Delivery count cannot exceed available quantity (${availableQuantity})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            // If delivery count is null/empty or 0, use available quantity as delivery count
            const finalDeliveryCount = (deliveryCount === null || deliveryCount === 0)
                ? availableQuantity
                : deliveryCount;

            await onUpdate(order.id, finalDeliveryCount, isDelivered);
            onClose();
        } catch (error) {
            console.error('Error updating delivery status:', error);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!order) return null;

    const availableQuantity = (order.returnQuantity || 0) - (order.deliveryQuantity || 0);

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
                    Update Delivery Status
                </Typography>
                <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                    Order #{order.id} - {order.customerName}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Order Details
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.background.card,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.light}`
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Total Quantity:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.quantity}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Return Quantity:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.returnQuantity || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Delivery Quantity:</Typography>
                            <Typography variant="body2" fontWeight={500}>{order.deliveryQuantity || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color={colors.text.secondary}>Available for Delivery:</Typography>
                            <Typography variant="body2" fontWeight={500} color={colors.button.primary}>
                                {availableQuantity}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Delivery Information
                    </Typography>
                    <PrimaryNumberInput
                        label="Delivery Count (Optional)"
                        value={deliveryCount === null ? undefined : deliveryCount}
                        onChange={(e) => {
                            const value = e.target.value;
                            setDeliveryCount(value === '' ? null : Number(value));
                        }}
                        error={!!errors.deliveryCount}
                        helperText={errors.deliveryCount || "Leave empty to use available quantity as delivery count"}
                        placeholder="Enter number of items to deliver (optional)"
                        min={0}
                        max={availableQuantity}
                        fullWidth
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isDelivered}
                                onChange={(e) => setIsDelivered(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Mark as Delivered"
                        sx={{ fontWeight: 500 }}
                    />
                </Box>

                {(deliveryCount !== null && deliveryCount > 0) || (deliveryCount === null || deliveryCount === 0) ? (
                    <Box sx={{
                        p: 2,
                        backgroundColor: '#f0f9ff',
                        borderRadius: '8px',
                        border: '1px solid #0ea5e9'
                    }}>
                        <Typography variant="body2" color="#0c4a6e" sx={{ fontWeight: 500 }}>
                            <strong>Delivery Summary:</strong>
                        </Typography>
                        <Typography variant="body2" color="#0c4a6e" sx={{ mt: 0.5 }}>
                            • Delivering: {(deliveryCount === null || deliveryCount === 0) ? availableQuantity : deliveryCount} items
                        </Typography>
                        <Typography variant="body2" color="#0c4a6e">
                            • Remaining: {typeof availableQuantity === 'number' ? availableQuantity - ((deliveryCount === null || deliveryCount === 0) ? availableQuantity : deliveryCount) : '-'} items
                        </Typography>
                    </Box>
                ) : null}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                borderTop: `1px solid ${colors.border.light}`,
                backgroundColor: colors.background.card
            }}>
                <PrimaryButton
                    onClick={handleClose}
                    disabled={loading}
                    style={{
                        minWidth: 100,
                        background: colors.primary[100],
                        color: colors.text.primary
                    }}
                >
                    Cancel
                </PrimaryButton>
                <PrimaryButton
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ minWidth: 140 }}
                >
                    {loading ? 'Updating...' : 'Update Delivery'}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default DeliveryModal;

