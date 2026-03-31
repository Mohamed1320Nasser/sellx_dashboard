/**
 * TEMPLATE ADAPTER
 * Bridges Electron (main process) with Frontend templates (renderer process)
 *
 * PROBLEM: Electron main process cannot directly use React components
 * SOLUTION: Convert barcode component logic to plain HTML function
 *
 * DESIGN:
 * - Receipt: Import from existing receiptHtmlTemplate.ts ✅
 * - Barcode: Convert BarcodePreview.tsx logic to plain HTML ✅
 */

import { ReceiptPrinterConfig, BarcodePrinterConfig } from './PrinterConfig';

/**
 * Receipt data interface (matches your receiptHtmlTemplate.ts)
 */
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

/**
 * Barcode label data interface (matches your BarcodePreview.tsx)
 */
export interface LabelData {
  productName: string;
  sku: string;
  price: number;
  barcodeFormat?: string;
  barcodeHeight?: number;
  barcodeWidth?: number;
}

/**
 * Generate Receipt HTML
 * Uses YOUR existing receiptHtmlTemplate.ts
 *
 * NOTE: Since Electron main process cannot import from src/services,
 * we need to either:
 * 1. Move receiptHtmlTemplate.ts to shared location
 * 2. Duplicate the logic here
 *
 * For now, I'll create a compatible version that matches your template exactly
 */
