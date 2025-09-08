import React from 'react';
import { Box } from '@mui/material';
import PrimaryButton from '../common/PrimaryButton';
import colors from '../../styles/colors';

interface OrderFormActionsProps {
    loading: boolean;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

const OrderFormActions: React.FC<OrderFormActionsProps> = ({
    loading,
    onCancel,
    onSubmit,
}) => {
    return (
        <Box className="pt-4 mt-6">
            <div className="flex justify-end gap-4">
                <PrimaryButton
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-3 text-base"
                    style={{
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary,
                        border: `1px solid ${colors.border.medium}`,
                        borderRadius: '8px',
                    }}
                >
                    Cancel
                </PrimaryButton>
                <PrimaryButton
                    type="submit"
                    onClick={onSubmit}
                    disabled={loading}
                    className="px-6 py-3 text-base"
                    style={{
                        backgroundColor: colors.primary[500],
                        color: colors.text.white,
                        border: 'none',
                        borderRadius: '8px',
                    }}
                >
                    {loading ? 'Saving...' : 'Save Order'}
                </PrimaryButton>
            </div>
        </Box>
    );
};

export default OrderFormActions;
