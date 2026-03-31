/**
 * Print Receipt using HTML to Image method
 * This service generates HTML, converts to image, and prints to thermal printer
 */

import { exportReceiptAsImage } from './exportReceiptAsImage';
import { blobToArrayBuffer } from './htmlToImageService';
import { usePrinterConfigStore } from '../stores/printerConfigStore';

export interface PrintReceiptHtmlOptions {
  sale: any;
  company: any;
  cashier: any;
}

/**
 * Print receipt using HTML to Image method
 * This provides better Arabic font rendering and more styling control
 */
export async function printReceiptAsImage(options: PrintReceiptHtmlOptions): Promise<void> {
  const { sale, company, cashier } = options;

  // Check if running in Electron
  if (typeof window === 'undefined' || !window.isElectron || !window.printerAPI) {
    throw new Error('Image printing is only available in Electron app');
  }

  try {
    console.log('🖨️ Starting HTML-to-Image print...');

    // Check if running in Electron
    console.log('🔍 Checking environment...', {
      isElectron: window.isElectron,
      hasPrinterAPI: !!window.printerAPI,
      hasPrintImage: !!window.printerAPI?.printImage,
    });

    // Get printer config from store
    const printerConfig = usePrinterConfigStore.getState();
    console.log('⚙️ Printer config loaded:', {
      paperWidth: printerConfig.paperWidth,
      connectionType: printerConfig.connectionType,
    });

    // Prepare receipt data for HTML template
    const receiptData = {
      orderId: sale.id,
      orderDate: sale.createdAt || sale.saleDate || new Date(),

      companyName: company?.name || company?.company?.name || 'متجر',
      companyAddress: company?.address || company?.company?.address,
      companyPhone: company?.phone || company?.company?.phone,
      companyTaxId: company?.taxId || company?.taxNumber || company?.company?.taxId,
      companyLogo: company?.logoUrl || company?.company?.logoUrl || undefined,

      cashierName: cashier?.fullname || cashier?.name || cashier?.username,

      items: (sale.items || []).map((item: any) => ({
        name: item.productName || item.product?.name || 'منتج',
        quantity: item.quantity || 0,
        unitPrice: parseFloat(item.unitPrice || 0),
        totalPrice: parseFloat(item.totalPrice || item.total || 0),
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

      paperWidth: printerConfig.paperWidth || '80mm',
      showLogo: printerConfig.showLogo,
      showOrderId: printerConfig.showOrderId,
      showTaxBreakdown: printerConfig.showTaxBreakdown,
      showQRCode: printerConfig.showQRCode,
      headerText: printerConfig.headerText || '',
      footerText: printerConfig.footerText || 'شكراً لزيارتكم',
    };

    console.log('📄 Receipt data prepared:', receiptData);

    // Convert receipt to image using html2canvas (proven method)
    console.log('🔄 Converting receipt to image using html2canvas...');
    const imageBlob = await exportReceiptAsImage(receiptData);
    console.log('✅ Image blob created, size:', imageBlob.size, 'bytes');

    // Convert Blob to ArrayBuffer
    console.log('🔄 Converting blob to ArrayBuffer...');
    const imageBuffer = await blobToArrayBuffer(imageBlob);
    console.log('✅ Image buffer created, size:', imageBuffer.byteLength, 'bytes');

    // Build config for Electron
    const config = {
      printerName: printerConfig.printerName || 'Thermal Printer',
      connectionType: printerConfig.connectionType,
      ipAddress: printerConfig.ipAddress,
      port: printerConfig.port,
      paperWidth: printerConfig.paperWidth,
      marginTop: printerConfig.marginTop,
      marginBottom: printerConfig.marginBottom,
      cutPaper: printerConfig.cutPaper,
    };

    console.log('🖨️ Sending to printer...');
    console.log('Config:', config);
    console.log('Image buffer type:', imageBuffer.constructor.name);
    console.log('Image buffer size:', imageBuffer.byteLength);

    // Print multiple copies if configured
    const printCopies = printerConfig.printCopies || 1;
    console.log(`📄 Printing ${printCopies} ${printCopies === 1 ? 'copy' : 'copies'}...`);

    for (let i = 0; i < printCopies; i++) {
      if (i > 0) {
        console.log(`📄 Printing copy ${i + 1} of ${printCopies}...`);
      }

      // Send to printer
      const result = await window.printerAPI.printImage(imageBuffer, config);
      console.log(`🔍 Print result for copy ${i + 1}:`, result);

      if (!result.success) {
        throw new Error(result.error || `فشلت عملية الطباعة في النسخة ${i + 1}`);
      }
    }

    console.log(`✅ Receipt printed successfully! (${printCopies} ${printCopies === 1 ? 'copy' : 'copies'})`);

  } catch (error: any) {
    console.error('❌ Print receipt error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    throw new Error(`خطأ في الطباعة: ${error.message || 'خطأ غير معروف'}`);
  }
}

/**
 * Preview receipt as image before printing
 */
export async function previewReceiptHtml(options: PrintReceiptHtmlOptions): Promise<void> {
  const { sale, company, cashier } = options;

  // Get printer config from store
  const printerConfig = usePrinterConfigStore.getState();

  // Prepare receipt data
  const receiptData = {
    orderId: sale.id,
    orderDate: sale.createdAt || sale.saleDate || new Date(),

    companyName: company?.name || company?.company?.name || 'متجر',
    companyAddress: company?.address || company?.company?.address,
    companyPhone: company?.phone || company?.company?.phone,
    companyTaxId: company?.taxId || company?.taxNumber || company?.company?.taxId,
    companyLogo: company?.logoUrl || company?.company?.logoUrl || undefined,

    cashierName: cashier?.fullname || cashier?.name || cashier?.username,

    items: (sale.items || []).map((item: any) => ({
      name: item.productName || item.product?.name || 'منتج',
      quantity: item.quantity || 0,
      unitPrice: parseFloat(item.unitPrice || 0),
      totalPrice: parseFloat(item.totalPrice || item.total || 0),
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

    paperWidth: printerConfig.paperWidth || '80mm',
    showLogo: printerConfig.showLogo,
    showOrderId: printerConfig.showOrderId,
    showTaxBreakdown: printerConfig.showTaxBreakdown,
    showQRCode: printerConfig.showQRCode,
    headerText: printerConfig.headerText || '',
    footerText: printerConfig.footerText || 'شكراً لزيارتكم',
  };

  try {
    // Generate image blob
    const imageBlob = await exportReceiptAsImage(receiptData);

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(imageBlob);

    // Open in new window
    const previewWindow = window.open('', '_blank', 'width=600,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt Preview</title>
          <style>
            body { margin: 0; padding: 20px; background: #f0f0f0; text-align: center; }
            img { max-width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <h2>Receipt Preview</h2>
          <img src="${imageUrl}" alt="Receipt Preview" />
        </body>
        </html>
      `);
      previewWindow.document.close();
    } else {
      alert('يرجى السماح بالنوافذ المنبثقة لمعاينة الإيصال');
    }
  } catch (error: any) {
    console.error('Preview error:', error);
    alert(`فشل عرض الإيصال: ${error.message}`);
  }
}
