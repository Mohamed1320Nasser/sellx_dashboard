/**
 * PROFESSIONAL PRINTER CONFIGURATION
 * Separates Receipt and Barcode printer settings
 *
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Each printer type has its own config
 * - Flexibility: Support different printers for different jobs
 * - Real-world usage: Most POS systems have separate printers
 */

export enum ConnectionType {
  USB = 'USB',
  LAN = 'LAN',
}

export enum PrinterType {
  RECEIPT = 'RECEIPT',
  BARCODE = 'BARCODE',
}

export enum PaperWidth {
  MM_58 = '58mm',
  MM_80 = '80mm',
}

export enum BarcodeFormat {
  CODE128 = 'CODE128',
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  CODE39 = 'CODE39',
}

/**
 * Base printer configuration (common settings)
 */
export interface BasePrinterConfig {
  // Connection
  connectionType: ConnectionType;
  printerName: string;          // Windows printer name (for USB)
  ipAddress?: string;            // For LAN connection
  port?: number;                 // For LAN connection (default: 9100)

  // Paper
  paperWidth: PaperWidth;
  marginTop: number;             // mm
  marginBottom: number;          // mm

  // Automation
  cutPaper: boolean;
  printCopies: number;           // Number of copies (1-5)
}

/**
 * Receipt printer specific settings
 */
export interface ReceiptPrinterConfig extends BasePrinterConfig {
  printerType: PrinterType.RECEIPT;

  // Receipt content
  showLogo: boolean;
  showOrderId: boolean;
  showTaxBreakdown: boolean;
  showQRCode: boolean;
  headerText: string;
  footerText: string;
  characterSet: string;          // e.g., 'windows-1256' for Arabic
  autoPrintOnPayment: boolean;
}

/**
 * Barcode/Label printer specific settings
 */
export interface BarcodePrinterConfig extends BasePrinterConfig {
  printerType: PrinterType.BARCODE;

  // Label settings
  labelWidth: number;            // mm (35, 40, 50)
  labelHeight: number;           // mm (25, 30, 30)
  labelFontSize: number;         // px (8-20)

  // Barcode settings
  barcodeFormat: BarcodeFormat;
  barcodeHeight: number;         // px (40-100)
  barcodeWidth: number;          // 1-3 (bar thickness)
  showBarcodeText: boolean;      // Show HRI (Human Readable Interpretation)
}

/**
 * Complete printer configuration (both types)
 */
export interface CompletePrinterConfig {
  receipt: ReceiptPrinterConfig;
  barcode: BarcodePrinterConfig;
}

/**
 * Default receipt printer configuration
 */
export const DEFAULT_RECEIPT_CONFIG: ReceiptPrinterConfig = {
  printerType: PrinterType.RECEIPT,
  connectionType: ConnectionType.LAN,
  printerName: '',
  ipAddress: '192.168.1.50',
  port: 9100,
  paperWidth: PaperWidth.MM_80,
  marginTop: 5,
  marginBottom: 5,
  cutPaper: true,
  printCopies: 1,
  showLogo: true,
  showOrderId: true,
  showTaxBreakdown: true,
  showQRCode: false,
  headerText: '',
  footerText: 'شكراً لزيارتكم',
  characterSet: 'windows-1256',
  autoPrintOnPayment: false,
};

/**
 * Default barcode printer configuration
 */
export const DEFAULT_BARCODE_CONFIG: BarcodePrinterConfig = {
  printerType: PrinterType.BARCODE,
  connectionType: ConnectionType.USB,
  printerName: '',
  paperWidth: PaperWidth.MM_58,
  marginTop: 2,
  marginBottom: 2,
  cutPaper: true,
  printCopies: 1,
  labelWidth: 40,
  labelHeight: 30,
  labelFontSize: 12,
  barcodeFormat: BarcodeFormat.CODE128,
  barcodeHeight: 60,
  barcodeWidth: 2,
  showBarcodeText: true,
};

/**
 * Complete default configuration
 */
export const DEFAULT_PRINTER_CONFIG: CompletePrinterConfig = {
  receipt: DEFAULT_RECEIPT_CONFIG,
  barcode: DEFAULT_BARCODE_CONFIG,
};
