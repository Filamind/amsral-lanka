import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import colors from '../../styles/colors';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const colorMap = {
    primary: colors.primary[500],
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
};

export default function MetricCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    color = 'primary'
}: MetricCardProps) {
    return (
        <Card
            sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: `1px solid ${colors.border.light}`,
                borderRadius: 2,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {title}
                    </Typography>
                    {icon && (
                        <Box sx={{ color: colorMap[color], fontSize: '1.5rem' }}>
                            {icon}
                        </Box>
                    )}
                </Box>

                <Typography
                    variant="h4"
                    sx={{
                        color: colors.text.primary,
                        fontWeight: 700,
                        mb: 1,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                >
                    {value}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: colors.text.secondary,
                            fontSize: '0.875rem'
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: trend.isPositive ? '#10b981' : '#ef4444',
                                fontWeight: 600,
                                fontSize: '0.875rem'
                            }}
                        >
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: colors.text.secondary,
                                ml: 1,
                                fontSize: '0.875rem'
                            }}
                        >
                            vs last period
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
