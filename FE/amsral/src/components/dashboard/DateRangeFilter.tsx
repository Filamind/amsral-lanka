import React, { useState } from 'react';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarToday, KeyboardArrowDown } from '@mui/icons-material';
import colors from '../../styles/colors';

export interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    loading?: boolean;
}

const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
    { value: 'quarter', label: 'Last 3 months' },
    { value: 'year', label: 'Last year' },
    { value: 'custom', label: 'Custom range' },
];

export default function DateRangeFilter({ value, onChange, loading = false }: DateRangeFilterProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handlePeriodSelect = (period: string) => {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = now;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'custom':
                // Keep current dates for custom range
                startDate = value.startDate;
                endDate = value.endDate;
                break;
        }

        onChange({
            startDate,
            endDate,
            period: period as any,
        });

        setAnchorEl(null);
    };

    const handleCustomDateChange = (field: 'startDate' | 'endDate', date: Date | null) => {
        onChange({
            ...value,
            [field]: date,
            period: 'custom',
        });
    };

    const formatDateRange = () => {
        if (value.period === 'custom') {
            if (value.startDate && value.endDate) {
                return `${value.startDate.toLocaleDateString()} - ${value.endDate.toLocaleDateString()}`;
            }
            return 'Select date range';
        }

        const option = periodOptions.find(opt => opt.value === value.period);
        return option?.label || 'Select period';
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {/* Period Selector */}
                <Button
                    variant="outlined"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    endIcon={<KeyboardArrowDown />}
                    disabled={loading}
                    sx={{
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                        textTransform: 'none',
                        minWidth: 160,
                        '&:hover': {
                            borderColor: colors.primary[500],
                            backgroundColor: colors.primary[50],
                        },
                    }}
                >
                    <CalendarToday sx={{ mr: 1, fontSize: '1rem' }} />
                    {formatDateRange()}
                </Button>

                {/* Custom Date Pickers */}
                {value.period === 'custom' && (
                    <>
                        <DatePicker
                            label="Start Date"
                            value={value.startDate}
                            onChange={(date) => handleCustomDateChange('startDate', date)}
                            disabled={loading}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderColor: colors.border.light,
                                        },
                                    },
                                },
                            }}
                        />
                        <DatePicker
                            label="End Date"
                            value={value.endDate}
                            onChange={(date) => handleCustomDateChange('endDate', date)}
                            disabled={loading}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: {
                                        '& .MuiOutlinedInput-root': {
                                            borderColor: colors.border.light,
                                        },
                                    },
                                },
                            }}
                        />
                    </>
                )}

                {/* Period Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            minWidth: 160,
                            border: `1px solid ${colors.border.light}`,
                            borderRadius: 2,
                        },
                    }}
                >
                    {periodOptions.map((option) => (
                        <MenuItem
                            key={option.value}
                            onClick={() => handlePeriodSelect(option.value)}
                            selected={value.period === option.value}
                            sx={{
                                fontSize: '0.875rem',
                                '&.Mui-selected': {
                                    backgroundColor: colors.primary[50],
                                    color: colors.primary[700],
                                },
                            }}
                        >
                            {option.label}
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </LocalizationProvider>
    );
}
