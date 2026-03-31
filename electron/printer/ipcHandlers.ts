import { ipcMain } from 'electron';
import { printerManager } from './printerManager';
import { PrinterConfig, ReceiptData, LabelData, PrintResult } from './types';
import {
  testNetworkPrinter,
  testUSBPrinter,
  sendNetworkTestPrint,
  sendUSBTestPrint,
  discoverUSBPrinters,
  runComprehensiveTest,
} from './printerTest';
import {
  getSystemPrinters,
  getDefaultPrinter,
  findThermalPrinters,
  selectBestPrinter,
} from './PrinterDetector';

/**
 * Register all printer-related IPC handlers
 */
export function registerPrinterHandlers() {
  /**
   * Set printer configuration
   */
  ipcMain.handle('printer:setConfig', async (_event, config: PrinterConfig) => {
    try {
      printerManager.setConfig(config);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  /**
   * Print receipt
   */
  ipcMain.handle(
    'printer:printReceipt',
    async (_event, receiptData: ReceiptData, config?: PrinterConfig): Promise<PrintResult> => {
      return printerManager.printReceipt(receiptData, config);
    }
  );

  /**
   * Print label
   */
  ipcMain.handle(
    'printer:printLabel',
    async (_event, labelData: LabelData, config?: PrinterConfig): Promise<PrintResult> => {
      console.log('');
      console.log('📨 IPC: printer:printLabel received');
      console.log('Label Data:', labelData);
      console.log('Config provided?', config ? 'Yes' : 'No');

      if (config) {
        console.log('Config details:', {
          printerName: config.printerName,
          connectionType: config.connectionType,
          ipAddress: config.ipAddress,
          port: config.port,
        });
      } else {
        console.log('⚠️ No config provided to IPC handler!');
      }

      const result = await printerManager.printLabel(labelData, config);
      console.log('IPC Result:', result);
      return result;
    }
  );

  /**
   * Test print
   */
  ipcMain.handle('printer:testPrint', async (_event, config?: PrinterConfig): Promise<PrintResult> => {
    return printerManager.testPrint(config);
  });

  /**
   * Get available printers (OLD - returns basic list)
   */
  ipcMain.handle('printer:getAvailablePrinters', async (): Promise<string[]> => {
    return printerManager.getAvailablePrinters();
  });

  /**
   * Get system printers (NEW - returns detailed info)
   */
  ipcMain.handle('printer:getSystemPrinters', async () => {
    return getSystemPrinters();
  });

  /**
   * Get default printer
   */
  ipcMain.handle('printer:getDefaultPrinter', async () => {
    return getDefaultPrinter();
  });

  /**
   * Find thermal printers
   */
  ipcMain.handle('printer:findThermalPrinters', async () => {
    return findThermalPrinters();
  });

  /**
   * Auto-select best printer
   */
  ipcMain.handle('printer:selectBestPrinter', async (_event, savedPrinterName?: string) => {
    return selectBestPrinter(savedPrinterName);
  });

  /**
   * Check printer status
   */
  ipcMain.handle('printer:checkStatus', async (_event, config?: PrinterConfig): Promise<PrintResult> => {
    return printerManager.checkStatus(config);
  });

  /**
   * Test network printer connection
   */
  ipcMain.handle('printer:testNetworkConnection', async (_event, ip: string, port: number) => {
    return testNetworkPrinter(ip, port);
  });

  /**
   * Test USB printer connection
   */
  ipcMain.handle('printer:testUSBConnection', async () => {
    return testUSBPrinter();
  });

  /**
   * Send network test print
   */
  ipcMain.handle('printer:sendNetworkTestPrint', async (_event, ip: string, port: number, paperWidth: '58mm' | '80mm') => {
    return sendNetworkTestPrint(ip, port, paperWidth);
  });

  /**
   * Send USB test print
   */
  ipcMain.handle('printer:sendUSBTestPrint', async (_event, paperWidth: '58mm' | '80mm') => {
    return sendUSBTestPrint(paperWidth);
  });

  /**
   * Discover USB printers
   */
  ipcMain.handle('printer:discoverUSB', async () => {
    return discoverUSBPrinters();
  });

  /**
   * Run comprehensive printer test
   */
  ipcMain.handle('printer:runComprehensiveTest', async (_event, connectionType: 'LAN' | 'USB', ip?: string, port?: number, paperWidth?: '58mm' | '80mm') => {
    return runComprehensiveTest(connectionType, ip, port, paperWidth);
  });

  /**
   * Print image (PNG/JPEG buffer)
   */
  ipcMain.handle(
    'printer:printImage',
    async (_event, imageBuffer: Buffer, config?: PrinterConfig): Promise<PrintResult> => {
      return printerManager.printImage(imageBuffer, config);
    }
  );

  console.log('Printer IPC handlers registered');
}
