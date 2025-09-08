import React from "react";
import {
    FormControl,
    Select,
    MenuItem,
    Box,
    Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { styled } from '@mui/material/styles';
import colors from '../../styles/colors';

interface DropdownOption {
    value: string;
    label: string;
}

interface PrimaryDropdownProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    options: DropdownOption[];
    placeholder?: string;
    error?: boolean;
    className?: string;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    value?: string;
}

const StyledFormControl = styled(FormControl)(({ error }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: colors.background.primary,
        '& fieldset': {
            borderColor: error ? colors.error : colors.border.light,
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: error ? colors.error : colors.primary[300],
        },
        '&.Mui-focused fieldset': {
            borderColor: error ? colors.error : colors.primary[500],
            borderWidth: '2px',
        },
        '&.Mui-disabled fieldset': {
            borderColor: colors.border.light,
            backgroundColor: colors.background.secondary,
        },
    },
    '& .MuiInputLabel-root': {
        color: colors.text.secondary,
        '&.Mui-focused': {
            color: colors.primary[500],
        },
        '&.Mui-disabled': {
            color: colors.text.muted,
        },
    },
    '& .MuiSelect-select': {
        color: colors.text.primary,
        padding: '12px 14px',
        '&.Mui-disabled': {
            color: colors.text.muted,
        },
    },
    '& .MuiFormHelperText-root': {
        color: error ? colors.error : colors.text.secondary,
        marginLeft: '14px',
        marginTop: '4px',
    },
}));

const StyledMenuItem = styled(MenuItem)(() => ({
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    '&:hover': {
        backgroundColor: colors.primary[50],
    },
    '&.Mui-selected': {
        backgroundColor: colors.primary[100],
        '&:hover': {
            backgroundColor: colors.primary[200],
        },
    },
    '&.Mui-disabled': {
        color: colors.text.muted,
        backgroundColor: colors.background.secondary,
    },
}));

const PrimaryDropdown: React.FC<PrimaryDropdownProps> = ({
    options,
    placeholder = "Select an option",
    error = false,
    className = "",
    onChange,
    value = "",
    name,
    disabled = false,
    required = false,
    style
}) => {
    const handleChange = (event: SelectChangeEvent<string>) => {
        if (onChange) {
            // Create a synthetic event that matches the original API
            const syntheticEvent = {
                target: {
                    name: name || '',
                    value: event.target.value
                }
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange(syntheticEvent);
        }
    };

    return (
        <Box className={className} style={style}>
            <StyledFormControl
                fullWidth={true}
                error={error}
                disabled={disabled}
                required={required}
                size="medium"
            >
                <Select
                    value={value}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => {
                        if (!selected) {
                            return (
                                <Typography
                                    variant="body1"
                                    sx={{ color: colors.text.muted }}
                                >
                                    {placeholder}
                                </Typography>
                            );
                        }
                        const option = options.find(opt => opt.value === selected);
                        return option?.label || selected;
                    }}
                >
                    {options.map((option) => (
                        <StyledMenuItem key={option.value} value={option.value}>
                            {option.label}
                        </StyledMenuItem>
                    ))}
                </Select>
            </StyledFormControl>
        </Box>
    );
};

export default PrimaryDropdown;