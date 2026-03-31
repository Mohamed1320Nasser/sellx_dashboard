/**
 * PROFESSIONAL RECEIPT PRINTER using Electron Native Print
 *
 * Uses the SAME method as SimpleBarcodeRenderer:
 * 1. Generate beautiful HTML receipt (using receiptHtmlTemplate.ts)
 * 2. Use Electron's NATIVE print() API
 * 3. Print to any printer (USB or LAN via Windows/macOS drivers)
 *
 * ✅ Works with ALL printers (thermal, laser, inkjet)
 * ✅ Beautiful professional template with Google Fonts
 * ✅ No external dependencies (electron-pos-printer not needed)
 * ✅ Consistent with barcode printing
 * ✅ 100% reliable
 */

import { BrowserWindow } from 'electron';
import { PrinterConfig, PrintResult } from './types';
import { PrinterError, PrinterErrorCode } from './errors';
import { selectBestPrinter } from './PrinterDetector';

// Import the beautiful receipt template (from electron folder to avoid TS errors)
import { generateReceiptHTML, ReceiptTemplateData } from './receiptTemplate';

export interface ReceiptData {
  // Order Info
  orderId: string | number;
  orderDate: Date | string;

  // Company Info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyTaxId?: string;

  // Cashier
  cashierName?: string;

  // Items
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  // Totals
  subtotal: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  additionalFee?: number;
  additionalFeeLabel?: string;
  total: number;
  paid?: number;
  change?: number;
}

/**
 * Print receipt using Electron native print - SIMPLE METHOD
 */
export async function printReceiptSimple(
  receiptData: ReceiptData,
  config: PrinterConfig
): Promise<PrintResult> {
  try {
    // Auto-detect printer if needed
    let printerName = config.printerName;
    if (!printerName || printerName.trim() === '') {
      const detected = await selectBestPrinter();
      if (!detected) {
        throw new PrinterError(
          PrinterErrorCode.INVALID_CONFIG,
          'لم يتم العثور على طابعة'
        );
      }
      printerName = detected;
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   SIMPLE RECEIPT PRINT (PROFESSIONAL)    ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('🖨️ Printer:', printerName);
    console.log('📋 Receipt #:', receiptData.orderId);
    console.log('📄 Paper Width:', config.paperWidth);
    console.log('🛒 Items:', receiptData.items.length);
    console.log('💰 Total:', receiptData.total);
    console.log('═════════════════════════════════════════════');

    // Prepare data for beautiful template
    const templateData: ReceiptTemplateData = {
      orderId: receiptData.orderId,
      orderDate: receiptData.orderDate,
      companyName: receiptData.companyName,
      companyAddress: receiptData.companyAddress,
      companyPhone: receiptData.companyPhone,
      companyTaxId: receiptData.companyTaxId,
      cashierName: receiptData.cashierName,
      items: receiptData.items,
      subtotal: receiptData.subtotal,
      discount: receiptData.discount,
      taxRate: receiptData.taxRate,
      taxAmount: receiptData.taxAmount,
      additionalFee: receiptData.additionalFee,
      additionalFeeLabel: receiptData.additionalFeeLabel,
      total: receiptData.total,
      paid: receiptData.paid,
      change: receiptData.change,
      paperWidth: config.paperWidth,
      showLogo: config.showLogo,
      showOrderId: config.showOrderId,
      showTaxBreakdown: config.showTaxBreakdown,
      showQRCode: config.showQRCode,
      headerText: config.headerText,
      footerText: config.footerText,
    };

    // Generate beautiful HTML receipt using the professional template
    console.log('📝 Generating beautiful receipt HTML...');
    const html = await generateReceiptHTML(templateData);
    console.log('✅ HTML generated successfully');

    // Create hidden window to render receipt
    const window = new BrowserWindow({
      show: false,
      width: config.paperWidth === '58mm' ? 384 : 576, // 58mm or 80mm
      height: 1200, // Taller for complex receipts
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load HTML
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for content to render (especially Google Fonts and QR codes)
    console.log('⏳ Waiting for fonts and content to load...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Increased for Google Fonts

    console.log('✅ Receipt rendered, printing...');

    // Print directly using Electron's print API
    // Use larger page size to ensure full content prints (auto-height)
    const printOptions = {
      silent: true,
      deviceName: printerName,
      margins: {
        marginType: 'none' as const,
      },
      pageSize: config.paperWidth === '58mm'
        ? { width: 58000, height: 297000 } // 58mm width, A4 height (allows auto-size)
        : { width: 80000, height: 297000 }, // 80mm width, A4 height (allows auto-size)
    };

    // Print the specified number of copies
    const copies = config.printCopies || 1;
    let printed = 0;

    const printOneCopy = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        window.webContents.print(printOptions, (success, error) => {
          if (!success) {
            reject(new Error(error || 'فشلت الطباعة'));
          } else {
            printed++;
            console.log(`✓ نسخة ${printed}/${copies} تمت طباعتها`);
            resolve();
          }
        });
      });
    };

    // Print all copies sequentially
    for (let i = 0; i < copies; i++) {
      await printOneCopy();
      if (i < copies - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    window.close();

    console.log('✅ اكتملت الطباعة بنجاح!');
    console.log('═════════════════════════════════════════════');

    return {
      success: true,
      message: `تم طباعة الفاتورة بنجاح (${copies} نسخة)`,
    };

  } catch (error: any) {
    console.error('❌ خطأ في الطباعة:', error);
    return {
      success: false,
      error: error.message || 'فشلت طباعة الفاتورة',
    };
  }
}

// Note: We now use the beautiful template from receiptHtmlTemplate.ts
// No need for a separate HTML generator here!
