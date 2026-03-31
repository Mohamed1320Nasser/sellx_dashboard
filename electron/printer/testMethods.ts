/**
 * PRINTER TEST METHODS
 *
 * Test different printing methods to find which works best
 * for USB thermal printers (Xprinter XP-Q361U)
 */

import { BrowserWindow } from 'electron';
import { PrinterConfig, PrintResult } from './types';
import { selectBestPrinter } from './PrinterDetector';
import { generateReceiptHTML } from './receiptTemplate';
import { printReceiptSimple } from './SimpleReceiptRenderer';
import escpos from 'escpos';
// @ts-ignore
import USB from 'escpos-usb';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Test receipt data (same for all methods)
 */
const TEST_RECEIPT_DATA = {
  orderId: 'TEST-001',
  orderDate: new Date(),
  companyName: 'اختبار الطابعة - Test Printer',
  companyAddress: '123 Test Street, Test City',
  companyPhone: '0123456789',
  companyTaxId: 'TAX-12345',
  cashierName: 'Test Cashier',
  items: [
    {
      name: 'منتج تجريبي 1 - Test Product 1',
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
    },
    {
      name: 'منتج تجريبي 2 - Test Product 2',
      quantity: 1,
      unitPrice: 75,
      totalPrice: 75,
    },
    {
      name: 'منتج تجريبي 3 - Test Product 3',
      quantity: 3,
      unitPrice: 25,
      totalPrice: 75,
    },
  ],
  subtotal: 250,
  discount: 0,
  taxRate: 15,
  taxAmount: 37.5,
  additionalFee: 0,
  additionalFeeLabel: '',
  total: 287.5,
  paid: 300,
  change: 12.5,
};

/**
 * METHOD 1: Electron Native Print (Current Method)
 * Generates HTML → Uses Electron webContents.print()
 * STATUS: ❌ Produces garbage on thermal printers
 */
export async function testMethod1_ElectronNative(config: PrinterConfig): Promise<PrintResult> {
  const startTime = Date.now();

  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   TEST METHOD 1: Electron Native Print   ║');
    console.log('╚═══════════════════════════════════════════╝');

    const result = await printReceiptSimple(TEST_RECEIPT_DATA, config);

    const duration = Date.now() - startTime;
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('═════════════════════════════════════════════');

    return {
      ...result,
      message: result.message + ` (${(duration / 1000).toFixed(1)}s)`,
    };
  } catch (error: any) {
    console.error('❌ Method 1 failed:', error);
    return {
      success: false,
      error: error.message || 'Method 1 failed',
    };
  }
}

/**
 * METHOD 2: HTML → Image → ESC/POS ⭐ RECOMMENDED
 * 1. Generate beautiful HTML
 * 2. Convert to PNG image
 * 3. Send as bitmap via ESC/POS
 */
export async function testMethod2_ImageToESCPOS(config: PrinterConfig): Promise<PrintResult> {
  const startTime = Date.now();
  let tempPath: string | null = null;

  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  TEST METHOD 2: HTML → Image → ESC/POS   ║');
    console.log('╚═══════════════════════════════════════════╝');

    // Step 1: Generate beautiful HTML
    console.log('📝 Step 1: Generating HTML...');
    const html = await generateReceiptHTML({
      ...TEST_RECEIPT_DATA,
      paperWidth: config.paperWidth,
      showLogo: false,
      showOrderId: true,
      showTaxBreakdown: true,
      showQRCode: false,
      headerText: 'TEST PRINT - METHOD 2',
      footerText: 'This is a test receipt',
    });

    // Step 2: Render HTML to image using BrowserWindow
    console.log('🖼️  Step 2: Converting HTML to image...');
    const window = new BrowserWindow({
      show: false,
      width: config.paperWidth === '58mm' ? 384 : 576,
      height: 1200,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: true,
      },
    });

    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for fonts

    const image = await window.webContents.capturePage();
    const imageBuffer = image.toPNG();
    window.close();

    console.log('✅ Image created:', imageBuffer.length, 'bytes');

    // Step 3: Send via ESC/POS
    console.log('🖨️  Step 3: Printing via ESC/POS...');

    const device = new USB();
    const printer = new escpos.Printer(device);

    await device.open();
    console.log('✓ Connected to USB printer');

    // Save image temporarily
    tempPath = path.join(os.tmpdir(), `test-receipt-${Date.now()}.png`);
    await fs.writeFile(tempPath, imageBuffer);

    // Load and print image
    const escposImage = await new Promise<any>((resolve, reject) => {
      // @ts-ignore
      escpos.Image.load(tempPath, (img: any) => {
        if (img) resolve(img);
        else reject(new Error('Failed to load image'));
      });
    });

    printer.align('ct');
    printer.image(escposImage, 's24');
    printer.feed(3);
    if (config.cutPaper) printer.cut();

    await new Promise<void>((resolve) => {
      // @ts-ignore
      printer.close(() => resolve());
    });

    // Cleanup
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('✅ Method 2 completed successfully!');
    console.log('═════════════════════════════════════════════');

    return {
      success: true,
      message: `Image → ESC/POS completed (${(duration / 1000).toFixed(1)}s)`,
    };

  } catch (error: any) {
    console.error('❌ Method 2 failed:', error);
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }
    return {
      success: false,
      error: error.message || 'Method 2 failed',
    };
  }
}

