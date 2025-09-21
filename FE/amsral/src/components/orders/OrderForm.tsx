import React from 'react';
import { Box, Typography } from '@mui/material';
import PrimaryDropdown from '../common/PrimaryDropdown';
import PrimaryNumberInput from '../common/PrimaryNumberInput';
import colors from '../../styles/colors';

interface OrderFormProps {
    form: {
        customerId: string;
        quantity: number;
    };
    errors: { [key: string]: string };
    customerOptions: { value: string; label: string }[];
    optionsLoading: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
    form,
    errors,
    customerOptions,
    optionsLoading,
    onChange,
}) => {
    return (
        <Box>
            <Typography
                variant="h5"
                fontWeight={600}
                color={colors.text.primary}
                sx={{ mb: 3 }}
            >
                Add Order
            </Typography>

            <div className="flex items-center gap-6">
                <div className="flex-1">
                    <PrimaryDropdown
                        name="customerId"
                        value={form.customerId}
                        onChange={onChange}
                        options={customerOptions}
                        placeholder={optionsLoading ? "Loading customers..." : "Select a customer"}
                        error={!!errors.customerId}
                        disabled={optionsLoading}
                        className="px-4 py-4 text-lg"
                        style={{ borderColor: colors.border.light }}
                    />
                    {errors.customerId && <span className="text-xs text-red-500 mt-1 block">{errors.customerId}</span>}
                </div>

                <div className="flex-1">
                    <PrimaryNumberInput
                        name="quantity"
                        value={form.quantity}
                        onChange={onChange}
                        label=""
                        placeholder="Enter quantity"
                        min={1}
                        error={!!errors.quantity}
                        helperText={errors.quantity}
                        className="text-lg"
                    />
                </div>
            </div>
        </Box>
    );
};

export default OrderForm;
