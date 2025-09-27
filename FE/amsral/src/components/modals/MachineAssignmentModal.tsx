import React, { useState } from 'react';
import {
    Modal,
    Box,
    Typography
} from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import PrimaryDropdown from '../common/PrimaryDropdown';
import colors from '../../styles/colors';

interface MachineAssignmentModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        assignedBy: string;
        quantity: number;
        washingMachine?: string;
        dryingMachine?: string;
    }) => Promise<void>;
    record?: {
        remainingQuantity: number;
    };
    employeeOptions: { value: string; label: string }[];
    washingMachineOptions: { value: string; label: string }[];
    dryingMachineOptions: { value: string; label: string }[];
}

const MachineAssignmentModal: React.FC<MachineAssignmentModalProps> = ({
    open,
    onClose,
    onSubmit,
    record,
    employeeOptions,
    washingMachineOptions,
    dryingMachineOptions,
}) => {
    const [form, setForm] = useState({
        assignedBy: '',
        quantity: 1,
        washingMachine: '',
        dryingMachine: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!form.assignedBy) {
            newErrors.assignedBy = 'Please select an employee';
        }

        if (!form.quantity || form.quantity <= 0) {
            newErrors.quantity = 'Please enter a valid quantity';
        } else if (record && form.quantity > record.remainingQuantity) {
            newErrors.quantity = `Quantity cannot exceed remaining quantity (${record.remainingQuantity})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                assignedBy: form.assignedBy,
                quantity: Number(form.quantity),
                washingMachine: form.washingMachine || undefined,
                dryingMachine: form.dryingMachine || undefined
            });

            // Reset form on success
            setForm({
                assignedBy: '',
                quantity: 1,
                washingMachine: '',
                dryingMachine: ''
            });
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error creating assignment:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setForm({
                assignedBy: '',
                quantity: 1,
                washingMachine: '',
                dryingMachine: ''
            });
            setErrors({});
            onClose();
        }
    };

    // Common field styles to ensure consistent alignment
    const fieldContainerStyle = {
        display: 'flex',
        flexDirection: 'column' as const,
        margin: 0,
        padding: 0,
        minHeight: '90px' // Consistent height to account for error messages
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        marginBottom: '8px',
        color: colors.text.primary,
        lineHeight: '20px',
        margin: '0 0 8px 0',
        padding: 0
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: `1px solid ${colors.border.light}`,
        borderRadius: '12px',
        fontSize: '16px',
        lineHeight: '24px',
        outline: 'none',
        boxSizing: 'border-box' as const,
        margin: 0,
        fontFamily: 'inherit',
        backgroundColor: '#fff',
        transition: 'border-color 0.2s ease-in-out',
        height: '48px' // Fixed height for consistency
    };

    const errorStyle = {
        fontSize: '12px',
        color: '#ef4444',
        marginTop: '4px',
        lineHeight: '16px',
        minHeight: '20px', // Reserve space for error messages
        margin: '4px 0 0 0',
        padding: 0
    };

    const dropdownOverrideStyle = {
        margin: '0 !important',
        padding: '0 !important',
        borderColor: `${colors.border.light} !important`,
        height: '48px !important',
        boxSizing: 'border-box' as const,
        '& .MuiOutlinedInput-root': {
            padding: '0 !important',
            margin: '0 !important',
            height: '48px !important'
        },
        '& .MuiInputBase-input': {
            padding: '12px 16px !important',
            margin: '0 !important',
            height: 'auto !important',
            boxSizing: 'border-box' as const
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="machine-assignment-modal"
            disableEscapeKeyDown={saving}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: { xs: '95%', sm: '90%', md: '1000px', lg: '1200px' },
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    overflow: 'auto',
                    p: { xs: 3, sm: 4 }
                }}
            >
                <Typography variant="h6" fontWeight={700} mb={3} color={colors.text.primary}>
                    Add Machine Assignment
                </Typography>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Assign To and Quantity Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px',
                            alignItems: 'start'
                        }}>
                            <div style={fieldContainerStyle}>
                                <label style={labelStyle}>
                                    Assign To <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative', margin: 0, padding: 0 }}>
                                    <PrimaryDropdown
                                        name="assignedBy"
                                        value={form.assignedBy}
                                        onChange={handleChange}
                                        options={employeeOptions}
                                        placeholder="Select employee"
                                        error={!!errors.assignedBy}
                                        style={dropdownOverrideStyle}
                                        className=""
                                    />
                                </div>
                                <div style={errorStyle}>
                                    {errors.assignedBy || ''}
                                </div>
                            </div>

                            <div style={fieldContainerStyle}>
                                <label style={labelStyle}>
                                    Quantity <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    max={record?.remainingQuantity || 1}
                                    value={form.quantity}
                                    onChange={handleChange}
                                    style={{
                                        ...inputStyle,
                                        borderColor: errors.quantity ? '#ef4444' : colors.border.light
                                    }}
                                />
                                <div style={errorStyle}>
                                    {errors.quantity || ''}
                                </div>
                            </div>
                        </div>

                        {/* Washing Machine and Drying Machine Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px',
                            alignItems: 'start'
                        }}>
                            <div style={fieldContainerStyle}>
                                <label style={labelStyle}>
                                    Washing Machine <span style={{ color: '#6b7280' }}>(Optional)</span>
                                </label>
                                <div style={{ position: 'relative', margin: 0, padding: 0 }}>
                                    <PrimaryDropdown
                                        name="washingMachine"
                                        value={form.washingMachine}
                                        onChange={handleChange}
                                        options={washingMachineOptions}
                                        placeholder="Select washing machine (optional)"
                                        error={!!errors.washingMachine}
                                        style={dropdownOverrideStyle}
                                        className=""
                                    />
                                </div>
                                <div style={errorStyle}>
                                    {errors.washingMachine || ''}
                                </div>
                            </div>

                            <div style={fieldContainerStyle}>
                                <label style={labelStyle}>
                                    Drying Machine <span style={{ color: '#6b7280' }}>(Optional)</span>
                                </label>
                                <div style={{ position: 'relative', margin: 0, padding: 0 }}>
                                    <PrimaryDropdown
                                        name="dryingMachine"
                                        value={form.dryingMachine}
                                        onChange={handleChange}
                                        options={dryingMachineOptions}
                                        placeholder="Select drying machine (optional)"
                                        error={!!errors.dryingMachine}
                                        style={dropdownOverrideStyle}
                                        className=""
                                    />
                                </div>
                                <div style={errorStyle}>
                                    {errors.dryingMachine || ''}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginTop: '24px',
                            justifyContent: 'flex-end',
                            paddingTop: '8px'
                        }}>
                            <PrimaryButton
                                type="button"
                                style={{
                                    minWidth: 120,
                                    background: colors.primary[100],
                                    color: colors.text.primary,
                                    margin: 0,
                                    padding: '12px 24px'
                                }}
                                onClick={handleClose}
                                disabled={saving}
                            >
                                Cancel
                            </PrimaryButton>
                            <PrimaryButton
                                type="submit"
                                style={{
                                    minWidth: 140,
                                    margin: 0,
                                    padding: '12px 24px'
                                }}
                                disabled={saving}
                            >
                                {saving ? 'Creating...' : 'Create Assignment'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </Box>
        </Modal>
    );
};

export default MachineAssignmentModal;