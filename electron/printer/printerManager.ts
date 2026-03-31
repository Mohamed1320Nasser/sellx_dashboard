import { PrinterConfig, ReceiptData, LabelData, PrintResult } from './types';
import { PrinterError, PrinterErrorCode, classifyPrinterError } from './errors';
import { printBarcodeSimple } from './SimpleBarcodeRenderer';
import escpos from 'escpos';
// @ts-ignore - escpos-network doesn't have types
import Network from 'escpos-network';
// @ts-ignore - escpos-usb doesn't have types
import USB from 'escpos-usb';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { PosPrinter } from 'electron-pos-printer';
import { selectBestPrinter } from './PrinterDetector';

/**
 * Printer Manager - Handles thermal printer operations using ESC/POS
 *
 * This is a placeholder implementation. The actual ESC/POS printing will be
 * implemented when the escpos libraries are installed:
 * - escpos@3.0.0-alpha.6
 * - escpos-network@3.0.0-alpha.6
 * - escpos-usb@3.0.0-alpha.6
 */
export class PrinterManager {
  private config: PrinterConfig | null = null;

  /**
   * Set printer configuration
   */
  setConfig(config: PrinterConfig): void {
    this.config = config;
    console.log('Printer config set:', config);
  }

  /**
   * Print a receipt
   */
  async printReceipt(receiptData: ReceiptData, config?: PrinterConfig): Promise<PrintResult> {
    const printerConfig = config || this.config;

    if (!printerConfig) {
      return {
        success: false,
        error: 'Printer configuration not set',
      };
    }

    try {
      console.log('');
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║        RECEIPT PRINT REQUEST              ║');
      console.log('╚═══════════════════════════════════════════╝');
      console.log('📅 Time:', new Date().toISOString());
      console.log('🖨️ Printer:', printerConfig.printerName || 'Default');
      console.log('🔌 Connection:', printerConfig.connectionType);

      if (printerConfig.connectionType === 'LAN') {
        console.log('📡 IP Address:', printerConfig.ipAddress);
        console.log('🔧 Port:', printerConfig.port);
      } else {
        console.log('🔌 USB Mode - Driver required on Windows');
      }

      console.log('📋 Receipt Details:');
      console.log('   Receipt ID:', receiptData.id);
      console.log('   Paper Width:', printerConfig.paperWidth);
      console.log('   Items Count:', receiptData.items?.length || 0);
      console.log('   Total Amount:', receiptData.total);
      console.log('   Print Copies:', printerConfig.printCopies || 1);
      console.log('═════════════════════════════════════════════');

      // Create device based on connection type
      let device: any;
      if (printerConfig.connectionType === 'LAN') {
        if (!printerConfig.ipAddress || !printerConfig.port) {
          throw new PrinterError(
            PrinterErrorCode.INVALID_CONFIG,
            'IP address and port required for network printer'
          );
        }
        device = new Network(printerConfig.ipAddress, printerConfig.port);
        console.log(`Connecting to network printer: ${printerConfig.ipAddress}:${printerConfig.port}`);
      } else {
        try {
          device = new USB();
          console.log('Connecting to USB printer');

          // On Windows, check if USB device is accessible
          if (process.platform === 'win32') {
            console.log('💡 Note: USB printing on Windows requires proper driver installation');
          }
        } catch (usbError: any) {
          console.error('USB initialization error:', usbError);
          throw new PrinterError(
            PrinterErrorCode.USB_NOT_FOUND,
            process.platform === 'win32'
              ? 'USB printer not found. Please install driver or use LAN connection.'
              : 'USB printer not found. Please check connection or use LAN.',
            usbError
          );
        }
      }

      const printer = new escpos.Printer(device, {
        encoding: printerConfig.characterSet || 'windows-1256',
        width: printerConfig.paperWidth === '58mm' ? 32 : 48,
      });

      // Open connection with timeout
      await Promise.race([
        device.open(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        ),
      ]);

      console.log('✓ Connected to printer');

      // Initialize printer
      printer
        .font('a')
        .align('ct')
        .style('normal');

      // Add top margin
      printer.feed(printerConfig.marginTop || 2);

      // ===== HEADER =====
      // Company Name (large, centered)
      if (receiptData.company?.name) {
        printer
          .size(2, 2)
          .style('bu')
          .text(receiptData.company.name)
          .size(1, 1)
          .style('normal');
      }

      printer.feed(1);

      // Company Info (centered, normal size)
      if (receiptData.company?.address) {
        printer.text(receiptData.company.address);
      }
      if (receiptData.company?.phone) {
        printer.text(`Tel: ${receiptData.company.phone}`);
      }
      if (receiptData.company?.taxNumber) {
        printer.text(`Tax ID: ${receiptData.company.taxNumber}`);
      }

      // Custom Header Text
      if (printerConfig.headerText) {
        printer.feed(1);
        printer.text(printerConfig.headerText);
      }

      printer.feed(1);
      printer.drawLine();

      // ===== ORDER INFO =====
      printer.align('lt');

      if (printerConfig.showOrderId) {
        printer.text(`Order #${receiptData.id}`);
      }

      const date = new Date(receiptData.createdAt);
      printer.text(`Date: ${date.toLocaleDateString('ar-EG')} ${date.toLocaleTimeString('ar-EG')}`);

      if (receiptData.cashier?.name) {
        printer.text(`Cashier: ${receiptData.cashier.name}`);
      }

      printer.drawLine();

      // ===== ITEMS TABLE =====
      printer.align('lt');

      // Table header
      const colWidth = printerConfig.paperWidth === '58mm' ? 32 : 48;
      const nameWidth = Math.floor(colWidth * 0.5);
      const qtyWidth = Math.floor(colWidth * 0.15);
      const priceWidth = Math.floor(colWidth * 0.35);

      const header =
        'Item'.padEnd(nameWidth) +
        'Qty'.padStart(qtyWidth) +
        'Price'.padStart(priceWidth);
      printer.text(header);
      printer.text('-'.repeat(colWidth));

      // Items
      receiptData.items.forEach((item) => {
        const itemTotal = item.totalPrice || (item.quantity * item.unitPrice);

        // Product name (may wrap to multiple lines)
        const productName = item.productName.length > nameWidth
          ? item.productName.substring(0, nameWidth - 2) + '..'
          : item.productName;

        const itemLine =
          productName.padEnd(nameWidth) +
          item.quantity.toString().padStart(qtyWidth) +
          itemTotal.toFixed(2).padStart(priceWidth);

        printer.text(itemLine);

        // Show unit price on second line
        printer.text(`  ${item.quantity} x ${item.unitPrice.toFixed(2)}`);
      });

      printer.text('-'.repeat(colWidth));

      // ===== TOTALS =====
      printer.align('rt');

      // Subtotal
      printer.text(`Subtotal: ${receiptData.subtotal.toFixed(2)}`);

      // Discount
      if (receiptData.discountAmount && receiptData.discountAmount > 0) {
        printer.text(`Discount: -${receiptData.discountAmount.toFixed(2)}`);
      }

      // Tax
      if (printerConfig.showTaxBreakdown && receiptData.taxAmount) {
        const taxRate = receiptData.taxRate || 0;
        printer.text(`Tax (${taxRate}%): ${receiptData.taxAmount.toFixed(2)}`);
      }

      printer.text('='.repeat(colWidth));

      // Grand Total (large, bold)
      printer
        .size(2, 2)
        .style('b')
        .text(`TOTAL: ${receiptData.total.toFixed(2)}`)
        .size(1, 1)
        .style('normal');

      printer.text('='.repeat(colWidth));

      // Payment info
      if (receiptData.paidAmount && receiptData.paidAmount > 0) {
        printer.text(`Paid: ${receiptData.paidAmount.toFixed(2)}`);
        const change = receiptData.paidAmount - receiptData.total;
        if (change > 0) {
          printer.text(`Change: ${change.toFixed(2)}`);
        }
      }

      printer.feed(1);
      printer.drawLine();

      // ===== FOOTER =====
      printer.align('ct');

      if (printerConfig.footerText) {
        printer.feed(1);
        printer
          .size(1, 1)
          .text(printerConfig.footerText);
      }

      printer.feed(1);
      printer.text('Thank you!');

      // Feed and cut
      printer.feed(printerConfig.marginBottom || 3);

      if (printerConfig.cutPaper) {
        printer.cut();
      }

      // Close connection
      await printer.close();

      console.log('✓ Receipt printed successfully');
      return {
        success: true,
        message: 'Receipt printed successfully',
      };

    } catch (error: any) {
      console.error('❌ Print error:', error);

      const printerError = classifyPrinterError(error);

      return {
        success: false,
        error: printerError.toUserMessage('ar'),
      };
    }
  }

