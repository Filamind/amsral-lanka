import React from 'react';
import colors from '../../styles/colors';

interface PrimaryDatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    placeholder?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    fullWidth?: boolean;
    size?: 'small' | 'medium';
    name?: string;
}

const PrimaryDatePicker: React.FC<PrimaryDatePickerProps> = ({
    value = '',
    onChange,
    label,
    placeholder,
    error = false,
    helperText,
    disabled = false,
    required = false,
    className = '',
    fullWidth = true,
    size = 'medium',
    name,
    style,
    ...props
}) => {
    const sizeClasses = size === 'small' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base';

    return (
        <div className="flex flex-col">
            {label && (
                <label className="block text-sm font-medium mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="date"
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                placeholder={placeholder}
                className={`w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200 cursor-pointer ${sizeClasses} ${error ? 'border-red-500' : ''} ${className}`}
                style={{
                    borderColor: error ? colors.error : colors.border.light,
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    ...style,
                }}
                {...props}
            />
            {helperText && (
                <span className={`text-xs mt-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
                    {helperText}
                </span>
            )}
        </div>
    );
};

export default PrimaryDatePicker;
