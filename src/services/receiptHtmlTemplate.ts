/**
 * Professional Receipt HTML Template
 * Supports 58mm and 80mm thermal paper
 * Optimized for Arabic text
 */

import QRCode from 'qrcode';

export interface ReceiptTemplateData {
  // Order Info
  orderId: string | number;
  orderDate: Date | string;

  // Company Info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyTaxId?: string;
  companyLogo?: string;

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

  // Settings
  paperWidth: '58mm' | '80mm';
  showLogo?: boolean;
  showOrderId?: boolean;
  showTaxBreakdown?: boolean;
  showQRCode?: boolean;
  headerText?: string;
  footerText?: string;
}

/**
 * Generate professional receipt HTML
 */
export async function generateReceiptHTML(data: ReceiptTemplateData): Promise<string> {
  const {
    orderId,
    orderDate,
    companyName,
    companyAddress,
    companyPhone,
    companyTaxId,
    companyLogo,
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
    paperWidth = '80mm',
    showLogo = false,
    showOrderId = true,
    showTaxBreakdown = true,
    showQRCode = false,
    headerText = '',
    footerText = 'شكراً لزيارتكم',
  } = data;

  // Generate QR Code if enabled (Saudi ZATCA format for e-invoicing)
  let qrCodeDataUrl = '';
  if (showQRCode) {
    try {
      // ZATCA e-invoicing QR format:
      // Seller name | Tax number | Date | Total | Tax amount
      const qrData = [
        companyName,
        companyTaxId || '',
        new Date(orderDate).toISOString(),
        total.toFixed(2),
        taxAmount.toFixed(2),
      ].join('|');

      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('QR Code generation error:', error);
      // Continue without QR code if generation fails
    }
  }

  // Calculate pixel width for paper size
  const pixelWidth = paperWidth === '58mm' ? '384px' : '576px'; // 58mm = 384px, 80mm = 576px at 72dpi
  const fontSize = paperWidth === '58mm' ? '11px' : '13px';
  const headerSize = paperWidth === '58mm' ? '18px' : '22px';
  const totalSize = paperWidth === '58mm' ? '20px' : '26px';

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt #${orderId}</title>
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

    /* Header Section */
    .receipt-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px dashed #333;
    }

    .company-logo {
      max-width: 120px;
      max-height: 80px;
      margin: 0 auto 12px;
      display: block;
    }

    .company-name {
      font-size: ${headerSize};
      font-weight: 700;
      margin-bottom: 8px;
      color: #000;
      letter-spacing: 0.5px;
    }

    .company-info {
      font-size: calc(${fontSize} - 1px);
      color: #333;
      line-height: 1.5;
      margin: 4px 0;
    }

    .header-custom-text {
      font-size: ${fontSize};
      font-weight: 600;
      margin-top: 8px;
      color: #000;
    }

    /* Order Info Section */
    .order-info {
      margin: 12px 0;
      padding: 10px 0;
      border-bottom: 1px dashed #666;
      font-size: ${fontSize};
    }

    .order-info-row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
    }

    .order-info-label {
      font-weight: 600;
      color: #000;
    }

    .order-info-value {
      color: #333;
    }

    /* Items Table */
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
      font-size: calc(${fontSize} - 1px);
      text-align: center;
    }

    .items-header-name { text-align: right; }
    .items-header-qty { text-align: center; }
    .items-header-price { text-align: left; }

    .item-row {
      padding: 10px 4px;
      border-bottom: 1px dotted #ccc;
    }

    .item-main {
      display: grid;
      grid-template-columns: 2fr 0.8fr 1.2fr;
      gap: 8px;
      align-items: center;
      margin-bottom: 4px;
    }

    .item-name {
      font-weight: 600;
      color: #000;
      text-align: right;
      word-wrap: break-word;
    }

    .item-qty {
      text-align: center;
      font-weight: 600;
      color: #333;
    }

    .item-price {
      text-align: left;
      font-weight: 700;
      color: #000;
      font-family: 'Courier New', monospace;
    }

    .item-detail {
      font-size: calc(${fontSize} - 2px);
      color: #666;
      text-align: right;
      padding-right: 8px;
    }

    /* Totals Section */
    .totals-section {
      margin: 12px 0;
      font-size: ${fontSize};
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      align-items: center;
    }

    .total-label {
      font-weight: 600;
      color: #333;
    }

    .total-value {
      font-weight: 700;
      font-family: 'Courier New', monospace;
      color: #000;
    }

    .separator-line {
      border-top: 1px solid #999;
      margin: 8px 0;
    }

    .separator-double {
      border-top: 3px double #333;
      margin: 10px 0;
    }

    /* Grand Total */
    .grand-total {
      margin: 12px 0;
      padding: 12px 8px;
      background: #f9f9f9;
      border: 2px solid #333;
      border-radius: 4px;
    }

    .grand-total .total-label {
      font-size: calc(${fontSize} + 2px);
      font-weight: 700;
      color: #000;
    }

    .grand-total .total-value {
      font-size: ${totalSize};
      font-weight: 700;
      color: #000;
    }

    /* Payment Section */
    .payment-section {
      margin: 12px 0;
      padding: 10px 0;
      border-top: 2px dashed #333;
      border-bottom: 2px dashed #333;
    }

    /* Footer Section */
    .receipt-footer {
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px dashed #333;
    }

    .footer-text {
      font-size: calc(${fontSize} + 1px);
      font-weight: 600;
      color: #000;
      margin-bottom: 8px;
    }

    .thank-you {
      font-size: ${fontSize};
      color: #333;
      font-style: italic;
      margin-top: 8px;
    }

    .footer-date {
      font-size: calc(${fontSize} - 2px);
      color: #666;
      margin-top: 12px;
    }

    /* Utility Classes */
    .text-center { text-align: center; }
    .text-bold { font-weight: 700; }
    .text-muted { color: #666; }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="receipt-header">
    ${showLogo && companyLogo ? `<img src="${companyLogo}" alt="Logo" class="company-logo">` : ''}
    <div class="company-name">${companyName}</div>
    ${companyAddress ? `<div class="company-info">${companyAddress}</div>` : ''}
    ${companyPhone ? `<div class="company-info">هاتف: ${companyPhone}</div>` : ''}
    ${companyTaxId ? `<div class="company-info">الرقم الضريبي: ${companyTaxId}</div>` : ''}
    ${headerText ? `<div class="header-custom-text">${headerText}</div>` : ''}
  </div>

  <!-- ORDER INFO -->
  <div class="order-info">
    ${showOrderId ? `
    <div class="order-info-row">
      <span class="order-info-label">رقم الطلب:</span>
      <span class="order-info-value">#${orderId}</span>
    </div>` : ''}
    <div class="order-info-row">
      <span class="order-info-label">التاريخ:</span>
      <span class="order-info-value">${formattedDate}</span>
    </div>
    <div class="order-info-row">
      <span class="order-info-label">الوقت:</span>
      <span class="order-info-value">${formattedTime}</span>
    </div>
    ${cashierName ? `
    <div class="order-info-row">
      <span class="order-info-label">الكاشير:</span>
      <span class="order-info-value">${cashierName}</span>
    </div>` : ''}
  </div>

  <!-- ITEMS -->
  <div class="items-section">
    <div class="items-header">
      <div class="items-header-name">الصنف</div>
      <div class="items-header-qty">الكمية</div>
      <div class="items-header-price">المبلغ</div>
    </div>

    ${items.map(item => `
    <div class="item-row">
      <div class="item-main">
        <div class="item-name">${item.name}</div>
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
  <div class="totals-section">
    <div class="total-row">
      <span class="total-label">المجموع الفرعي:</span>
      <span class="total-value">${formatCurrency(subtotal)} ر.س</span>
    </div>

    ${discount > 0 ? `
    <div class="total-row">
      <span class="total-label">الخصم:</span>
      <span class="total-value" style="color: #d32f2f;">-${formatCurrency(discount)} ر.س</span>
    </div>` : ''}

    ${showTaxBreakdown && taxAmount > 0 ? `
    <div class="total-row">
      <span class="total-label">الضريبة (${taxRate}%):</span>
      <span class="total-value">${formatCurrency(taxAmount)} ر.س</span>
    </div>` : ''}

    ${additionalFee > 0 ? `
    <div class="total-row">
      <span class="total-label">${additionalFeeLabel || 'رسوم إضافية'}:</span>
      <span class="total-value">+${formatCurrency(additionalFee)} ر.س</span>
    </div>` : ''}

    <div class="separator-double"></div>

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
  <div class="payment-section">
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
  <div class="receipt-footer">
    ${footerText ? `<div class="footer-text">${footerText}</div>` : ''}
    <div class="thank-you">نتمنى لكم تجربة تسوق سعيدة</div>

    ${qrCodeDataUrl ? `
    <div style="text-align: center; margin: 15px 0;">
      <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px; margin: 0 auto; display: block;" />
      <div style="font-size: 9px; color: #666; margin-top: 5px;">امسح رمز QR للتحقق من الفاتورة</div>
    </div>
    ` : ''}

    <div class="footer-date">تم الطباعة: ${new Date().toLocaleString('ar-EG')}</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper function to convert sale/company/cashier data to ReceiptTemplateData
 */
export function saleToReceiptData(params: {
  sale: any;
  company: any;
  cashier: any;
  paperWidth?: '58mm' | '80mm';
  showLogo?: boolean;
  showOrderId?: boolean;
  showTaxBreakdown?: boolean;
  showQRCode?: boolean;
  headerText?: string;
  footerText?: string;
}): ReceiptTemplateData {
  const { sale, company, cashier, ...settings } = params;

  return {
    orderId: sale.receiptNumber || sale.id || 'N/A',
    orderDate: sale.createdAt || sale.saleDate || new Date(),
    companyName: company?.name || company?.company?.name || 'POS System',
    companyAddress: company?.address || company?.company?.address,
    companyPhone: company?.phone || company?.company?.phone,
    companyTaxId: company?.taxNumber || company?.company?.taxNumber,
    companyLogo: company?.logoUrl || company?.company?.logoUrl || undefined,
    cashierName: cashier?.fullname || cashier?.name || cashier?.username,
    items: (sale.items || []).map((item: any) => ({
      name: item.productName || item.product?.name || 'Item',
      quantity: item.quantity || 1,
      unitPrice: parseFloat(item.unitPrice || item.price || 0),
      totalPrice: parseFloat(item.totalPrice || item.total || (item.quantity * item.unitPrice) || 0),
    })),
    subtotal: parseFloat(sale.subtotal || 0),
    discount: parseFloat(sale.discountAmount || 0),
    taxRate: parseFloat(sale.taxRate || 0),
    taxAmount: parseFloat(sale.taxAmount || 0),
    additionalFee: parseFloat(sale.additionalFee || 0),
    additionalFeeLabel: sale.additionalFeeLabel || '',
    total: parseFloat(sale.totalAmount || sale.total || 0),
    paid: parseFloat(sale.paidAmount || 0),
    change: parseFloat(sale.paidAmount || 0) - parseFloat(sale.totalAmount || sale.total || 0),
    paperWidth: settings.paperWidth || '80mm',
    showLogo: settings.showLogo !== undefined ? settings.showLogo : false,
    showOrderId: settings.showOrderId !== undefined ? settings.showOrderId : true,
    showTaxBreakdown: settings.showTaxBreakdown !== undefined ? settings.showTaxBreakdown : true,
    showQRCode: settings.showQRCode !== undefined ? settings.showQRCode : false,
    headerText: settings.headerText,
    footerText: settings.footerText || 'شكراً لزيارتكم',
  };
}
