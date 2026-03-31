import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    gradient?: boolean;
    shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
    gradient = false,
    shadow = 'lg'
}) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const shadowClasses = {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
    };

    const baseClasses = 'bg-white rounded-2xl border border-gray-100 transition-all duration-300';
    const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
    const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : '';

    const classes = `
        ${baseClasses}
        ${shadowClasses[shadow]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${gradientClasses}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
};

export default Card;
