import React from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import PrimaryDatePicker from '../common/PrimaryDatePicker';
import PrimaryDropdown from '../common/PrimaryDropdown';
import colors from '../../styles/colors';

interface SimpleOrderFormProps {
    form: {
        customerId: string;
        itemId: string;
        quantity: string;
        gpNo: string;
        date: string;
        deliveryDate: string;
        notes: string;
    };
    errors: { [key: string]: string };
    customerOptions: { value: string; label: string }[];
    itemOptions: { value: string; label: string }[];
    optionsLoading: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    showAdditional: boolean;
    onToggleAdditional: () => void;
    isEditing?: boolean;
}

const SimpleOrderForm: React.FC<SimpleOrderFormProps> = ({
    form,
    errors,
    customerOptions,
    itemOptions,
    optionsLoading,
    onChange,
    showAdditional,
    onToggleAdditional,
    isEditing = false,
}) => {
    return (
        <Box>
            <Typography
                variant="h5"
                fontWeight={600}
                color={colors.text.primary}
                sx={{ mb: 3 }}
            >
                {isEditing ? 'Edit Order' : 'Create New Order'}
            </Typography>

            <div className="space-y-6">
                {/* Quantity and GP No - First Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    {/* Quantity - No Label */}
                    <div>
                        <input
                            type="number"
                            name="quantity"
                            value={form.quantity}
                            onChange={onChange}
                            placeholder="Quantity (Optional)"
                            min={1}
                            autoFocus
                            className="w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: errors.quantity ? '#ef4444' : colors.border.light }}
                        />
                        {errors.quantity && <span className="text-xs text-red-500 mt-1 block">{errors.quantity}</span>}
                    </div>

                    {/* GP No - No Label */}
                    <div>
                        <input
                            type="number"
                            name="gpNo"
                            value={form.gpNo}
                            onChange={onChange}
                            placeholder="GP No"
                            min={1}
                            className="w-full px-4 py-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: errors.gpNo ? '#ef4444' : colors.border.light }}
                        />
                        {errors.gpNo && <span className="text-xs text-red-500 mt-1 block">{errors.gpNo}</span>}
                    </div>
                </div>

                {/* Customer and Item Selection - Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <div>
                        <PrimaryDropdown
                            name="customerId"
                            value={form.customerId}
                            onChange={onChange}
                            options={customerOptions}
                            placeholder={optionsLoading ? "Loading customers..." : "Select a customer"}
                            error={!!errors.customerId}
                            disabled={optionsLoading}
                            className="w-full py-4 text-lg"
                            style={{
                                borderColor: errors.customerId ? '#ef4444' : colors.border.light,
                                paddingLeft: '0px',
                                paddingRight: '16px'
                            }}
                        />
                        {errors.customerId && <span className="text-xs text-red-500 mt-1 block">{errors.customerId}</span>}
                    </div>

                    {/* Item Selection */}
                    <div>
                        <PrimaryDropdown
                            name="itemId"
                            value={form.itemId}
                            onChange={onChange}
                            options={itemOptions}
                            placeholder={optionsLoading ? "Loading items..." : "Select an item"}
                            error={!!errors.itemId}
                            disabled={optionsLoading}
                            className="w-full py-4 text-lg"
                            style={{
                                borderColor: errors.itemId ? '#ef4444' : colors.border.light,
                                paddingLeft: '0px',
                                paddingRight: '16px'
                            }}
                        />
                        {errors.itemId && <span className="text-xs text-red-500 mt-1 block">{errors.itemId}</span>}
                    </div>
                </div>

                {/* Additional Information - Collapsible */}
                <div className="border-t pt-4">
                    <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={onToggleAdditional}
                    >
                        <Typography variant="h6" fontWeight={500} color={colors.text.primary}>
                            Additional Information
                        </Typography>
                        <IconButton size="small">
                            {showAdditional ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </div>

                    <Collapse in={showAdditional}>
                        <div className="mt-4 space-y-4">
                            {/* Date and Delivery Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Date *
                                    </label>
                                    <PrimaryDatePicker
                                        name="date"
                                        value={form.date}
                                        onChange={onChange}
                                        error={!!errors.date}
                                        helperText={errors.date}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Delivery Date *
                                    </label>
                                    <PrimaryDatePicker
                                        name="deliveryDate"
                                        value={form.deliveryDate}
                                        onChange={onChange}
                                        error={!!errors.deliveryDate}
                                        helperText={errors.deliveryDate}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={onChange}
                                    placeholder="Add any special instructions or notes..."
                                    rows={3}
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    style={{ borderColor: colors.border.light }}
                                />
                                {errors.notes && <span className="text-xs text-red-500 mt-1 block">{errors.notes}</span>}
                            </div>
                        </div>
                    </Collapse>
                </div>

                {/* Info Box */}
                {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Next Steps
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>After creating this order, you can:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Add process records by clicking on the order in the table</li>
                                <li>Edit the order details anytime</li>
                                <li>Track progress as you add more records</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div> */}
            </div>
        </Box>
    );
};

export default SimpleOrderForm;
