import React, { useState, useRef, useEffect } from 'react';
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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChange = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];

        onChange({
            target: {
                name,
                value: newValue
            }
        });
    };

    const selectedLabels = value.map(v => {
        const option = options.find(opt => opt.value === v);
        return option?.label || v;
    }).join(', ');

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className={`w-full border rounded-xl focus-within:outline-none cursor-pointer ${error ? 'border-red-500' : ''} ${className}`}
                style={{
                    borderColor: error ? '#ef4444' : colors.border.light,
                    minHeight: '48px',
                    ...style
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="px-4 py-3 text-base">
                    {value.length > 0 ? (
                        <span className="text-sm">
                            {selectedLabels}
                        </span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>

                {isOpen && (
                    <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto mb-1">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${value.includes(option.value) ? 'bg-blue-50' : ''
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleChange(option.value);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={() => { }} // Handled by div click
                                    className="w-4 h-4"
                                    style={{ accentColor: colors.primary[500] }}
                                />
                                <span className="text-sm">{option.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrimaryMultiSelect;
