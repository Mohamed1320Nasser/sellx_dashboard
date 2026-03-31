/**
 * Printer Test Utility
 * Provides functions to test printer connectivity and send test prints
 */

import escpos from 'escpos';
// @ts-ignore - escpos-network doesn't have types
import Network from 'escpos-network';
// @ts-ignore - escpos-usb doesn't have types
import USB from 'escpos-usb';
import { PrinterError, PrinterErrorCode, classifyPrinterError } from './errors';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  error?: string;
}

/**
 * Test network printer connection
 * @param ip - Printer IP address
 * @param port - Printer port (usually 9100)
 * @param timeoutMs - Connection timeout in milliseconds
 */
export async function testNetworkPrinter(
  ip: string,
  port: number,
  timeoutMs: number = 5000
): Promise<TestConnectionResult> {
  const startTime = Date.now();

  try {
    console.log(`[PrinterTest] Testing connection to ${ip}:${port}...`);

    const device = new Network(ip, port);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between connection and timeout
    await Promise.race([
      device.open(),
      timeoutPromise,
    ]);

    // Successfully connected
    const latencyMs = Date.now() - startTime;

    // Close connection
    await device.close();

    console.log(`[PrinterTest] ✓ Connection successful (${latencyMs}ms)`);

    return {
      success: true,
      message: `Successfully connected to printer at ${ip}:${port}`,
      latencyMs,
    };
  } catch (error: any) {
    console.error('[PrinterTest] ✗ Connection failed:', error);

    const printerError = classifyPrinterError(error);

    return {
      success: false,
      message: printerError.toUserMessage('en'),
      error: printerError.message,
    };
  }
}

/**
 * Test USB printer connection
 */
export async function testUSBPrinter(): Promise<TestConnectionResult> {
  try {
    console.log('[PrinterTest] Testing USB printer connection...');

    const device = new USB();
    await device.open();
    await device.close();

    console.log('[PrinterTest] ✓ USB printer found and connected');

    return {
      success: true,
      message: 'Successfully connected to USB printer',
    };
  } catch (error: any) {
    console.error('[PrinterTest] ✗ USB connection failed:', error);

    const printerError = classifyPrinterError(error);

    return {
      success: false,
      message: printerError.toUserMessage('en'),
      error: printerError.message,
    };
  }
}

/**
 * Send a simple test print to network printer
 * @param ip - Printer IP address
 * @param port - Printer port
 * @param paperWidth - Paper width ('58mm' or '80mm')
 */
export async function sendNetworkTestPrint(
  ip: string,
  port: number,
  paperWidth: '58mm' | '80mm' = '80mm'
): Promise<TestConnectionResult> {
  try {
    console.log(`[PrinterTest] Sending test print to ${ip}:${port}...`);

    const device = new Network(ip, port);
    const printer = new escpos.Printer(device, {
      encoding: 'utf-8',
      width: paperWidth === '58mm' ? 32 : 48,
    });

    await device.open();

    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(2, 2)
      .text('TEST PRINT')
      .size(1, 1)
      .text('')
      .text('SellPoint POS System')
      .text('Printer Connection Test')
      .text('')
      .text(`IP: ${ip}:${port}`)
      .text(`Paper: ${paperWidth}`)
      .text(`Time: ${new Date().toLocaleString()}`)
      .text('')
      .drawLine()
      .text('')
      .text('If you can read this,')
      .text('your printer is working correctly!')
      .text('')
      .feed(3)
      .cut()
      .close();

    console.log('[PrinterTest] ✓ Test print sent successfully');

    return {
      success: true,
      message: 'Test print sent successfully',
    };
  } catch (error: any) {
    console.error('[PrinterTest] ✗ Test print failed:', error);

    const printerError = classifyPrinterError(error);

    return {
      success: false,
      message: printerError.toUserMessage('en'),
      error: printerError.message,
    };
  }
}

/**
 * Send a test print to USB printer
 * @param paperWidth - Paper width ('58mm' or '80mm')
 */
export async function sendUSBTestPrint(
  paperWidth: '58mm' | '80mm' = '80mm'
): Promise<TestConnectionResult> {
  try {
    console.log('[PrinterTest] Sending test print to USB printer...');

    const device = new USB();
    const printer = new escpos.Printer(device, {
      encoding: 'utf-8',
      width: paperWidth === '58mm' ? 32 : 48,
    });

    await device.open();

    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(2, 2)
      .text('TEST PRINT')
      .size(1, 1)
      .text('')
      .text('SellPoint POS System')
      .text('USB Printer Test')
      .text('')
      .text(`Paper: ${paperWidth}`)
      .text(`Time: ${new Date().toLocaleString()}`)
      .text('')
      .drawLine()
      .text('')
      .text('If you can read this,')
      .text('your USB printer is working!')
      .text('')
      .feed(3)
      .cut()
      .close();

    console.log('[PrinterTest] ✓ USB test print sent successfully');

    return {
      success: true,
      message: 'USB test print sent successfully',
    };
  } catch (error: any) {
    console.error('[PrinterTest] ✗ USB test print failed:', error);

    const printerError = classifyPrinterError(error);

    return {
      success: false,
      message: printerError.toUserMessage('en'),
      error: printerError.message,
    };
  }
}

/**
 * Discover available USB printers
 */
export async function discoverUSBPrinters(): Promise<any[]> {
  try {
    console.log('[PrinterTest] Scanning for USB printers...');

    // Note: escpos-usb uses node-usb which can list devices
    const usb = require('usb');
    const devices = usb.getDeviceList();

    // Filter for printer devices (class 7 = Printer)
    const printers = devices.filter((device: any) => {
      try {
        device.open();
        const interfaces = device.interfaces || [];
        const hasPrinterInterface = interfaces.some(
          (iface: any) => iface.descriptor.bInterfaceClass === 7
        );
        device.close();
        return hasPrinterInterface;
      } catch {
        return false;
      }
    });

    console.log(`[PrinterTest] Found ${printers.length} USB printer(s)`);

    return printers.map((printer: any) => ({
      vendorId: printer.deviceDescriptor.idVendor,
      productId: printer.deviceDescriptor.idProduct,
      manufacturer: printer.deviceDescriptor.iManufacturer,
      product: printer.deviceDescriptor.iProduct,
    }));
  } catch (error) {
    console.error('[PrinterTest] Error discovering USB printers:', error);
    return [];
  }
}

/**
 * Comprehensive printer test
 * Tests connection, sends test print, and returns detailed results
 */
export async function runComprehensiveTest(
  connectionType: 'LAN' | 'USB',
  ip?: string,
  port?: number,
  paperWidth: '58mm' | '80mm' = '80mm'
): Promise<{
  connectionTest: TestConnectionResult;
  printTest?: TestConnectionResult;
}> {
  const results: any = {};

  if (connectionType === 'LAN') {
    if (!ip || !port) {
      return {
        connectionTest: {
          success: false,
          message: 'IP and port are required for LAN connection',
          error: 'Invalid parameters',
        },
      };
    }

    // Test connection
    results.connectionTest = await testNetworkPrinter(ip, port);

    // If connection successful, try test print
    if (results.connectionTest.success) {
      results.printTest = await sendNetworkTestPrint(ip, port, paperWidth);
    }
  } else {
    // USB
    results.connectionTest = await testUSBPrinter();

    if (results.connectionTest.success) {
      results.printTest = await sendUSBTestPrint(paperWidth);
    }
  }

  return results;
}
