import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, className = '', ...props }, ref) => {
        const baseClasses = 'input-field';
        const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';
        const classes = `${baseClasses} ${errorClasses} ${className}`;

        return (
            <div className="space-y-1">
                {label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={classes}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}
                {helper && !error && (
                    <p className="text-sm text-gray-500">{helper}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
