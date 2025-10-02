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

interface MachineAssignment {
    id: string;
    recordId: string;
    orderId: number;
    orderRef: string;
    trackingNumber?: string;
    customerName: string;
    item: string;
    assignedBy: string;
    assignedById: string;
    assignedTo: string;
    quantity: number;
    washingMachine: string;
    dryingMachine: string;
    assignedAt: string;
    status: string;
    returnQuantity?: number;
    createdAt: string;
    updatedAt: string;
}

interface CompletionStatusModalProps {
    open: boolean;
    onClose: () => void;
    assignment: MachineAssignment | null;
    onUpdate: (assignmentId: string, isCompleted: boolean, returnQuantity: number) => Promise<void>;
    loading?: boolean;
}

const CompletionStatusModal: React.FC<CompletionStatusModalProps> = ({
    open,
    onClose,
    assignment,
    onUpdate,
    loading = false
}) => {
    const [isCompleted, setIsCompleted] = useState(true);
    const [returnQuantity, setReturnQuantity] = useState(0);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialize form when assignment changes
    useEffect(() => {
        if (assignment) {
            setIsCompleted(true); // Default to true (checked)
            setReturnQuantity(assignment.returnQuantity || assignment.quantity);
            setErrors({});
        }
    }, [assignment]);

    // Ensure isCompleted is always true when modal opens
    useEffect(() => {
        if (open) {
            setIsCompleted(true);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!assignment) return;

        // Validation
        const newErrors: { [key: string]: string } = {};

        if (returnQuantity < 0) {
            newErrors.returnQuantity = 'Return quantity cannot be negative';
        }

        if (returnQuantity > assignment.quantity) {
            newErrors.returnQuantity = `Return quantity cannot exceed assigned quantity (${assignment.quantity})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onUpdate(assignment.id, isCompleted, returnQuantity);
            onClose();
        } catch (error) {
            console.error('Error updating completion status:', error);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!assignment) return null;

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
                    Update Assignment Status
                </Typography>
                <Typography variant="body2" color={colors.text.secondary} sx={{ mt: 0.5 }}>
                    Assignment #{assignment.trackingNumber || assignment.id}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Assignment Details
                    </Typography>
                    <Box sx={{
                        p: 2,
                        backgroundColor: colors.background.card,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.light}`
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Assigned To:</Typography>
                            <Typography variant="body2" fontWeight={500}>{assignment.assignedTo}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Quantity:</Typography>
                            <Typography variant="body2" fontWeight={500}>{assignment.quantity}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color={colors.text.secondary}>Washing Machine:</Typography>
                            <Typography variant="body2" fontWeight={500}>{assignment.washingMachine}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color={colors.text.secondary}>Drying Machine:</Typography>
                            <Typography variant="body2" fontWeight={500}>{assignment.dryingMachine}</Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
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
                                Mark as Completed
                            </Typography>
                        }
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color={colors.text.primary} sx={{ mb: 1, fontWeight: 600 }}>
                        Return Quantity
                    </Typography>
                    <Typography variant="body2" color={colors.text.secondary} sx={{ mb: 2 }}>
                        Enter the actual quantity returned. This may be less than the assigned quantity due to damage or other issues.
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(Number(e.target.value))}
                        error={!!errors.returnQuantity}
                        helperText={errors.returnQuantity}
                        placeholder="Enter return quantity"
                        inputProps={{
                            min: 0,
                            max: assignment.quantity,
                            step: 1
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                '& fieldset': {
                                    borderColor: errors.returnQuantity ? colors.error : colors.border.light,
                                },
                                '&:hover fieldset': {
                                    borderColor: errors.returnQuantity ? colors.error : colors.border.medium,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: errors.returnQuantity ? colors.error : colors.button.primary,
                                },
                            },
                        }}
                    />
                </Box>

                {returnQuantity < assignment.quantity && (
                    <Box sx={{
                        p: 2,
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        border: '1px solid #ffc107',
                        mb: 2
                    }}>
                        <Typography variant="body2" color="#856404">
                            <strong>Note:</strong> Return quantity ({returnQuantity}) is less than assigned quantity ({assignment.quantity}).
                            This difference will be tracked for inventory management.
                        </Typography>
                    </Box>
                )}
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
                    {loading ? 'Updating...' : 'Update Status'}
                </PrimaryButton>
            </DialogActions>
        </Dialog>
    );
};

export default CompletionStatusModal;