  /**
   * Print an image (PNG/JPEG) to the thermal printer
   * LAN: Uses ESC/POS
   * USB (Windows): Uses Windows Spooler (electron-pos-printer)
   */
  async printImage(imageBuffer: Buffer, config?: PrinterConfig): Promise<PrintResult> {
    const printerConfig = config || this.config;

    if (!printerConfig) {
      return {
        success: false,
        error: 'Printer configuration not set',
      };
    }

    let tempPath: string | null = null;

    try {
      console.log('=== PRINT IMAGE ===');
      console.log('Printer:', printerConfig.printerName || 'Auto-detect');
      console.log('Connection:', printerConfig.connectionType);
      console.log('Platform:', process.platform);
      console.log('Image size:', imageBuffer.length, 'bytes');

      // *** WINDOWS USB: Use Spooler (electron-pos-printer) ***
      if (printerConfig.connectionType === 'USB' && process.platform === 'win32') {
        console.log('✨ Windows USB detected → Using Windows Spooler (electron-pos-printer)');

        // Auto-detect printer if not specified
        let printerName = printerConfig.printerName;
        if (!printerName || printerName.trim() === '') {
          console.log('⚡ No printer name specified, auto-detecting...');
          const detectedPrinter = await selectBestPrinter();
          if (!detectedPrinter) {
            throw new PrinterError(
              PrinterErrorCode.INVALID_CONFIG,
              'No printers found on system. Please install printer driver.'
            );
          }
          printerName = detectedPrinter;
          console.log(`✅ Auto-selected printer: ${printerName}`);
        }

        // Save image to temp file
        tempPath = path.join(os.tmpdir(), `receipt-${Date.now()}.png`);
        await fs.writeFile(tempPath, imageBuffer);
        console.log('✓ Image saved to temp file:', tempPath);

        // Print using electron-pos-printer
        const printOptions: any = {
          printerName: printerName,
          silent: true,
          copies: printerConfig.printCopies || 1,
          preview: false,
          width: printerConfig.paperWidth === '58mm' ? '58mm' : '80mm',
          margin: '0 0 0 0',
          timeOutPerLine: 400,
        };

        console.log('🖨️ Printing via Windows Spooler...', printOptions);

        try {
          await PosPrinter.print([{
            type: 'image',
            path: tempPath,
            position: 'center',
            width: printerConfig.paperWidth === '58mm' ? '58mm' : '80mm',
          }], printOptions);

          console.log('✅ Receipt printed via Windows Spooler');
        } catch (posPrinterError: any) {
          console.error('❌ electron-pos-printer ERROR:', posPrinterError);
          console.error('Error message:', posPrinterError.message);
          console.error('Error stack:', posPrinterError.stack);

          // Clean up temp file
          await fs.unlink(tempPath).catch(err => console.warn('Failed to delete temp file:', err));
          tempPath = null;

          throw new PrinterError(
            PrinterErrorCode.UNKNOWN,
            `Windows Spooler error: ${posPrinterError.message || 'Unknown error'}`,
            posPrinterError
          );
        }

        // Clean up temp file
        await fs.unlink(tempPath).catch(err => console.warn('Failed to delete temp file:', err));
        tempPath = null;

        return {
          success: true,
          message: 'Receipt printed successfully',
        };
      }

      // *** LAN or non-Windows: Use ESC/POS ***
      let device: any;
      if (printerConfig.connectionType === 'LAN') {
        if (!printerConfig.ipAddress || !printerConfig.port) {
          throw new PrinterError(
            PrinterErrorCode.INVALID_CONFIG,
            'IP address and port required for network printer'
          );
        }
        device = new Network(printerConfig.ipAddress, printerConfig.port);
        console.log(`Connecting to network printer: ${printerConfig.ipAddress}:${printerConfig.port}`);
      } else {
        // USB on macOS/Linux - Try raw USB access
        try {
          device = new USB();
          console.log('Connecting to USB printer via raw USB (macOS/Linux)...');
        } catch (usbError: any) {
          console.error('USB initialization error:', usbError);
          throw new PrinterError(
            PrinterErrorCode.USB_NOT_FOUND,
            'USB printer not found. On macOS/Linux, you may need to install libusb: brew install libusb',
            usbError
          );
        }
      }

      const printer = new escpos.Printer(device);

      // Open connection with timeout
      await Promise.race([
        device.open(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        ),
      ]);

      console.log('✓ Connected to printer');

      // Save image buffer to temporary file
      // escpos.Image.load() expects a file path, not a Buffer
      tempPath = path.join(os.tmpdir(), `receipt-${Date.now()}.png`);
      console.log('Saving image to temp file:', tempPath);
      await fs.writeFile(tempPath, imageBuffer);

      // Load image from temp file using callback (escpos.Image.load is callback-based)
      const image = await new Promise<any>((resolve, reject) => {
        // @ts-ignore - escpos.Image.load actually accepts a callback as second parameter
        escpos.Image.load(tempPath, (loadedImage: any) => {
          if (loadedImage) {
            resolve(loadedImage);
          } else {
            reject(new Error('Failed to load image'));
          }
        });
      });
      console.log('✓ Image loaded successfully');

      // Print image
      printer.align('ct');
      printer.image(image, 's24');  // 24-dot density for better quality
      printer.feed(printerConfig.marginBottom || 3);

      // Cut paper if enabled
      if (printerConfig.cutPaper) {
        printer.cut();
      }

      // Close connection
      await new Promise<void>((resolve, reject) => {
        // @ts-ignore - printer.close actually accepts a callback
        printer.close(() => {
          resolve();
        });
      });

      console.log('✓ Image printed successfully');

      // Clean up temporary file
      if (tempPath) {
        await fs.unlink(tempPath).catch(err => console.warn('Failed to delete temp file:', err));
      }

      return {
        success: true,
        message: 'Image printed successfully',
      };

    } catch (error: any) {
      console.error('❌ Print image error:', error);

      // Clean up temporary file on error
      if (tempPath) {
        await fs.unlink(tempPath).catch(err => console.warn('Failed to delete temp file:', err));
      }

      const printerError = classifyPrinterError(error);

      return {
        success: false,
        error: printerError.toUserMessage('ar'),
      };
    }
  }

