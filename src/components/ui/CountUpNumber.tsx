import React from 'react';
import CountUp from 'react-countup';

interface CountUpNumberProps {
  value: string | number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  enableScrollSpy?: boolean;
  scrollSpyOnce?: boolean;
}

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 2,
  className = '',
  prefix = '',
  suffix = '',
  decimals,
  separator = ',',
  enableScrollSpy = false,
  scrollSpyOnce = true,
}) => {
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
    if (suffix) return suffix; // Use provided suffix
    if (typeof val === 'string') {
      if (val.includes('ج.م')) return ' ج.م';
      if (val.includes('ريال')) return ' ريال';
      if (val.includes('%')) return '%';
    }
    return '';
  };

  // Get decimals based on value type
  const getDecimals = (val: string | number): number => {
    if (decimals !== undefined) return decimals;
    if (typeof val === 'string') {
      if (val.includes('ج.م') || val.includes('ريال')) return 2;
      if (val.includes('%')) return 1;
    }
    return 0;
  };

  const numericValue = getNumericValue(value);
  const finalSuffix = getSuffix(value);
  const finalDecimals = getDecimals(value);

  if (!shouldAnimate(value)) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      <CountUp
        end={numericValue}
        duration={duration}
        separator={separator}
        decimals={finalDecimals}
        prefix={prefix}
        suffix={finalSuffix}
        enableScrollSpy={enableScrollSpy}
        scrollSpyOnce={scrollSpyOnce}
      />
    </span>
  );
};

export default CountUpNumber;
