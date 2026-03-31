/**
 * Barcode validation service with checksum validation
 */

export interface BarcodeValidationResult {
  isValid: boolean;
  format?: string;
  error?: string;
}

/**
 * Calculate EAN-13 checksum digit
 * Algorithm: Alternating multiply by 1 and 3, sum, then (10 - (sum % 10)) % 10
 */
function calculateEAN13Checksum(barcode: string): number {
  const digits = barcode.substring(0, 12).split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    // Odd positions (1st, 3rd, 5th...) multiply by 1
    // Even positions (2nd, 4th, 6th...) multiply by 3
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  return (10 - (sum % 10)) % 10;
}

/**
 * Calculate EAN-8 checksum digit
 * Same algorithm as EAN-13 but for 7 digits
 */
function calculateEAN8Checksum(barcode: string): number {
  const digits = barcode.substring(0, 7).split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    // Odd positions multiply by 3, even by 1 (opposite of EAN-13)
    return acc + digit * (index % 2 === 0 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10;
}

/**
 * Calculate UPC-A checksum digit
 * Same algorithm as EAN-13
 */
function calculateUPCAChecksum(barcode: string): number {
  const digits = barcode.substring(0, 11).split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    // Odd positions multiply by 3, even by 1
    return acc + digit * (index % 2 === 0 ? 3 : 1);
  }, 0);
  return (10 - (sum % 10)) % 10;
}

/**
 * Validate CODE39 format
 * CODE39 supports: 0-9, A-Z, space, and symbols: - . $ / + %
 */
function isValidCODE39(barcode: string): boolean {
  return /^[0-9A-Z\-.\s$/+%]+$/.test(barcode) && barcode.length >= 1 && barcode.length <= 128;
}

/**
 * Validates barcode format and returns detected format
 * Includes checksum validation for EAN/UPC codes
 */
export function validateBarcodeFormat(barcode: string): BarcodeValidationResult {
  if (!barcode || barcode.trim().length === 0) {
    return { isValid: false, error: 'الباركود مطلوب' };
  }

  // Remove any whitespace
  const cleanBarcode = barcode.trim();

  // Check for common barcode formats with checksum validation

  // EAN-13 (13 digits) - includes checksum validation
  if (/^\d{13}$/.test(cleanBarcode)) {
    const providedChecksum = parseInt(cleanBarcode.charAt(12));
    const calculatedChecksum = calculateEAN13Checksum(cleanBarcode);

    if (providedChecksum !== calculatedChecksum) {
      return {
        isValid: false,
        error: `باركود EAN-13 غير صحيح - رقم التحقق خاطئ (المتوقع: ${calculatedChecksum}, المُدخل: ${providedChecksum})`
      };
    }

    return { isValid: true, format: 'EAN13' };
  }

  // EAN-8 (8 digits) - includes checksum validation
  if (/^\d{8}$/.test(cleanBarcode)) {
    const providedChecksum = parseInt(cleanBarcode.charAt(7));
    const calculatedChecksum = calculateEAN8Checksum(cleanBarcode);

    if (providedChecksum !== calculatedChecksum) {
      return {
        isValid: false,
        error: `باركود EAN-8 غير صحيح - رقم التحقق خاطئ (المتوقع: ${calculatedChecksum}, المُدخل: ${providedChecksum})`
      };
    }

    return { isValid: true, format: 'EAN8' };
  }

  // UPC-A (12 digits) - includes checksum validation
  if (/^\d{12}$/.test(cleanBarcode)) {
    const providedChecksum = parseInt(cleanBarcode.charAt(11));
    const calculatedChecksum = calculateUPCAChecksum(cleanBarcode);

    if (providedChecksum !== calculatedChecksum) {
      return {
        isValid: false,
        error: `باركود UPC-A غير صحيح - رقم التحقق خاطئ (المتوقع: ${calculatedChecksum}, المُدخل: ${providedChecksum})`
      };
    }

    return { isValid: true, format: 'UPCA' };
  }

  // CODE39 (alphanumeric + symbols)
  if (isValidCODE39(cleanBarcode)) {
    return { isValid: true, format: 'CODE39' };
  }

  // CODE128 (alphanumeric, most flexible) - no checksum validation needed
  // CODE128 has built-in checksum handled by the printer/generator
  if (/^[\x20-\x7F]+$/.test(cleanBarcode) && cleanBarcode.length >= 1 && cleanBarcode.length <= 128) {
    return { isValid: true, format: 'CODE128' };
  }

  return {
    isValid: false,
    error: 'تنسيق الباركود غير صحيح. يجب أن يكون EAN-13 (13 رقم)، EAN-8 (8 أرقام)، UPC-A (12 رقم)، CODE39، أو CODE128'
  };
}

/**
 * Generate a valid EAN-13 barcode from 12 digits
 * Automatically calculates and appends the checksum digit
 */
export function generateEAN13(digits12: string): string {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error('EAN-13 requires exactly 12 digits');
  }
  const checksum = calculateEAN13Checksum(digits12 + '0');
  return digits12 + checksum;
}

/**
 * Generate a valid EAN-8 barcode from 7 digits
 * Automatically calculates and appends the checksum digit
 */
export function generateEAN8(digits7: string): string {
  if (!/^\d{7}$/.test(digits7)) {
    throw new Error('EAN-8 requires exactly 7 digits');
  }
  const checksum = calculateEAN8Checksum(digits7 + '0');
  return digits7 + checksum;
}

/**
 * Generate a valid UPC-A barcode from 11 digits
 * Automatically calculates and appends the checksum digit
 */
export function generateUPCA(digits11: string): string {
  if (!/^\d{11}$/.test(digits11)) {
    throw new Error('UPC-A requires exactly 11 digits');
  }
  const checksum = calculateUPCAChecksum(digits11 + '0');
  return digits11 + checksum;
}
