import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className = ''
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200';

    const variantClasses = {
        default: 'bg-gray-100 text-gray-700 border border-gray-200',
        primary: 'bg-primary-100 text-primary-700 border border-primary-200',
        success: 'bg-success-100 text-success-700 border border-success-200',
        error: 'bg-danger-100 text-danger-700 border border-danger-200',
        warning: 'bg-warning-100 text-warning-700 border border-warning-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const dotColors = {
        default: 'bg-gray-500',
        primary: 'bg-primary-500',
        success: 'bg-success-500',
        error: 'bg-danger-500',
        warning: 'bg-warning-500',
        info: 'bg-blue-500',
    };

    const classes = `
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <span className={classes}>
            {dot && (
                <span
                    className={`w-1.5 h-1.5 rounded-full ml-1.5 ${dotColors[variant]}`}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
};

export default Badge;
