import React from "react";
import colors from "../../styles/colors";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, className = "", style, ...props }) => {
    return (
        <button
            className={`w-full px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-sm sm:text-base md:text-lg font-semibold ${className}`}
            style={{
                backgroundColor: colors.button.primary,
                color: colors.button.text,
                ...style,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.button.primaryHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = colors.button.primary)}
            {...props}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
