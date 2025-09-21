import React from "react";
import { CircularProgress } from "@mui/material";
import colors from "../../styles/colors";

interface PrimaryButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'loading' | 'startIcon' | 'endIcon' | 'fullWidth'> {
    children: React.ReactNode;
    className?: string;
    loading?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    sx?: React.CSSProperties;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    children,
    className = "",
    style,
    sx,
    loading = false,
    disabled,
    startIcon,
    endIcon,
    fullWidth,
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
                ...sx,
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = colors.button.primaryHover)}
            onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = colors.button.primary)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <CircularProgress size={16} color="inherit" />}
            {!loading && startIcon && <span className="flex items-center">{startIcon}</span>}
            {children}
            {!loading && endIcon && <span className="flex items-center">{endIcon}</span>}
        </button>
    );
};

export default PrimaryButton;