  /**
   * Print a barcode label
   */
  async printLabel(labelData: LabelData, config?: PrinterConfig): Promise<PrintResult> {
    const printerConfig = config || this.config;

    if (!printerConfig) {
      return {
        success: false,
        error: 'Printer configuration not set',
      };
    }

    try {
      // Get number of copies to print
      const printCopies = printerConfig.printCopies || 1;

      console.log('');
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║     BARCODE LABEL PRINT REQUEST          ║');
      console.log('╚═══════════════════════════════════════════╝');
      console.log('📅 Time:', new Date().toISOString());
      console.log('🖨️ Printer:', printerConfig.printerName || 'Default');
      console.log('🔌 Connection:', printerConfig.connectionType);

      if (printerConfig.connectionType === 'LAN') {
        console.log('📡 IP Address:', printerConfig.ipAddress);
        console.log('🔧 Port:', printerConfig.port);
      } else {
        console.log('🔌 USB Mode - Checking for Windows printer name...');
        console.log('🖨️ Printer Name:', printerConfig.printerName);
      }

      console.log('📋 Label Details:');
      console.log('   Product:', labelData.productName);
      console.log('   SKU:', labelData.sku);
      console.log('   Price:', labelData.price);
      console.log('   Barcode Format:', labelData.barcodeFormat || printerConfig.barcodeFormat || 'CODE128');
      console.log('   Copies to print:', printCopies);
      console.log('═════════════════════════════════════════════');

      // *** USB Mode = Use SIMPLE Electron Native Printing ***
      // Uses Electron's built-in print API - works with ALL printers
      if (printerConfig.connectionType === 'USB') {
        console.log('');
        console.log('✨ USB mode - Using simple Electron print');
        console.log('');
        return printBarcodeSimple(labelData, printerConfig);
      }

      // *** ONLY LAN MODE REACHES HERE (USB returned early) ***
      // Create network device for LAN connection
      if (!printerConfig.ipAddress || !printerConfig.port) {
        throw new PrinterError(
          PrinterErrorCode.INVALID_CONFIG,
          'IP address and port required for network printer'
        );
      }

      const device = new Network(printerConfig.ipAddress, printerConfig.port);
      console.log(`Connecting to network printer: ${printerConfig.ipAddress}:${printerConfig.port}`);

      const printer = new escpos.Printer(device, {
        encoding: printerConfig.characterSet || 'windows-1256',
        width: printerConfig.paperWidth === '58mm' ? 32 : 48,
      });

      // Open connection with timeout
      console.log('');
      console.log('📋 Step 3: Opening device connection...');
      console.log('   Connection Type:', printerConfig.connectionType);
      console.log('   Timeout: 10 seconds');

      try {
        const startTime = Date.now();
        await Promise.race([
          device.open(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
          ),
        ]);
        const connectionTime = Date.now() - startTime;

        console.log('✅ Step 3: Connected to printer successfully!');
        console.log('   Connection time:', connectionTime, 'ms');
        console.log('');

      } catch (connectionError: any) {
        console.log('');
        console.log('❌ Step 3: LAN DEVICE CONNECTION FAILED');
        console.log('=====================================');
        console.error('Error Type:', connectionError.name || 'Unknown');
        console.error('Error Message:', connectionError.message || 'No message');
        console.error('Error Code:', connectionError.code || 'No code');

        console.log('');
        console.log('🔧 LAN CONNECTION TROUBLESHOOTING:');
        console.log('1. Check printer is ON');
        console.log('2. Check network cable is connected');
        console.log('3. Verify IP address and port are correct');
        console.log('4. Try to ping the printer IP address');
        console.log('5. Check firewall settings');
        console.log('6. Ensure printer is on the same network');

        console.log('=====================================');
        throw connectionError;
      }

      // Initialize printer
      printer
        .font('a')
        .align('ct')
        .style('normal');

      // Add top margin
      printer.feed(1);

      // Product name (centered, compact)
      if (labelData.productName) {
        const maxNameLength = printerConfig.paperWidth === '58mm' ? 20 : 30;
        const productName = labelData.productName.length > maxNameLength
          ? labelData.productName.substring(0, maxNameLength - 2) + '..'
          : labelData.productName;

        printer
          .size(1, 1)
          .style('b')
          .text(productName)
          .style('normal');
      }

      printer.feed(1);

      // Map barcode format to ESC/POS barcode type
      // ESC/POS uses numeric codes for barcode types
      let barcodeType: string;
      switch (labelData.barcodeFormat) {
        case 'EAN13':
          barcodeType = 'EAN13';
          break;
        case 'EAN8':
          barcodeType = 'EAN8';
          break;
        case 'CODE39':
          barcodeType = 'CODE39';
          break;
        case 'CODE128':
        default:
          barcodeType = 'CODE128';
          break;
      }

      // Print barcode using ESC/POS barcode command
      // Format: GS k m d1...dk (where m is barcode type)
      try {
        printer.barcode(labelData.sku, barcodeType, {
          width: labelData.barcodeWidth || 2,
          height: labelData.barcodeHeight || 60,
          hri: true, // Human Readable Interpretation
        });
      } catch (barcodeError) {
        console.warn('Native barcode failed, using text fallback:', barcodeError);
        // Fallback: print SKU as text if barcode fails
        printer
          .size(1, 1)
          .text(`SKU: ${labelData.sku}`);
      }

      printer.feed(1);

      // Price (centered, bold)
      printer
        .size(1, 1)
        .style('b')
        .text(`Price: ${labelData.price.toFixed(2)}`)
        .style('normal');

      // Feed and cut
      printer.feed(2);

      if (printerConfig.cutPaper) {
        printer.cut();
      } else {
        printer.feed(2);
      }

      // Close connection
      await new Promise<void>((resolve) => {
        // @ts-ignore - printer.close actually accepts a callback
        printer.close(() => {
          resolve();
        });
      });

      // Print additional copies if needed
      if (printCopies > 1) {
        console.log(`📄 Printing ${printCopies} copies of the label...`);

        for (let i = 1; i < printCopies; i++) {
          console.log(`📄 Printing copy ${i + 1} of ${printCopies}...`);

          // Reconnect for each copy
          await Promise.race([
            device.open(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
            ),
          ]);

          const printerCopy = new escpos.Printer(device, {
            encoding: printerConfig.characterSet || 'windows-1256',
            width: printerConfig.paperWidth === '58mm' ? 32 : 48,
          });

          // Print the label again
          printerCopy
            .font('a')
            .align('ct')
            .style('normal');

          printerCopy.feed(1);

          if (labelData.productName) {
            const maxNameLength = printerConfig.paperWidth === '58mm' ? 20 : 30;
            const productName = labelData.productName.length > maxNameLength
              ? labelData.productName.substring(0, maxNameLength - 2) + '..'
              : labelData.productName;

            printerCopy
              .size(1, 1)
              .style('b')
              .text(productName)
              .style('normal');
          }

          printerCopy.feed(1);

          try {
            printerCopy.barcode(labelData.sku, barcodeType, {
              width: labelData.barcodeWidth || 2,
              height: labelData.barcodeHeight || 60,
              hri: true,
            });
          } catch (barcodeError) {
            console.warn('Native barcode failed for copy, using text fallback:', barcodeError);
            printerCopy
              .size(1, 1)
              .text(`SKU: ${labelData.sku}`);
          }

          printerCopy.feed(1);

          printerCopy
            .size(1, 1)
            .style('b')
            .text(`Price: ${labelData.price.toFixed(2)}`)
            .style('normal');

          printerCopy.feed(2);

          if (printerConfig.cutPaper) {
            printerCopy.cut();
          } else {
            printerCopy.feed(2);
          }

          await new Promise<void>((resolve) => {
            // @ts-ignore - printer.close actually accepts a callback
            printerCopy.close(() => {
              resolve();
            });
          });
        }
      }

      console.log(`✓ Label printed successfully (${printCopies} ${printCopies === 1 ? 'copy' : 'copies'})`);
      return {
        success: true,
        message: `Label printed successfully (${printCopies} ${printCopies === 1 ? 'copy' : 'copies'})`,
      };

    } catch (error: any) {
      console.error('❌ Print label error:', error);

      const printerError = classifyPrinterError(error);

      return {
        success: false,
        error: printerError.toUserMessage('ar'),
      };
    }
  }

