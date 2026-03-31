/**
 * Hybrid Print Service
 * Uses Electron printer API when available, falls back to browser printing
 * Optimized for thermal printers (58mm/80mm)
 */

import JsBarcode from 'jsbarcode';
import * as electronPrinter from './electronPrinterService';
import { usePrinterConfigStore } from '../stores/printerConfigStore';
import { printReceiptAsImage } from './printReceiptHtml';

// Thermal printer configuration
export type ThermalPrinterWidth = '58mm' | '80mm';

// Global thermal printer width setting (default 80mm)
let thermalPrinterWidth: ThermalPrinterWidth = '80mm';

// Load saved width from localStorage on module load
if (typeof window !== 'undefined') {
  const savedWidth = localStorage.getItem('thermalPrinterWidth') as ThermalPrinterWidth;
  if (savedWidth === '58mm' || savedWidth === '80mm') {
    thermalPrinterWidth = savedWidth;
  }
}

/**
 * Set thermal printer width (58mm or 80mm)
 */
export const setThermalPrinterWidth = (width: ThermalPrinterWidth): void => {
  thermalPrinterWidth = width;
  // Save to localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('thermalPrinterWidth', width);
  }
};

/**
 * Get current thermal printer width
 */
export const getThermalPrinterWidth = (): ThermalPrinterWidth => {
  return thermalPrinterWidth;
};

export interface PrintReceiptOptions {
  sale: any; // Sale object
  company: any; // Company info
  cashier: any; // Cashier info
  width?: ThermalPrinterWidth; // Optional: override default width
  isPurchase?: boolean; // Optional: flag for purchase vs sale
}

export interface PrintBarcodeOptions {
  sku: string;
  productName: string;
  price: number;
  quantity?: number;
}

/**
 * Print a receipt
 * Uses Electron printer if available, otherwise browser print dialog
 */
export const printReceipt = async (options: PrintReceiptOptions): Promise<void> => {
  const { sale, company, cashier, width } = options;
  const printerWidth = width || thermalPrinterWidth;

  // Try Electron printer first
  if (electronPrinter.isElectron()) {
    try {
      // Always use image mode for best Arabic RTL support
      console.log('📄 Using HTML-to-Image print mode (always)');
      await printReceiptAsImage({ sale, company, cashier });
      return;
    } catch (error) {
      console.error('Electron print failed, falling back to browser print:', error);
      // Fall through to browser printing
    }
  }

  // Fallback to browser printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  // Generate receipt HTML with specified width
  const receiptHTML = generateReceiptHTML(sale, company, cashier, printerWidth);

  // Write HTML to new window
  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close window after printing (optional)
    setTimeout(() => printWindow.close(), 100);
  };
};

/**
 * Print barcode labels
 * Uses Electron printer if available, otherwise browser print dialog
 */
