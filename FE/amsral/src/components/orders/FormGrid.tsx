import React from 'react';

interface FormGridProps {
    children: React.ReactNode;
    className?: string;
}

const FormGrid: React.FC<FormGridProps> = ({ children, className = "" }) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
            {children}
        </div>
    );
};

export default FormGrid;
