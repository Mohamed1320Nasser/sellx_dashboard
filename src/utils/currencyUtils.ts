// Currency utility functions for consistent formatting

/**
 * Format number with English numerals
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted number string with English numerals
 */
export const formatNumber = (
  value: number | string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {}
): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options;

  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return "0";
  }

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
    });

    return formatter.format(numericValue);
  } catch {
    // Fallback formatting
    return numericValue.toFixed(maximumFractionDigits);
  }
};

/**
 * Format percentage with English numerals
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  const formattedNumber = formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formattedNumber}%`;
};

/**
 * Format currency amount in Egyptian pounds
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  options: {
    showSymbol?: boolean;
  } = {}
): string => {
  const { showSymbol = true } = options;

  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return "0.00 ج.م";
  }

  try {
    // Use English locale for numbers but keep Arabic text
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedNumber = formatter.format(numericAmount);

    if (showSymbol) {
      return `${formattedNumber} ج.م`;
    } else {
      return `${formattedNumber} ج.م`;
    }
  } catch {
    // Fallback formatting
    return `${numericAmount.toFixed(2)} ج.م`;
  }
};

/**
 * Format currency for display in tables (shorter format)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatTableCurrency = (amount: number | string): string => {
  return formatCurrency(amount, { showSymbol: false });
};

/**
 * Format currency for detailed views (with full symbol)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatDetailCurrency = (amount: number | string): string => {
  return formatCurrency(amount, { showSymbol: true });
};