/**
 * METHOD 3: Pure ESC/POS Text
 * Plain text receipt using ESC/POS commands only
 * No HTML, no images - just text
 */
export async function testMethod3_PureESCPOS(config: PrinterConfig): Promise<PrintResult> {
  const startTime = Date.now();

  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║    TEST METHOD 3: Pure ESC/POS Text      ║');
    console.log('╚═══════════════════════════════════════════╝');

    const device = new USB();
    const printer = new escpos.Printer(device, {
      encoding: 'windows-1256',
      width: config.paperWidth === '58mm' ? 32 : 48,
    });

    await device.open();
    console.log('✓ Connected to USB printer');

    // Header
    printer
      .font('a')
      .align('ct')
      .size(2, 2)
      .style('bu')
      .text(TEST_RECEIPT_DATA.companyName)
      .size(1, 1)
      .style('normal');

    printer.feed(1);
    printer.text(TEST_RECEIPT_DATA.companyAddress || '');
    printer.text(`Tel: ${TEST_RECEIPT_DATA.companyPhone}`);
    printer.text(`Tax ID: ${TEST_RECEIPT_DATA.companyTaxId}`);

    printer.feed(1);
    printer.drawLine();

    // Order info
    printer.align('lt');
    printer.text(`Order #${TEST_RECEIPT_DATA.orderId}`);
    printer.text(`Date: ${new Date(TEST_RECEIPT_DATA.orderDate).toLocaleString()}`);
    printer.text(`Cashier: ${TEST_RECEIPT_DATA.cashierName}`);
    printer.drawLine();

    // Items
    const colWidth = config.paperWidth === '58mm' ? 32 : 48;
    const header = 'Item'.padEnd(Math.floor(colWidth * 0.5)) +
                   'Qty'.padStart(Math.floor(colWidth * 0.15)) +
                   'Price'.padStart(Math.floor(colWidth * 0.35));
    printer.text(header);
    printer.text('-'.repeat(colWidth));

    TEST_RECEIPT_DATA.items.forEach(item => {
      const itemLine = item.name.substring(0, Math.floor(colWidth * 0.5)).padEnd(Math.floor(colWidth * 0.5)) +
                       item.quantity.toString().padStart(Math.floor(colWidth * 0.15)) +
                       item.totalPrice.toFixed(2).padStart(Math.floor(colWidth * 0.35));
      printer.text(itemLine);
      printer.text(`  ${item.quantity} x ${item.unitPrice.toFixed(2)}`);
    });

    printer.text('-'.repeat(colWidth));

    // Totals
    printer.align('rt');
    printer.text(`Subtotal: ${TEST_RECEIPT_DATA.subtotal.toFixed(2)}`);
    printer.text(`Tax (${TEST_RECEIPT_DATA.taxRate}%): ${TEST_RECEIPT_DATA.taxAmount.toFixed(2)}`);
    printer.text('='.repeat(colWidth));

    printer
      .size(2, 2)
      .style('b')
      .text(`TOTAL: ${TEST_RECEIPT_DATA.total.toFixed(2)}`)
      .size(1, 1)
      .style('normal');

    printer.text('='.repeat(colWidth));
    printer.text(`Paid: ${TEST_RECEIPT_DATA.paid.toFixed(2)}`);
    printer.text(`Change: ${TEST_RECEIPT_DATA.change.toFixed(2)}`);

    // Footer
    printer.feed(1);
    printer.drawLine();
    printer.align('ct');
    printer.text('TEST PRINT - METHOD 3');
    printer.text('Thank you!');
    printer.feed(3);

    if (config.cutPaper) printer.cut();

    await new Promise<void>((resolve) => {
      // @ts-ignore
      printer.close(() => resolve());
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('✅ Method 3 completed successfully!');
    console.log('═════════════════════════════════════════════');

    return {
      success: true,
      message: `Pure ESC/POS completed (${(duration / 1000).toFixed(1)}s)`,
    };

  } catch (error: any) {
    console.error('❌ Method 3 failed:', error);
    return {
      success: false,
      error: error.message || 'Method 3 failed',
    };
  }
}

/**
 * METHOD 4: Hybrid - ESC/POS with Embedded Bitmap 🌟
 * Best of both worlds:
 * - Header/Logo as image (beautiful)
 * - Items/Totals as text (fast, clear)
 */
export async function testMethod4_HybridESCPOS(config: PrinterConfig): Promise<PrintResult> {
  const startTime = Date.now();
  let tempPath: string | null = null;

  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   TEST METHOD 4: Hybrid ESC/POS + Image  ║');
    console.log('╚═══════════════════════════════════════════╝');

    // Step 1: Generate header as image
    console.log('🖼️  Step 1: Creating header image...');
    const headerHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap" rel="stylesheet">
  <style>
    body {
      width: ${config.paperWidth === '58mm' ? '384px' : '576px'};
      margin: 0;
      padding: 20px;
      font-family: 'Cairo', sans-serif;
      text-align: center;
      background: white;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #000;
      margin-bottom: 10px;
    }
    .test-label {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
      border-top: 2px dashed #000;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="company-name">${TEST_RECEIPT_DATA.companyName}</div>
  <div style="font-size: 12px; margin: 5px 0;">${TEST_RECEIPT_DATA.companyAddress}</div>
  <div style="font-size: 12px;">Tel: ${TEST_RECEIPT_DATA.companyPhone}</div>
  <div class="test-label">TEST METHOD 4 - HYBRID</div>
</body>
</html>`;

    const window = new BrowserWindow({
      show: false,
      width: config.paperWidth === '58mm' ? 384 : 576,
      height: 300,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(headerHTML)}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const headerImage = await window.webContents.capturePage();
    const headerBuffer = headerImage.toPNG();
    window.close();

    // Step 2: Connect and print
    console.log('🖨️  Step 2: Printing hybrid receipt...');
    const device = new USB();
    const printer = new escpos.Printer(device, {
      encoding: 'windows-1256',
      width: config.paperWidth === '58mm' ? 32 : 48,
    });

    await device.open();

    // Print header image
    tempPath = path.join(os.tmpdir(), `test-header-${Date.now()}.png`);
    await fs.writeFile(tempPath, headerBuffer);

    const escposImage = await new Promise<any>((resolve, reject) => {
      // @ts-ignore
      escpos.Image.load(tempPath, (img: any) => {
        if (img) resolve(img);
        else reject(new Error('Failed to load image'));
      });
    });

    printer.align('ct').image(escposImage, 's24');

    // Print text content
    printer.align('lt').feed(1);

    const colWidth = config.paperWidth === '58mm' ? 32 : 48;

    // Items
    TEST_RECEIPT_DATA.items.forEach(item => {
      printer.text(item.name);
      printer.text(`  ${item.quantity} x ${item.unitPrice.toFixed(2)} = ${item.totalPrice.toFixed(2)}`);
    });

    printer.drawLine();

    // Totals
    printer.align('rt');
    printer.text(`Subtotal: ${TEST_RECEIPT_DATA.subtotal.toFixed(2)}`);
    printer.text(`Tax: ${TEST_RECEIPT_DATA.taxAmount.toFixed(2)}`);
    printer.size(2, 2).style('b').text(`TOTAL: ${TEST_RECEIPT_DATA.total.toFixed(2)}`);
    printer.size(1, 1).style('normal');

    printer.feed(2).align('ct').text('Thank you!').feed(3);
    if (config.cutPaper) printer.cut();

    await new Promise<void>((resolve) => {
      // @ts-ignore
      printer.close(() => resolve());
    });

    // Cleanup
    if (tempPath) await fs.unlink(tempPath).catch(() => {});

    const duration = Date.now() - startTime;
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('✅ Method 4 completed successfully!');
    console.log('═════════════════════════════════════════════');

    return {
      success: true,
      message: `Hybrid method completed (${(duration / 1000).toFixed(1)}s)`,
    };

  } catch (error: any) {
    console.error('❌ Method 4 failed:', error);
    if (tempPath) await fs.unlink(tempPath).catch(() => {});
    return {
      success: false,
      error: error.message || 'Method 4 failed',
    };
  }
}
