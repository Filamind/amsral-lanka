import React from 'react';
import { Box, Typography, TextareaAutosize } from '@mui/material';
import PrimaryDatePicker from '../common/PrimaryDatePicker';
import FormGrid from './FormGrid';
import FormField from './FormField';
import colors from '../../styles/colors';

interface AdditionalInformationProps {
    form: {
        date: string;
        deliveryDate: string;
        notes: string;
    };
    errors: { [key: string]: string };
    showAdditional: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onToggle: () => void;
}

const AdditionalInformation: React.FC<AdditionalInformationProps> = ({
    form,
    errors,
    showAdditional,
    onChange,
    onToggle,
}) => {
    return (
        <Box className="border-t pt-4">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center justify-between w-full text-left"
            >
                <Typography variant="h6" fontWeight={600} color={colors.text.primary}>
                    Additional Information
                </Typography>
                <span className="text-2xl" style={{ color: colors.primary[500] }}>
                    {showAdditional ? '−' : '+'}
                </span>
            </button>

            {showAdditional && (
                <div className="mt-4">
                    <FormGrid>
                        <FormField
                            label="Order Date"
                            required
                            error={errors.date}
                        >
                            <PrimaryDatePicker
                                name="date"
                                value={form.date}
                                onChange={onChange}
                                label=""
                                error={!!errors.date}
                                helperText={errors.date}
                                className="text-lg"
                            />
                        </FormField>

                        <FormField label="Delivery Date">
                            <PrimaryDatePicker
                                name="deliveryDate"
                                value={form.deliveryDate}
                                onChange={onChange}
                                label=""
                                className="text-lg"
                            />
                        </FormField>
                    </FormGrid>

                    <FormField label="Notes" className="mt-6">
                        <TextareaAutosize
                            name="notes"
                            value={form.notes}
                            onChange={onChange}
                            placeholder="Enter any additional notes..."
                            className="w-full px-4 py-3 border rounded-xl focus:outline-none text-base resize-none"
                            style={{
                                borderColor: colors.border.light,
                                backgroundColor: colors.background.primary,
                                color: colors.text.primary,
                                minHeight: '100px',
                            }}
                        />
                    </FormField>
                </div>
            )}
        </Box>
    );
};

export default AdditionalInformation;