  /**
   * Test print - prints a simple test receipt
   */
  async testPrint(config?: PrinterConfig): Promise<PrintResult> {
    const printerConfig = config || this.config;

    if (!printerConfig) {
      return {
        success: false,
        error: 'Printer configuration not set',
      };
    }

    const testReceipt: ReceiptData = {
      id: 'TEST-001',
      receiptNumber: 'TEST-001',
      createdAt: new Date(),
      subtotal: 100,
      taxRate: 15,
      taxAmount: 15,
      total: 115,
      paidAmount: 120,
      items: [
        {
          productName: 'Test Product 1',
          quantity: 2,
          unitPrice: 30,
          totalPrice: 60,
        },
        {
          productName: 'Test Product 2',
          quantity: 1,
          unitPrice: 40,
          totalPrice: 40,
        },
      ],
      company: {
        name: 'Test Store',
        address: 'Test Address',
        phone: '1234567890',
      },
      cashier: {
        name: 'Test Cashier',
      },
    };

    return this.printReceipt(testReceipt, printerConfig);
  }

  /**
   * Get available printers (for discovery)
   */
  async getAvailablePrinters(): Promise<string[]> {
    console.log('Scanning for printers...');
    const printers: string[] = [];

    try {
      // Scan for USB printers using the USB adapter's static method
      // The escpos-usb library doesn't expose findPrinter, so we'll just
      // indicate if USB is available and let users test the connection
      printers.push('USB Printer (Auto-detect)');
      console.log('USB printer interface available');
    } catch (error) {
      console.error('Error checking USB printer support:', error);
    }

    // Note: Network printers cannot be auto-discovered easily
    // They must be manually configured with IP and port
    // We can add them from saved configurations if needed

    if (printers.length === 0) {
      console.log('No printers discovered. Please configure manually.');
    }

    return printers;
  }

