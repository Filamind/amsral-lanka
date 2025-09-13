import React from "react";
import { CircularProgress } from "@mui/material";
import colors from "../../styles/colors";

interface PrimaryButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'loading'> {
    children: React.ReactNode;
    className?: string;
    loading?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    children,
    className = "",
    style,
    loading = false,
    disabled,
    ...props
}) => {
    return (
        <button
            className={`w-full px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-sm sm:text-base md:text-lg font-semibold flex items-center justify-center gap-2 ${className}`}
            style={{
                backgroundColor: colors.button.primary,
                color: colors.button.text,
                opacity: loading ? 0.7 : 1,
                ...style,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = colors.button.primaryHover)}
            onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = colors.button.primary)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <CircularProgress size={16} color="inherit" />}
            {children}
        </button>
    );
};

export default PrimaryButton;
