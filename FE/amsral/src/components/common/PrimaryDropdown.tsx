import React from "react";
import colors from "../../styles/colors";

interface DropdownOption {
    value: string;
    label: string;
}

interface PrimaryDropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: DropdownOption[];
    placeholder?: string;
    error?: boolean;
    className?: string;
}

const PrimaryDropdown: React.FC<PrimaryDropdownProps> = ({
    options,
    placeholder = "Select an option",
    error = false,
    className = "",
    style,
    ...props
}) => {
    return (
        <select
            className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 transition duration-200 cursor-pointer text-sm sm:text-base ${className}`}
            style={{
                borderColor: error ? colors.error : colors.border.light,
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                ...style,
            }}
            {...props}
        >
            <option value="" disabled>
                {placeholder}
            </option>
            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                    style={{
                        backgroundColor: colors.background.primary,
                        color: colors.text.primary
                    }}
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default PrimaryDropdown;