  /**
   * Check printer status
   */
  async checkStatus(config?: PrinterConfig): Promise<PrintResult> {
    const printerConfig = config || this.config;

    if (!printerConfig) {
      return {
        success: false,
        error: 'Printer configuration not set',
      };
    }

    try {
      console.log('Checking printer status...');

      // Create device based on connection type
      let device: any;
      if (printerConfig.connectionType === 'LAN') {
        if (!printerConfig.ipAddress || !printerConfig.port) {
          throw new PrinterError(
            PrinterErrorCode.INVALID_CONFIG,
            'IP address and port required for network printer'
          );
        }
        device = new Network(printerConfig.ipAddress, printerConfig.port);
        console.log(`Testing connection to: ${printerConfig.ipAddress}:${printerConfig.port}`);
      } else {
        device = new USB();
        console.log('Testing USB printer connection');
      }

      // Try to open and close connection (timeout after 5 seconds)
      await Promise.race([
        device.open(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout - printer may be offline')), 5000)
        )
      ]);

      console.log('✓ Printer connected');

      // Close connection immediately
      await device.close();

      console.log('✓ Printer is online and ready');

      return {
        success: true,
        message: 'Printer is online and ready',
      };
    } catch (error: any) {
      console.error('❌ Printer status check failed:', error);

      const printerError = classifyPrinterError(error);

      return {
        success: false,
        error: printerError.toUserMessage('ar'),
      };
    }
  }
}

// Export singleton instance
export const printerManager = new PrinterManager();
