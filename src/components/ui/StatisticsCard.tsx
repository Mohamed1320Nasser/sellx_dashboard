import React from 'react';
import { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';

interface StatisticsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color: string;
  link?: string;
  growth?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  isLoading?: boolean;
  valueFontSize?: string; // Custom font size for the value
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  icon: Icon,
  title,
  value,
  color,
  link,
  growth,
  subtitle,
  isLoading = false,
  valueFontSize
}) => {
  // Dynamic font size based on content length and value
  const getDynamicFontSize = (val: string | number): string => {
    if (valueFontSize) return valueFontSize; // Use custom font size if provided
    
    const valueStr = String(val);
    const length = valueStr.length;
    
    // For single digits (1-9) - BIGGER
    if (length === 1 && /^\d$/.test(valueStr)) {
      return "text-2xl"; // Bigger for single digits
    }
    
    // For double digits (10-99) - BIGGER
    if (length === 2 && /^\d{2}$/.test(valueStr)) {
      return "text-3xl"; // Bigger for double digits
    }
    
    // For currency values with decimals (like 35,180.00)
    if (valueStr.includes(',') || valueStr.includes('.')) {
      if (length <= 8) return "text-2xl"; // Bigger for currency
      if (length <= 12) return "text-xl"; // Medium for longer currency
      return "text-lg"; // Smaller for very long currency
    }
    
    // For regular numbers
    if (length <= 3) return "text-3xl"; // Bigger for short numbers
    if (length <= 5) return "text-2xl"; // Bigger for medium numbers
    if (length <= 8) return "text-xl"; // Medium for longer numbers
    return "text-lg"; // Smaller for very long numbers
  };

  // Extract numeric value for CountUp
  const getNumericValue = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Remove currency symbols and commas, extract number
      const numericStr = val.replace(/[^\d.-]/g, '');
      return parseFloat(numericStr) || 0;
    }
    return 0;
  };

  // Check if value should be animated with CountUp
  const shouldAnimate = (val: string | number): boolean => {
    if (typeof val === 'number') return true;
    if (typeof val === 'string') {
      // Check if it contains numbers and currency symbols
      return /[\d,]+/.test(val) && (val.includes('ج.م') || val.includes('ريال') || /^\d+/.test(val.trim()));
    }
    return false;
  };

  // Get the suffix for currency values
  const getSuffix = (val: string | number): string => {
    if (typeof val === 'string') {
      if (val.includes('ج.م')) return ' ج.م';
      if (val.includes('ريال')) return ' ريال';
    }
    return '';
  };

  const numericValue = getNumericValue(value);
  const suffix = getSuffix(value);
  const dynamicFontSize = getDynamicFontSize(value);
  
  const cardContent = (
    <div className="relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5">
      {/* Icon */}
      <div 
        className="w-15 h-15 rounded-full flex items-center justify-center mb-4"
        style={{ 
          backgroundColor: `${color}30`,
          color: color 
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value */}
      <div className="mb-2">
        {isLoading ? (
          <div className="h-7 w-20 bg-gray-200 rounded animate-pulse"></div>
        ) : shouldAnimate(value) ? (
          <h3 className={`${dynamicFontSize} font-normal text-gray-900`}>
            <CountUp 
              end={numericValue} 
              duration={2}
              separator=","
              decimals={suffix ? 2 : 0}
              suffix={suffix}
            />
          </h3>
        ) : (
          <h3 className={`${dynamicFontSize} font-normal text-gray-900`}>
            {value}
          </h3>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-600 mb-2">
        {title}
      </p>

      {/* Growth indicator */}
      {growth && !isLoading && (
        <div className="flex items-center">
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            growth.isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <span className="mr-1">
              {growth.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(growth.value)}%
          </div>
          <span className="text-xs text-gray-500 mr-2">من الشهر الماضي</span>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">
          {subtitle}
        </p>
      )}

      {/* Hover effect overlay */}
      {link && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-transparent hover:from-gray-50 hover:to-gray-50 transition-all duration-300 opacity-0 hover:opacity-100"></div>
      )}
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default StatisticsCard;
