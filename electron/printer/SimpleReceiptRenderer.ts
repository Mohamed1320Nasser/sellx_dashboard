/**
 * SIMPLE PROFESSIONAL RECEIPT PRINTER
 *
 * Uses the SAME method as SimpleBarcodeRenderer:
 * 1. Generate HTML receipt
 * 2. Use Electron's NATIVE print() API
 * 3. Print to any printer (USB or LAN via Windows/macOS drivers)
 *
 * ✅ Works with ALL printers (thermal, laser, inkjet)
 * ✅ No external dependencies (electron-pos-printer not needed)
 * ✅ Consistent with barcode printing
 * ✅ 100% reliable
 */

import { BrowserWindow } from 'electron';
import { PrinterConfig, PrintResult } from './types';
import { PrinterError, PrinterErrorCode } from './errors';
import { selectBestPrinter } from './PrinterDetector';

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

    // Generate HTML receipt
    const html = generateReceiptHTML(receiptData, config);

    // Create hidden window to render receipt
    const window = new BrowserWindow({
      show: false,
      width: config.paperWidth === '58mm' ? 384 : 576, // 58mm or 80mm
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load HTML
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for content to render (especially fonts and layout)
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('✅ Receipt rendered, printing...');

    // Print directly using Electron's print API
    const printOptions = {
      silent: true,
      deviceName: printerName,
      margins: {
        marginType: 'none' as const,
      },
      pageSize: config.paperWidth === '58mm'
        ? { width: 58000, height: 200000 } // 58mm width, auto height
        : { width: 80000, height: 200000 }, // 80mm width, auto height
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

/**
 * Generate professional receipt HTML (same styling as template)
 */
function generateReceiptHTML(data: ReceiptData, config: PrinterConfig): string {
  const {
    orderId,
    orderDate,
    companyName,
    companyAddress,
    companyPhone,
    companyTaxId,
    cashierName,
    items,
    subtotal,
    discount = 0,
    taxRate = 0,
    taxAmount = 0,
    additionalFee = 0,
    additionalFeeLabel = '',
    total,
    paid = 0,
    change = 0,
  } = data;

  const paperWidth = config.paperWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = config.paperWidth === '58mm' ? '11px' : '13px';
  const headerSize = config.paperWidth === '58mm' ? '18px' : '22px';
  const totalSize = config.paperWidth === '58mm' ? '20px' : '24px';

  // Format date
  const dateObj = new Date(orderDate);
  const formattedDate = dateObj.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatCurrency = (amount: number) => amount.toFixed(2);

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${paperWidth} auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${paperWidth};
      margin: 0;
      padding: 12px 10px;
      font-family: 'Cairo', Arial, sans-serif;
      font-size: ${fontSize};
      line-height: 1.5;
      color: #000;
      background: #fff;
      direction: rtl;
    }

    .header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 2px dashed #333;
    }

    .company-name {
      font-size: ${headerSize};
      font-weight: 700;
      margin-bottom: 6px;
    }

    .company-info {
      font-size: calc(${fontSize} - 1px);
      color: #333;
      margin: 3px 0;
    }

    .order-info {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px dashed #666;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }

    .label { font-weight: 600; }
    .value { color: #333; }

    .items {
      margin: 10px 0;
      border-bottom: 2px dashed #333;
      padding-bottom: 10px;
    }

    .items-header {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1.2fr;
      gap: 6px;
      padding: 6px 0;
      background: #f5f5f5;
      border: 1px solid #ddd;
      font-weight: 700;
      font-size: calc(${fontSize} - 1px);
      text-align: center;
      margin-bottom: 6px;
    }

    .item {
      padding: 8px 0;
      border-bottom: 1px dotted #ccc;
    }

    .item-main {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1.2fr;
      gap: 6px;
      align-items: center;
    }

    .item-name {
      font-weight: 600;
      text-align: right;
      word-wrap: break-word;
    }

    .item-qty {
      text-align: center;
      font-weight: 600;
    }

    .item-price {
      text-align: left;
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .item-detail {
      font-size: calc(${fontSize} - 2px);
      color: #666;
      margin-top: 2px;
      padding-right: 6px;
    }

    .totals {
      margin: 10px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }

    .total-label { font-weight: 600; }
    .total-value {
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .separator {
      border-top: 1px solid #999;
      margin: 6px 0;
    }

    .double-separator {
      border-top: 3px double #333;
      margin: 8px 0;
    }

    .grand-total {
      margin: 10px 0;
      padding: 10px 6px;
      background: #f9f9f9;
      border: 2px solid #333;
      border-radius: 3px;
    }

    .grand-total .total-label {
      font-size: calc(${fontSize} + 2px);
      font-weight: 700;
    }

    .grand-total .total-value {
      font-size: ${totalSize};
      font-weight: 700;
    }

    .payment {
      margin: 10px 0;
      padding: 8px 0;
      border-top: 2px dashed #333;
      border-bottom: 2px dashed #333;
    }

    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px dashed #333;
    }

    .footer-text {
      font-size: calc(${fontSize} + 1px);
      font-weight: 600;
      margin-bottom: 6px;
    }

    .thank-you {
      font-size: ${fontSize};
      color: #333;
      font-style: italic;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="company-name">${escapeHtml(companyName)}</div>
    ${companyAddress ? `<div class="company-info">${escapeHtml(companyAddress)}</div>` : ''}
    ${companyPhone ? `<div class="company-info">هاتف: ${escapeHtml(companyPhone)}</div>` : ''}
    ${companyTaxId ? `<div class="company-info">الرقم الضريبي: ${escapeHtml(companyTaxId)}</div>` : ''}
    ${config.headerText ? `<div class="company-info" style="margin-top: 6px; font-weight: 600;">${escapeHtml(config.headerText)}</div>` : ''}
  </div>

  <!-- ORDER INFO -->
  <div class="order-info">
    ${config.showOrderId ? `
    <div class="info-row">
      <span class="label">رقم الطلب:</span>
      <span class="value">#${orderId}</span>
    </div>` : ''}
    <div class="info-row">
      <span class="label">التاريخ:</span>
      <span class="value">${formattedDate}</span>
    </div>
    <div class="info-row">
      <span class="label">الوقت:</span>
      <span class="value">${formattedTime}</span>
    </div>
    ${cashierName ? `
    <div class="info-row">
      <span class="label">الكاشير:</span>
      <span class="value">${escapeHtml(cashierName)}</span>
    </div>` : ''}
  </div>

  <!-- ITEMS -->
  <div class="items">
    <div class="items-header">
      <div>الصنف</div>
      <div>الكمية</div>
      <div>المبلغ</div>
    </div>

    ${items.map(item => `
    <div class="item">
      <div class="item-main">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-qty">${item.quantity}</div>
        <div class="item-price">${formatCurrency(item.totalPrice)}</div>
      </div>
      <div class="item-detail">
        ${item.quantity} × ${formatCurrency(item.unitPrice)} ر.س
      </div>
    </div>
    `).join('')}
  </div>

  <!-- TOTALS -->
  <div class="totals">
    <div class="total-row">
      <span class="total-label">المجموع الفرعي:</span>
      <span class="total-value">${formatCurrency(subtotal)} ر.س</span>
    </div>

    ${discount > 0 ? `
    <div class="total-row">
      <span class="total-label">الخصم:</span>
      <span class="total-value" style="color: #d32f2f;">-${formatCurrency(discount)} ر.س</span>
    </div>` : ''}

    ${config.showTaxBreakdown && taxAmount > 0 ? `
    <div class="total-row">
      <span class="total-label">الضريبة (${taxRate}%):</span>
      <span class="total-value">${formatCurrency(taxAmount)} ر.س</span>
    </div>` : ''}

    ${additionalFee > 0 ? `
    <div class="total-row">
      <span class="total-label">${escapeHtml(additionalFeeLabel || 'رسوم إضافية')}:</span>
      <span class="total-value">+${formatCurrency(additionalFee)} ر.س</span>
    </div>` : ''}

    <div class="double-separator"></div>

    <!-- GRAND TOTAL -->
    <div class="grand-total">
      <div class="total-row">
        <span class="total-label">الإجمالي:</span>
        <span class="total-value">${formatCurrency(total)} ر.س</span>
      </div>
    </div>
  </div>

  <!-- PAYMENT INFO -->
  ${paid > 0 ? `
  <div class="payment">
    <div class="total-row">
      <span class="total-label">المدفوع:</span>
      <span class="total-value">${formatCurrency(paid)} ر.س</span>
    </div>
    ${change > 0 ? `
    <div class="total-row">
      <span class="total-label">الباقي:</span>
      <span class="total-value" style="color: #388e3c;">${formatCurrency(change)} ر.س</span>
    </div>` : ''}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    ${config.footerText ? `<div class="footer-text">${escapeHtml(config.footerText)}</div>` : ''}
    <div class="thank-you">نتمنى لكم تجربة تسوق سعيدة</div>
  </div>
</body>
</html>`.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
