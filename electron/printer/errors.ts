/**
 * Printer Error Handling Framework
 * Provides consistent error handling and user-friendly messages
 */

export enum PrinterErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  PRINTER_OFFLINE = 'PRINTER_OFFLINE',
  PAPER_OUT = 'PAPER_OUT',
  INVALID_CONFIG = 'INVALID_CONFIG',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  TIMEOUT = 'TIMEOUT',
  USB_NOT_FOUND = 'USB_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export class PrinterError extends Error {
  constructor(
    public code: PrinterErrorCode,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PrinterError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PrinterError);
    }
  }

  /**
   * Get user-friendly error message in specified language
   */
  toUserMessage(lang: 'ar' | 'en' = 'ar'): string {
    const messages: Record<PrinterErrorCode, { ar: string; en: string }> = {
      [PrinterErrorCode.CONNECTION_FAILED]: {
        ar: 'فشل الاتصال بالطابعة. تحقق من عنوان IP والمنفذ.',
        en: 'Failed to connect to printer. Check IP address and port.',
      },
      [PrinterErrorCode.PRINTER_OFFLINE]: {
        ar: 'الطابعة غير متصلة أو مغلقة.',
        en: 'Printer is offline or turned off.',
      },
      [PrinterErrorCode.PAPER_OUT]: {
        ar: 'نفذ الورق من الطابعة.',
        en: 'Printer is out of paper.',
      },
      [PrinterErrorCode.INVALID_CONFIG]: {
        ar: 'إعدادات الطابعة غير صحيحة.',
        en: 'Invalid printer configuration.',
      },
      [PrinterErrorCode.UNSUPPORTED_FORMAT]: {
        ar: 'تنسيق غير مدعوم.',
        en: 'Unsupported format.',
      },
      [PrinterErrorCode.TIMEOUT]: {
        ar: 'انتهت مهلة الاتصال بالطابعة.',
        en: 'Printer connection timeout.',
      },
      [PrinterErrorCode.USB_NOT_FOUND]: {
        ar: 'لم يتم العثور على طابعة USB.',
        en: 'USB printer not found.',
      },
      [PrinterErrorCode.UNKNOWN]: {
        ar: 'خطأ غير معروف في الطباعة.',
        en: 'Unknown printing error.',
      },
    };

    return messages[this.code]?.[lang] || this.message;
  }

  /**
   * Get detailed error information for logging
   */
  toLogObject(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      originalError: this.originalError ? {
        message: this.originalError.message,
        code: this.originalError.code,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

/**
 * Classify a generic error into a PrinterError
 */
export function classifyPrinterError(error: any): PrinterError {
  const errorMessage = error.message || String(error);
  const errorCode = error.code || '';

  // Network connection errors
  if (errorCode === 'ECONNREFUSED' || errorMessage.includes('ECONNREFUSED')) {
    return new PrinterError(
      PrinterErrorCode.CONNECTION_FAILED,
      'Connection refused - printer may be offline or IP/port incorrect',
      error
    );
  }

  if (errorCode === 'EHOSTUNREACH' || errorMessage.includes('EHOSTUNREACH')) {
    return new PrinterError(
      PrinterErrorCode.CONNECTION_FAILED,
      'Host unreachable - check network connection',
      error
    );
  }

  if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
    return new PrinterError(
      PrinterErrorCode.TIMEOUT,
      'Connection timeout - printer did not respond',
      error
    );
  }

  // Configuration errors
  if (errorMessage.includes('configuration') || errorMessage.includes('config')) {
    return new PrinterError(
      PrinterErrorCode.INVALID_CONFIG,
      errorMessage,
      error
    );
  }

  // USB errors
  if (errorMessage.includes('USB') || errorMessage.includes('No device')) {
    return new PrinterError(
      PrinterErrorCode.USB_NOT_FOUND,
      'USB printer not found or not connected',
      error
    );
  }

  // Default to unknown
  return new PrinterError(
    PrinterErrorCode.UNKNOWN,
    errorMessage || 'Unknown printer error',
    error
  );
}
