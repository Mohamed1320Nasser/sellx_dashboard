

interface PrinterConfig {
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
}

interface ReceiptData {
  id: string | number;
  receiptNumber?: string;
  createdAt: Date | string;
  subtotal: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  paidAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
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

interface LabelData {
  productName: string;
  sku: string;
  price: number;
  labelWidth: number;
  labelHeight: number;
  labelFontSize: number;
  barcodeFormat: 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39';
  barcodeHeight?: number;
  barcodeWidth?: number;
}

interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Check if running in Electron environment
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.isElectron === true && !!window.printerAPI;
}

/**
 * Print a receipt using Electron printer
 */
export async function printReceipt(
  receiptData: ReceiptData,
  config?: PrinterConfig
): Promise<PrintResult> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot print');
    return {
      success: false,
      error: 'Printing is only available in Electron app',
    };
  }

  try {
    console.log('🖨️ Calling Electron printerAPI.printReceipt...');
    console.log('Receipt data:', receiptData);
    console.log('Config:', config);

    const result = await window.printerAPI.printReceipt(receiptData, config);

    console.log('🖨️ Print result:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Print receipt error:', error);
    return {
      success: false,
      error: error.message || 'Failed to print receipt',
    };
  }
}

/**
 * Print a barcode label using Electron printer
 */
export async function printLabel(
  labelData: LabelData,
  config?: PrinterConfig
): Promise<PrintResult> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot print label');
    return {
      success: false,
      error: 'Label printing is only available in Electron app',
    };
  }

  try {
    console.log('🔄 electronPrinterService.printLabel called');
    console.log('   Label Data:', labelData);
    console.log('   Config provided?', config ? 'Yes' : 'No');

    if (config) {
      console.log('   Config details:', {
        printerName: config.printerName,
        connectionType: config.connectionType,
        ipAddress: config.ipAddress,
        port: config.port,
      });
    } else {
      console.warn('   ⚠️ No config passed to electronPrinterService!');
    }

    const result = await window.printerAPI.printLabel(labelData, config);
    console.log('   Result from printerAPI:', result);
    return result;
  } catch (error: any) {
    console.error('Print label error:', error);
    return {
      success: false,
      error: error.message || 'Failed to print label',
    };
  }
}

/**
 * Send a test print
 */
export async function testPrint(config?: PrinterConfig): Promise<PrintResult> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot test print');
    return {
      success: false,
      error: 'Test printing is only available in Electron app',
    };
  }

  try {
    return await window.printerAPI.testPrint(config);
  } catch (error: any) {
    console.error('Test print error:', error);
    return {
      success: false,
      error: error.message || 'Failed to test print',
    };
  }
}

/**
 * Get list of available printers
 */
export async function getAvailablePrinters(): Promise<string[]> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot get printers');
    return [];
  }

  try {
    return await window.printerAPI.getAvailablePrinters();
  } catch (error: any) {
    console.error('Get printers error:', error);
    return [];
  }
}

/**
 * Check printer status
 */
export async function checkPrinterStatus(config?: PrinterConfig): Promise<PrintResult> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot check status');
    return {
      success: false,
      error: 'Status check is only available in Electron app',
    };
  }

  try {
    return await window.printerAPI.checkStatus(config);
  } catch (error: any) {
    console.error('Check status error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check printer status',
    };
  }
}

/**
 * Set printer configuration
 */
export async function setPrinterConfig(config: PrinterConfig): Promise<PrintResult> {
  if (!isElectron()) {
    console.warn('Not running in Electron, cannot set config');
    return {
      success: false,
      error: 'Configuration is only available in Electron app',
    };
  }

  try {
    return await window.printerAPI.setConfig(config);
  } catch (error: any) {
    console.error('Set config error:', error);
    return {
      success: false,
      error: error.message || 'Failed to set configuration',
    };
  }
}

export default {
  isElectron,
  printReceipt,
  printLabel,
  testPrint,
  getAvailablePrinters,
  checkPrinterStatus,
  setPrinterConfig,
};
