import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform';

    const variantClasses = {
        primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        secondary: 'bg-secondary-700 hover:bg-secondary-800 text-white focus:ring-secondary-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        outline: 'border-2 border-primary-600 hover:bg-primary-50 text-primary-600 hover:text-primary-700 focus:ring-primary-200 hover:border-primary-700',
        ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-200 hover:text-gray-900',
        destructive: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        warning: 'bg-warning-600 hover:bg-warning-700 text-white focus:ring-warning-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    };
    
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    
    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