export const printBarcode = async (options: PrintBarcodeOptions): Promise<void> => {
  const { sku, productName, price, quantity = 1 } = options;

  // Debug logging
  console.log('🖨️ [printBarcode] Starting print request');
  console.log('🖨️ [printBarcode] Options:', { sku, productName, price, quantity });
  console.log('🖨️ [printBarcode] Checking Electron environment...');
  console.log('🖨️ [printBarcode] window.isElectron:', typeof window !== 'undefined' ? window.isElectron : 'N/A');
  console.log('🖨️ [printBarcode] window.printerAPI:', typeof window !== 'undefined' ? !!window.printerAPI : 'N/A');
  console.log('🖨️ [printBarcode] electronPrinter.isElectron():', electronPrinter.isElectron());

  // Try Electron printer first
  if (electronPrinter.isElectron()) {
    console.log('✅ [printBarcode] Electron detected! Using thermal printer...');
    try {
      // Get printer config from store
      const printerConfig = usePrinterConfigStore.getState();

      console.log('📋 [printBarcode] Printer config from store:', {
        printerName: printerConfig.printerName,
        connectionType: printerConfig.connectionType,
        ipAddress: printerConfig.ipAddress,
        port: printerConfig.port,
        isLoading: printerConfig.isLoading,
        error: printerConfig.error,
      });

      // Check if config is loaded
      if (!printerConfig.printerName && !printerConfig.ipAddress) {
        console.warn('⚠️ [printBarcode] Printer config seems empty!');
        console.warn('   Did you save printer settings?');
      }

      const labelData = {
        productName,
        sku,
        price,
        labelWidth: printerConfig.labelWidth,
        labelHeight: printerConfig.labelHeight,
        labelFontSize: printerConfig.labelFontSize,
        barcodeFormat: printerConfig.barcodeFormat,
        barcodeHeight: printerConfig.barcodeHeight,
        barcodeWidth: printerConfig.barcodeWidth,
      };

      // Prepare printer configuration for Electron
      const electronConfig = {
        printerName: printerConfig.printerName,
        connectionType: printerConfig.connectionType,
        ipAddress: printerConfig.ipAddress,
        port: printerConfig.port,
        paperWidth: printerConfig.paperWidth,
        marginTop: printerConfig.marginTop,
        marginBottom: printerConfig.marginBottom,
        showLogo: printerConfig.showLogo,
        showOrderId: printerConfig.showOrderId,
        showTaxBreakdown: printerConfig.showTaxBreakdown,
        showQRCode: printerConfig.showQRCode,
        headerText: printerConfig.headerText || '',
        footerText: printerConfig.footerText || '',
        characterSet: 'windows-1256',
        cutPaper: printerConfig.cutPaper,
      };

      console.log('🖨️ [printBarcode] Calling electronPrinter.printLabel with:', labelData);
      console.log('🖨️ [printBarcode] Printer config:', electronConfig);
      const result = await electronPrinter.printLabel(labelData, electronConfig);
      console.log('🖨️ [printBarcode] Print result:', result);

      if (!result.success) {
        // Show clear error message - DON'T fall back to browser in Electron
        const errorMessage = result.error || 'فشلت طباعة الباركود';
        console.error('❌ [printBarcode] Print failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('✅ [printBarcode] Print successful!');
      return;
    } catch (error: any) {
      console.error('❌ [printBarcode] Electron label print failed:', error);
      // In Electron: throw error to show to user (don't fall back to browser)
      throw error;
    }
  }

  // ========================================
  // BROWSER FALLBACK (for web version only)
  // ========================================
  console.log('⚠️ [printBarcode] Electron NOT detected. Using browser fallback...');

  // Fallback to browser printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    alert('Please allow popups to print barcodes');
    return;
  }

  // Generate barcode HTML
  const barcodeHTML = generateBarcodeHTML(sku, productName, price, quantity);

  printWindow.document.write(barcodeHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    // Generate barcode SVG after DOM is ready
    try {
      const svg = printWindow.document.getElementById('barcode');
      if (svg) {
        JsBarcode(svg, sku, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
    }

    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 100);
  };
};

/**
 * Generate receipt HTML optimized for thermal printers
 */
function generateReceiptHTML(sale: any, company: any, cashier: any, width: ThermalPrinterWidth = '80mm'): string {
  const items = sale.items || sale.saleItems || [];

  // Adjust font size based on printer width
  const fontSize = width === '58mm' ? '9px' : '11px';
  const headerFontSize = width === '58mm' ? '14px' : '16px';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${sale.id}</title>
  <style>
    /* Thermal Printer Optimization for ${width} */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      @page {
        size: ${width} auto; /* Thermal paper width */
        margin: 0mm; /* No margins for thermal printers */
      }
    }

    body {
      font-family: 'Courier New', monospace;
      width: ${width}; /* Thermal printer width */
      margin: 0 auto;
      padding: 5mm;
      font-size: ${fontSize};
      line-height: 1.3;
    }

    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .company-name {
      font-size: ${headerFontSize};
      font-weight: bold;
      margin-bottom: 5px;
    }

    .company-info {
      font-size: calc(${fontSize} - 1px);
      margin: 2px 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10px;
    }

    .items-table th {
      text-align: left;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      font-size: 9px;
    }

    .items-table td {
      padding: 3px 0;
      border-bottom: 1px dotted #ccc;
      font-size: 10px;
    }

    .items-table td:nth-child(1) { width: 45%; } /* Item name */
    .items-table td:nth-child(2) { width: 15%; text-align: center; } /* Qty */
    .items-table td:nth-child(3) { width: 20%; text-align: right; } /* Price */
    .items-table td:nth-child(4) { width: 20%; text-align: right; } /* Total */

    .totals {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px dashed #000;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }

    .total-row.grand-total {
      font-size: 14px;
      font-weight: bold;
      margin-top: 8px;
      padding-top: 5px;
      border-top: 2px solid #000;
    }

    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 8px;
      border-top: 2px dashed #000;
      font-size: 9px;
    }

    /* Ensure text doesn't wrap on thermal printer */
    .nowrap {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${company?.name || 'POS System'}</div>
    ${company?.address ? `<div class="company-info">${company.address}</div>` : ''}
    ${company?.phone ? `<div class="company-info">Tel: ${company.phone}</div>` : ''}
    ${company?.taxId ? `<div class="company-info">Tax ID: ${company.taxId}</div>` : ''}
  </div>

  <div style="margin: 10px 0;">
    <div>Date: ${new Date(sale.createdAt).toLocaleString()}</div>
    <div>Receipt #: ${sale.id}</div>
    ${cashier ? `<div>Cashier: ${cashier.name || cashier.email}</div>` : ''}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.product?.name || item.productName || 'Item'}</td>
          <td>${item.quantity || 1}</td>
          <td>${formatCurrency(item.unitPrice || item.price || 0)}</td>
          <td>${formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(sale.subtotal || 0)}</span>
    </div>
    ${sale.taxAmount ? `
    <div class="total-row">
      <span>Tax (${sale.taxRate || 0}%):</span>
      <span>${formatCurrency(sale.taxAmount)}</span>
    </div>
    ` : ''}
    ${sale.discountAmount ? `
    <div class="total-row">
      <span>Discount:</span>
      <span>-${formatCurrency(sale.discountAmount)}</span>
    </div>
    ` : ''}
    ${sale.additionalFee ? `
    <div class="total-row">
      <span>${sale.additionalFeeLabel || 'Additional Fee'}:</span>
      <span>+${formatCurrency(sale.additionalFee)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>${formatCurrency(sale.total || 0)}</span>
    </div>
    ${sale.paidAmount ? `
    <div class="total-row">
      <span>Paid:</span>
      <span>${formatCurrency(sale.paidAmount)}</span>
    </div>
    <div class="total-row">
      <span>Change:</span>
      <span>${formatCurrency((sale.paidAmount || 0) - (sale.total || 0))}</span>
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <div>Thank you for your business!</div>
    <div>Visit us again soon</div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate barcode label HTML
 */
function generateBarcodeHTML(sku: string, productName: string, price: number, quantity: number): string {
  // Create multiple labels for quantity
  const labels = Array.from({ length: quantity }, (_, i) => `
    <div class="barcode-label">
      <div class="product-name">${productName}</div>
      <svg id="barcode${i === 0 ? '' : i}" class="barcode-svg"></svg>
      <div class="price">Price: ${formatCurrency(price)}</div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcode - ${sku}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.3/dist/JsBarcode.all.min.js"></script>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      @page { margin: 5mm; size: 50mm 30mm; }
      .barcode-label { page-break-after: always; }
      .barcode-label:last-child { page-break-after: auto; }
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
    }

    .barcode-label {
      width: 50mm;
      height: 30mm;
      border: 1px solid #ccc;
      padding: 5mm;
      margin-bottom: 5mm;
      text-align: center;
      display: inline-block;
    }

    .product-name {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 3mm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .barcode-svg {
      max-width: 100%;
      height: auto;
    }

    .price {
      font-size: 12px;
      font-weight: bold;
      margin-top: 2mm;
    }
  </style>
  <script>
    window.onload = function() {
      ${Array.from({ length: quantity }, (_, i) => `
      try {
        JsBarcode("#barcode${i === 0 ? '' : i}", "${sku}", {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 5,
        });
      } catch (e) {
        console.error('Error generating barcode ${i}:', e);
      }
      `).join('\n')}

      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</head>
<body>
  ${labels}
</body>
</html>
  `;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
