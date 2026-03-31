/**
 * Professional Barcode Renderer using electron-pos-printer
 *
 * This is the CORRECT approach used by commercial POS systems:
 * 1. Generate barcode as base64 image
 * 2. Create HTML document with image
 * 3. electron-pos-printer converts ENTIRE document to raster image
 * 4. Print raster image to thermal printer
 *
 * This solves the empty label issue!
 */

import { PosPrinter } from 'electron-pos-printer';
import JsBarcode from 'jsbarcode';
import { PrinterConfig, LabelData, PrintResult } from './types';
import { PrinterError, PrinterErrorCode } from './errors';
import { selectBestPrinter } from './PrinterDetector';

/**
 * Generate barcode as SVG data URI (no canvas needed!)
 * JsBarcode can generate SVG directly - simpler and more reliable
 */
function generateBarcodeSVG(sku: string, format: string = 'CODE128'): string {
  try {
    const { DOMImplementation, XMLSerializer } = require('@xmldom/xmldom');
    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument(
      'http://www.w3.org/1999/xhtml',
      'html',
      null
    );
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Generate barcode as SVG
    JsBarcode(svgNode, sku, {
      format: format,
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
      xmlDocument: document,
    });

    // Convert SVG to string
    const svgString = xmlSerializer.serializeToString(svgNode);

    // Convert to data URI
    const base64 = Buffer.from(svgString).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;

  } catch (error: any) {
    console.error('Barcode generation error:', error);
    throw new Error(`Failed to generate barcode: ${error.message}`);
  }
}

/**
 * Print barcode label using electron-pos-printer
 * This is the PROFESSIONAL approach that actually works!
 */
export async function printBarcodeProfessional(
  labelData: LabelData,
  config: PrinterConfig
): Promise<PrintResult> {
  try {
    // Auto-detect printer if not specified
    let printerName = config.printerName;

    if (!printerName || printerName.trim() === '') {
      console.log('⚡ Auto-detecting printer...');
      const detectedPrinter = await selectBestPrinter();

      if (!detectedPrinter) {
        throw new PrinterError(
          PrinterErrorCode.INVALID_CONFIG,
          'لم يتم العثور على طابعة. يرجى تثبيت برنامج التشغيل.'
        );
      }

      printerName = detectedPrinter;
      console.log(`✅ Auto-selected: ${printerName}`);
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   PROFESSIONAL BARCODE PRINT             ║');
    console.log('║   (electron-pos-printer Method)          ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('🖨️ Printer:', printerName);
    console.log('📦 Product:', labelData.productName);
    console.log('📋 SKU:', labelData.sku);
    console.log('💰 Price:', labelData.price);
    console.log('═════════════════════════════════════════════');

    // Generate barcode as SVG
    console.log('⏳ Generating barcode...');
    const barcodeDataUri = generateBarcodeSVG(
      labelData.sku,
      labelData.barcodeFormat || 'CODE128'
    );
    console.log('✅ Barcode generated as SVG data URI');

    // Prepare print data for electron-pos-printer
    const printData = [
      // Product name
      {
        type: 'text',
        value: `<div style="text-align: center; font-weight: bold; font-size: ${labelData.labelFontSize || 12}px; margin-bottom: 2mm;">${labelData.productName}</div>`,
        style: 'text-align: center;',
        raw: true,
      },
      // Barcode image
      {
        type: 'image',
        src: barcodeDataUri,
        style: {
          width: '35mm',
          height: 'auto',
        },
        attributes: {
          style: 'display: block; margin: 0 auto;'
        }
      },
      // Price
      {
        type: 'text',
        value: `<div style="text-align: center; font-weight: bold; font-size: 10px; margin-top: 2mm;">${labelData.price.toFixed(2)} ج.م</div>`,
        style: 'text-align: center;',
        raw: true,
      },
    ];

    // Print options
    const options = {
      printerName: printerName,
      silent: true,
      copies: config.printCopies || 1,
      preview: false, // Set to true for debugging
      width: `${labelData.labelWidth || 40}mm`,
      margin: '0 0 0 0',
      timeOutPerLine: 400,
    };

    console.log('🖨️ Printing via electron-pos-printer...');
    console.log('   Copies:', config.printCopies || 1);
    console.log('   Label size:', `${labelData.labelWidth}mm x ${labelData.labelHeight}mm`);

    // Print using electron-pos-printer
    // This library converts the ENTIRE HTML document to a raster image
    // and sends it to the printer - that's why it works!
    await PosPrinter.print(printData, options);

    console.log('✅ Print completed successfully!');
    console.log('═════════════════════════════════════════════');

    return {
      success: true,
      message: `تم طباعة الباركود بنجاح (${config.printCopies || 1} نسخة)`,
    };

  } catch (error: any) {
    console.error('❌ Print error:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    return {
      success: false,
      error: error.message || 'فشلت طباعة الباركود',
    };
  }
}
