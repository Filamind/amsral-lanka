import React from 'react';

interface FormFieldProps {
    children: React.ReactNode;
    label?: string;
    required?: boolean;
    error?: string;
    className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
    children,
    label,
    required = false,
    error,
    className = ""
}) => {
    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label className="block text-sm font-medium mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children}
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export default FormField;
