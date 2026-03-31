// Date utility functions for consistent formatting

/**
 * Format date in Arabic Gregorian calendar format
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string in Arabic
 */
export const formatDateInArabic = (
  date: string | Date | null | undefined,
  options: {
    includeTime?: boolean;
    shortFormat?: boolean;
  } = {}
): string => {
  const { includeTime = false, shortFormat = false } = options;

  if (!date) {
    return "غير محدد";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "تاريخ غير صحيح";
  }

  const baseOptions: Intl.DateTimeFormatOptions = {
    calendar: "gregory", // Explicitly use Gregorian calendar
    timeZone: "Asia/Riyadh", // Saudi timezone
  };

  if (shortFormat) {
    // Short format: DD/MM/YYYY with English numbers
    return dateObj.toLocaleDateString("ar-SA", {
      ...baseOptions,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      numberingSystem: "latn", // Use Latin (English) numbers
    });
  } else {
    // Long format: يوم DD شهر YYYY with English numbers
    const dateOptions: Intl.DateTimeFormatOptions = {
      ...baseOptions,
      year: "numeric",
      month: "long",
      day: "numeric",
      numberingSystem: "latn", // Use Latin (English) numbers
    };

    if (includeTime) {
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        numberingSystem: "latn", // Use Latin (English) numbers
      };

      const datePart = dateObj.toLocaleDateString("ar-SA", dateOptions);
      const timePart = dateObj.toLocaleTimeString("ar-SA", timeOptions);

      return `${datePart} - ${timePart}`;
    }

    return dateObj.toLocaleDateString("ar-SA", dateOptions);
  }
};

/**
 * Format date for table display (short format)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatTableDate = (
  date: string | Date | null | undefined
): string => {
  if (!date) {
    return "غير محدد";
  }
  return formatDateInArabic(date, { shortFormat: true });
};

/**
 * Format date with time for detailed views
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  if (!date) {
    return "غير محدد";
  }
  return formatDateInArabic(date, { includeTime: true });
};

/**
 * Format date for forms and detailed displays
 * @param date - Date string or Date object
 * @returns Formatted date string (long format)
 */
export const formatDetailDate = (
  date: string | Date | null | undefined
): string => {
  if (!date) {
    return "غير محدد";
  }
  return formatDateInArabic(date, { shortFormat: false });
};

/**
 * Simple date formatter for general use (alias for formatTableDate)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  return formatTableDate(date);
};