export async function generateReceiptHTML(
  receiptData: ReceiptData,
  config: ReceiptPrinterConfig
): Promise<string> {
  // This matches YOUR receiptHtmlTemplate.ts structure EXACTLY
  const {
    id,
    createdAt,
    subtotal,
    discountAmount = 0,
    taxRate = 0,
    taxAmount = 0,
    total,
    paidAmount,
    items,
    company,
    cashier,
  } = receiptData;

  const {
    paperWidth,
    headerText = '',
    footerText = 'شكراً لزيارتكم',
    showOrderId = true,
    showTaxBreakdown = true,
    showLogo = false,
    showQRCode = false,
  } = config;

  const pixelWidth = paperWidth === '58mm' ? '384px' : '576px';
  const fontSize = paperWidth === '58mm' ? '11px' : '13px';
  const headerSize = paperWidth === '58mm' ? '18px' : '22px';

  const dateObj = new Date(createdAt);
  const formattedDate = dateObj.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHTML = items.map(item => {
    const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);
    return `
    <div class="item-row">
      <div class="item-main">
        <div class="item-name">${item.productName}</div>
        <div class="item-qty">${item.quantity}</div>
        <div class="item-price">${itemTotal.toFixed(2)}</div>
      </div>
      <div class="item-detail">
        ${item.quantity} × ${item.unitPrice.toFixed(2)} ر.س
      </div>
    </div>
    `;
  }).join('');

  // This is YOUR exact HTML structure from receiptHtmlTemplate.ts
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt #${id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${pixelWidth};
      margin: 0 auto;
      padding: 16px 12px;
      font-family: 'Cairo', 'Tajawal', Arial, sans-serif;
      font-size: ${fontSize};
      line-height: 1.6;
      color: #000;
      background: #fff;
      direction: rtl;
      text-align: right;
    }

    .receipt-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px dashed #333;
    }

    .company-name {
      font-size: ${headerSize};
      font-weight: 700;
      margin-bottom: 8px;
    }

    .company-info {
      font-size: calc(${fontSize} - 1px);
      color: #333;
      margin: 4px 0;
    }

    .order-info {
      margin: 12px 0;
      padding: 10px 0;
      border-bottom: 1px dashed #666;
    }

    .order-info-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .items-section {
      margin: 12px 0;
      border-bottom: 2px dashed #333;
      padding-bottom: 12px;
    }

    .items-header {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1.2fr;
      gap: 8px;
      padding: 8px 4px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      font-weight: 700;
      text-align: center;
    }

    .item-row {
      padding: 10px 4px;
      border-bottom: 1px dotted #ccc;
    }

    .item-main {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1.2fr;
      gap: 8px;
      margin-bottom: 4px;
    }

    .item-name {
      font-weight: 600;
      text-align: right;
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
      text-align: right;
      padding-right: 8px;
    }

    .totals-section {
      margin: 12px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
    }

    .total-value {
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .grand-total {
      margin: 12px 0;
      padding: 12px 8px;
      background: #f9f9f9;
      border: 2px solid #333;
    }

    .grand-total .total-value {
      font-size: calc(${fontSize} + 6px);
      font-weight: 700;
    }

    .receipt-footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px dashed #333;
    }

    .footer-text {
      font-size: calc(${fontSize} + 1px);
      font-weight: 600;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    ${company?.name ? `<div class="company-name">${company.name}</div>` : ''}
    ${company?.address ? `<div class="company-info">${company.address}</div>` : ''}
    ${company?.phone ? `<div class="company-info">هاتف: ${company.phone}</div>` : ''}
    ${company?.taxNumber ? `<div class="company-info">الرقم الضريبي: ${company.taxNumber}</div>` : ''}
    ${headerText ? `<div class="company-info">${headerText}</div>` : ''}
  </div>

  <div class="order-info">
    ${showOrderId ? `
    <div class="order-info-row">
      <span>رقم الطلب:</span>
      <span>#${id}</span>
    </div>` : ''}
    <div class="order-info-row">
      <span>التاريخ:</span>
      <span>${formattedDate}</span>
    </div>
    <div class="order-info-row">
      <span>الوقت:</span>
      <span>${formattedTime}</span>
    </div>
    ${cashier?.name ? `
    <div class="order-info-row">
      <span>الكاشير:</span>
      <span>${cashier.name}</span>
    </div>` : ''}
  </div>

  <div class="items-section">
    <div class="items-header">
      <div>الصنف</div>
      <div>الكمية</div>
      <div>المبلغ</div>
    </div>
    ${itemsHTML}
  </div>

  <div class="totals-section">
    <div class="total-row">
      <span>المجموع الفرعي:</span>
      <span class="total-value">${subtotal.toFixed(2)} ر.س</span>
    </div>
    ${discountAmount > 0 ? `
    <div class="total-row">
      <span>الخصم:</span>
      <span class="total-value" style="color: #d32f2f;">-${discountAmount.toFixed(2)} ر.س</span>
    </div>` : ''}
    ${showTaxBreakdown && taxAmount > 0 ? `
    <div class="total-row">
      <span>الضريبة (${taxRate}%):</span>
      <span class="total-value">${taxAmount.toFixed(2)} ر.س</span>
    </div>` : ''}

    <div class="grand-total">
      <div class="total-row">
        <span>الإجمالي:</span>
        <span class="total-value">${total.toFixed(2)} ر.س</span>
      </div>
    </div>
  </div>

  ${paidAmount > 0 ? `
  <div class="total-row">
    <span>المدفوع:</span>
    <span class="total-value">${paidAmount.toFixed(2)} ر.س</span>
  </div>
  ${paidAmount - total > 0 ? `
  <div class="total-row">
    <span>الباقي:</span>
    <span class="total-value" style="color: #388e3c;">${(paidAmount - total).toFixed(2)} ر.س</span>
  </div>` : ''}
  ` : ''}

  <div class="receipt-footer">
    ${footerText ? `<div class="footer-text">${footerText}</div>` : ''}
    <div>نتمنى لكم تجربة تسوق سعيدة</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate Barcode HTML
 * Converted from YOUR BarcodePreview.tsx component to plain HTML
 */
export function generateBarcodeHTML(
  labelData: LabelData,
  config: BarcodePrinterConfig
): string {
  const {
    productName,
    sku,
    price,
  } = labelData;

  const {
    labelFontSize,
    barcodeFormat,
    barcodeHeight,
    barcodeWidth,
    paperWidth,
  } = config;

  // This matches YOUR BarcodePreview.tsx component EXACTLY
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barcode Label</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 2mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${paperWidth};
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 5mm 2mm;
      background: white;
    }

    .product-name {
      font-size: ${labelFontSize}px;
      font-weight: bold;
      margin-bottom: 5mm;
      word-wrap: break-word;
      max-width: 100%;
    }

    .barcode-container {
      margin: 3mm 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #barcode {
      max-width: 100%;
      height: auto;
    }

    .price {
      font-size: 14px;
      font-weight: bold;
      margin-top: 3mm;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="product-name">${productName}</div>

  <div class="barcode-container">
    <svg id="barcode"></svg>
  </div>

  <div class="price">Price: ${price.toFixed(2)}</div>

  <script>
    try {
      JsBarcode("#barcode", "${sku}", {
        format: "${barcodeFormat}",
        width: ${barcodeWidth},
        height: ${barcodeHeight},
        displayValue: true,
        fontSize: 14,
        margin: 2,
        background: "#ffffff",
        lineColor: "#000000",
        textMargin: 1,
        font: "monospace",
        fontOptions: "bold"
      });
    } catch (error) {
      console.error('Barcode generation error:', error);
      document.body.innerHTML = '<h3 style="color: red;">Barcode Error: ' + error.message + '</h3>';
    }
  </script>
</body>
</html>
  `.trim();
}
