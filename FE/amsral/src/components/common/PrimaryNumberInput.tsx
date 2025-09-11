import React, { useRef } from 'react';
import colors from '../../styles/colors';

interface PrimaryNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
    value?: number;
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
    min?: number;
    max?: number;
    step?: number;
    clearOnFocus?: boolean; // New prop to enable auto-clear on focus
}

const PrimaryNumberInput: React.FC<PrimaryNumberInputProps> = ({
    value = 0,
    onChange,
    label,
    placeholder,
    error = false,
    helperText,
    disabled = false,
    required = false,
    className = '',
    size = 'medium',
    name,
    min,
    max,
    step,
    clearOnFocus = true, // Default to true for mobile-friendly behavior
    style,
    ...props
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const sizeClasses = size === 'small' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base';

    // Handle focus event to clear content if clearOnFocus is enabled
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (clearOnFocus && value !== 0) {
            // Select all text so user can immediately start typing
            e.target.select();
        }
        // Call original onFocus if provided
        if (props.onFocus) {
            props.onFocus(e);
        }
    };

    // Handle click event to clear content on mobile/tablet
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        if (clearOnFocus && value !== 0) {
            // Select all text so user can immediately start typing
            e.currentTarget.select();
        }
        // Call original onClick if provided
        if (props.onClick) {
            props.onClick(e);
        }
    };

    return (
        <div className="flex flex-col">
            {label && (
                <label className="block text-sm font-medium mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                ref={inputRef}
                type="number"
                name={name}
                value={value}
                onChange={onChange}
                onFocus={handleFocus}
                onClick={handleClick}
                disabled={disabled}
                required={required}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200 cursor-pointer ${sizeClasses} ${error ? 'border-red-500' : ''} ${className}`}
                style={{
                    borderColor: error ? colors.error : colors.border.light,
                    backgroundColor: colors.background.primary,
                    color: colors.text.primary,
                    fontSize: size === 'small' ? '16px' : '18px', // Prevent zoom on iOS
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

export default PrimaryNumberInput;
