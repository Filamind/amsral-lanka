import React from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    OutlinedInput,
    Checkbox,
    ListItemText
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { styled } from '@mui/material/styles';
import colors from '../../styles/colors';

type Option = {
    value: string;
    label: string;
};

type PrimaryMultiSelectProps = {
    name: string;
    value: string[];
    onChange: (e: { target: { name: string; value: string[] } }) => void;
    options: Option[];
    placeholder?: string;
    error?: boolean;
    className?: string;
    style?: React.CSSProperties;
};

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

const StyledChip = styled(Chip)(() => ({
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
    border: `1px solid ${colors.primary[200]}`,
    '& .MuiChip-deleteIcon': {
        color: colors.primary[600],
        '&:hover': {
            color: colors.primary[800],
        },
    },
    margin: '2px',
    height: '24px',
    fontSize: '0.75rem',
}));

const PrimaryMultiSelect: React.FC<PrimaryMultiSelectProps> = ({
    name,
    value = [],
    onChange,
    options,
    placeholder = "Select options",
    error = false,
    className = "",
    style = {},
}) => {
    const handleChange = (event: SelectChangeEvent<string[]>) => {
        const selectedValues = typeof event.target.value === 'string'
            ? event.target.value.split(',')
            : event.target.value;
        onChange({
            target: {
                name,
                value: selectedValues
            }
        });
    };

    const handleDelete = (valueToDelete: string) => {
        const newValue = value.filter(item => item !== valueToDelete);
        onChange({
            target: {
                name,
                value: newValue
            }
        });
    };

    const renderValue = (selected: string[]) => {
        if (selected.length === 0) {
            return (
                <Typography
                    variant="body1"
                    sx={{ color: colors.text.muted }}
                >
                    {placeholder}
                </Typography>
            );
        }

        if (selected.length <= 3) {
            return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((val) => {
                        const option = options.find(opt => opt.value === val);
                        return (
                            <StyledChip
                                key={val}
                                label={option?.label || val}
                                onDelete={() => handleDelete(val)}
                                size="small"
                            />
                        );
                    })}
                </Box>
            );
        }

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.slice(0, 3).map((val) => {
                    const option = options.find(opt => opt.value === val);
                    return (
                        <StyledChip
                            key={val}
                            label={option?.label || val}
                            onDelete={() => handleDelete(val)}
                            size="small"
                        />
                    );
                })}
                <StyledChip
                    label={`+${selected.length - 3} more`}
                    size="small"
                    sx={{
                        backgroundColor: colors.secondary[200],
                        color: colors.secondary[700],
                        border: `1px solid ${colors.secondary[300]}`,
                    }}
                />
            </Box>
        );
    };

    return (
        <Box className={className} style={style}>
            <StyledFormControl
                fullWidth={true}
                error={error}
                size="medium"
            >
                <Select
                    multiple
                    value={value}
                    onChange={handleChange}
                    input={<OutlinedInput />}
                    renderValue={renderValue}
                    displayEmpty
                >
                    {options.map((option) => (
                        <StyledMenuItem key={option.value} value={option.value}>
                            <Checkbox
                                checked={value.indexOf(option.value) > -1}
                                sx={{
                                    color: colors.primary[500],
                                    '&.Mui-checked': {
                                        color: colors.primary[600],
                                    },
                                }}
                            />
                            <ListItemText primary={option.label} />
                        </StyledMenuItem>
                    ))}
                </Select>
            </StyledFormControl>
        </Box>
    );
};

export default PrimaryMultiSelect;