/**
 * PRINTER STRATEGY PATTERN
 * Professional design pattern for handling different printer types
 *
 * DESIGN PATTERNS USED:
 * - Strategy Pattern: Different printing strategies for USB/LAN
 * - Factory Pattern: Auto-select correct strategy
 * - Template Method: Common interface for all strategies
 */

import { ReceiptPrinterConfig, BarcodePrinterConfig, ConnectionType } from './PrinterConfig';
import { selectBestPrinter } from './PrinterDetector';
import { renderAndPrint } from './UnifiedHTMLRenderer';
import { PrinterError, PrinterErrorCode } from './errors';
import { generateReceiptHTML, generateBarcodeHTML, ReceiptData, LabelData } from './TemplateAdapter';

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Abstract base strategy for all printers
 */
export abstract class PrinterStrategy {
  /**
   * Print method - must be implemented by subclasses
   */
  abstract print(html: string, config: any): Promise<PrintResult>;

  /**
   * Get printer name (with auto-detection if needed)
   */
  protected async getPrinterName(configuredName: string): Promise<string> {
    if (configuredName && configuredName.trim() !== '') {
      console.log(`📌 Using configured printer: ${configuredName}`);
      return configuredName;
    }

    console.log('⚡ No printer name specified, auto-detecting...');
    const detectedPrinter = await selectBestPrinter();

    if (!detectedPrinter) {
      throw new PrinterError(
        PrinterErrorCode.INVALID_CONFIG,
        'No printers found. Please install printer driver.'
      );
    }

    console.log(`✅ Auto-selected printer: ${detectedPrinter}`);
    return detectedPrinter;
  }
}

/**
 * USB Printer Strategy (Windows)
 * Uses HTML rendering + Windows print API
 */
export class USBPrinterStrategy extends PrinterStrategy {
  async print(
    html: string,
    config: ReceiptPrinterConfig | BarcodePrinterConfig
  ): Promise<PrintResult> {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🔌 STRATEGY: USB Printer (Windows HTML Rendering)');
    console.log('═══════════════════════════════════════════');

    try {
      // Get printer name (auto-detect if needed)
      const printerName = await this.getPrinterName(config.printerName);

      // Use unified HTML renderer
      return await renderAndPrint({
        html,
        printerName,
        copies: config.printCopies || 1,
        silent: true,
        waitTime: 1500,
      });
    } catch (error: any) {
      console.error('❌ USB print error:', error);
      return {
        success: false,
        error: error.message || 'USB print failed',
      };
    }
  }
}

/**
 * LAN Printer Strategy (Network)
 * Uses ESC/POS commands over TCP/IP
 *
 * NOTE: For receipts/barcodes with complex formatting,
 * we can convert HTML to image first (done in frontend)
 */
export class LANPrinterStrategy extends PrinterStrategy {
  async print(
    html: string,
    config: ReceiptPrinterConfig | BarcodePrinterConfig
  ): Promise<PrintResult> {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📡 STRATEGY: LAN Printer (ESC/POS Network)');
    console.log('═══════════════════════════════════════════');

    // LAN printing handled by existing printerManager.ts ESC/POS code
    // OR by converting HTML to image first (frontend handles this)

    return {
      success: false,
      error: 'LAN_REQUIRES_ESCPOS_OR_IMAGE',
    };
  }
}

/**
 * Factory: Select correct strategy based on connection type
 */
export class PrinterStrategyFactory {
  static getStrategy(connectionType: ConnectionType): PrinterStrategy {
    switch (connectionType) {
      case ConnectionType.USB:
        console.log('🏭 Factory: Creating USB strategy');
        return new USBPrinterStrategy();

      case ConnectionType.LAN:
        console.log('🏭 Factory: Creating LAN strategy');
        return new LANPrinterStrategy();

      default:
        throw new Error(`Unknown connection type: ${connectionType}`);
    }
  }
}
