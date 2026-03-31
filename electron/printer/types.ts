export interface PrinterConfig {
  printerName: string;
  connectionType: 'USB' | 'LAN';
  ipAddress?: string;
  port?: number;
  paperWidth: '58mm' | '80mm';
  marginTop: number;
  marginBottom: number;
  showLogo: boolean;
  showOrderId: boolean;
  showTaxBreakdown: boolean;
  showQRCode: boolean;
  headerText?: string;
  footerText?: string;
  characterSet: string;
  cutPaper: boolean;
  printMode?: 'text' | 'image'; // New: print mode selection
  printCopies?: number; // Number of copies to print (1-5)
  // Label/Barcode settings
  labelWidth?: number;
  labelHeight?: number;
  labelFontSize?: number;
  barcodeFormat?: 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39';
  barcodeHeight?: number;
  barcodeWidth?: number;
  showBarcodeText?: boolean;
}

export interface ReceiptData {
  id: string | number;
  receiptNumber?: string;
  createdAt: Date | string;
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  paidAmount: number;
  items: ReceiptItem[];
  company?: {
    name: string;
    address?: string;
    phone?: string;
    taxNumber?: string;
    logo?: string;
  };
  cashier?: {
    name: string;
  };
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface LabelData {
  productName: string;
  sku: string;
  price: number;
  labelWidth: number;
  labelHeight: number;
  labelFontSize: number;
  barcodeFormat: 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39';
  barcodeWidth?: number;
  barcodeHeight?: number;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
}
