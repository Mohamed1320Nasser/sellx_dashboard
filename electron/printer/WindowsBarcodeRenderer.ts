/**
 * Windows Barcode Renderer (Professional Image-Based Approach)
 * Generates barcode as image, then prints via Windows printer
 *
 * This is the BEST APPROACH for production POS systems:
 * - No CDN dependency
 * - No timing issues
 * - 100% reliable
 * - Works offline
 */

import { BrowserWindow } from 'electron';
import { PrinterConfig, LabelData, PrintResult } from './types';
import { PrinterError, PrinterErrorCode } from './errors';
import { selectBestPrinter } from './PrinterDetector';
import { generateBarcodeImage } from './BarcodeImageGenerator';

/**
 * Generate barcode label HTML
 * This matches the frontend BarcodePreview component exactly
 */
function generateBarcodeHTML(labelData: LabelData, config: PrinterConfig): string {
  const {
    productName,
    sku,
    price,
    labelWidth = 40,
    labelHeight = 30,
    barcodeHeight = 60,
    barcodeWidth = 2,
    barcodeFormat = 'CODE128',
    labelFontSize = 12,
  } = labelData;

  // Use actual label size (not paper width!)
  // 1.36" x 0.98" = 35mm x 25mm
  const labelWidthMm = `${labelWidth}mm`;
  const labelHeightMm = `${labelHeight}mm`;

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
      size: ${labelWidthMm} ${labelHeightMm};
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: ${labelWidthMm};
      min-height: ${labelHeightMm};
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 2mm;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .product-name {
      font-size: ${labelFontSize}px;
      font-weight: bold;
      margin-bottom: 1mm;
      word-wrap: break-word;
      max-width: 100%;
      line-height: 1.2;
    }

    .barcode-container {
      margin: 1mm 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    #barcode {
      max-width: 95%;
      height: auto;
    }

    .price {
      font-size: 9px;
      font-weight: bold;
      margin-top: 1mm;
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

  <div class="price">${price.toFixed(2)}</div>

  <script>
    // Execute immediately when script loads (not waiting for window.load)
    // Wait for JsBarcode to be loaded from CDN
    (function waitForJsBarcode() {
      if (typeof JsBarcode === 'undefined') {
        console.log('Waiting for JsBarcode to load...');
        setTimeout(waitForJsBarcode, 100);
        return;
      }

      try {
        console.log('JsBarcode loaded! Generating barcode for SKU: ${sku}');

        // Use optimal settings for thermal printers (XP-Q361U)
        // Pure black/white for high contrast on thermal heads
        JsBarcode("#barcode", "${sku}", {
          format: "${barcodeFormat}",
          width: 2,              // Thickness of bars (2 is best for 80mm thermal)
          height: 60,            // Height in pixels
          displayValue: true,    // Show the numbers/text below
          fontSize: 14,          // Readable font size
          margin: 10,            // Margin around barcode
          background: "#fff",    // Pure white background
          lineColor: "#000"      // Pure black bars (critical for thermal)
        });

        console.log('✅ Barcode generated successfully');
        console.log('Barcode SVG innerHTML:', document.querySelector('#barcode')?.innerHTML?.substring(0, 200));
      } catch (error) {
        console.error('❌ Barcode generation error:', error);
        document.body.innerHTML = '<div style="padding: 5mm; color: red; font-size: 8px;">Error: ' + error.message + '<br>SKU: ${sku}<br>Format: ${barcodeFormat}</div>';
      }
    })();
  </script>
</body>
</html>
  `.trim();
}

/**
 * Print barcode label using Windows printer (PROFESSIONAL IMAGE-BASED METHOD)
 *
 * BEST PRACTICE APPROACH:
 * 1. Generate barcode as PNG image (no CDN, no timing issues)
 * 2. Print image directly to Windows printer
 * 3. 100% reliable, works offline
 */
export async function printBarcodeViaWindows(
  labelData: LabelData,
  config: PrinterConfig
): Promise<PrintResult> {
  try {
    // *** STEP 1: SMART PRINTER SELECTION ***
    let printerName = config.printerName;

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
    } else {
      console.log(`📌 Using configured printer: ${printerName}`);
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   PROFESSIONAL BARCODE PRINT (IMAGE)     ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🖨️ Printer:', printerName);
    console.log('🪟 Method: Image-Based (No CDN, No Timing Issues)');
    console.log('🏷️ Product:', labelData.productName);
    console.log('📋 SKU:', labelData.sku);
    console.log('💰 Price:', labelData.price);
    console.log('📦 Barcode Format:', labelData.barcodeFormat || 'CODE128');
    console.log('═════════════════════════════════════════════');

    // *** STEP 2: GENERATE BARCODE AS IMAGE ***
    console.log('');
    console.log('⏳ Step 1: Generating barcode image...');
    const imageBuffer = await generateBarcodeImage(labelData);
    console.log(`✅ Step 1 Complete: Image generated (${imageBuffer.length} bytes)`);

    // *** STEP 3: PRINT IMAGE TO WINDOWS PRINTER ***
    console.log('');
    console.log('⏳ Step 2: Printing image to Windows printer...');

    return new Promise((resolve) => {
      // Create hidden window to print the image
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Create HTML with embedded image
      const base64Image = imageBuffer.toString('base64');
      const imageHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Barcode</title>
  <style>
    @page {
      size: ${labelData.labelWidth || 40}mm ${labelData.labelHeight || 30}mm;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
    }
  </style>
</head>
<body>
  <img src="data:image/png;base64,${base64Image}" alt="Barcode Label" />
</body>
</html>
      `.trim();

      // Load HTML with embedded image
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(imageHTML)}`);

      // Print when ready
      printWindow.webContents.on('did-finish-load', () => {
        console.log('✓ Image loaded in print window');

        // Small delay to ensure image is rendered
        setTimeout(() => {
          const printOptions = {
            silent: true,
            deviceName: printerName,
            margins: {
              marginType: 'none' as const,
            },
          };

          console.log('🖨️ Sending to printer:', printOptions);

          // Get number of copies
          const printCopies = config.printCopies || 1;
          let copiesPrinted = 0;

          // Function to print one copy
          const printOneCopy = () => {
            printWindow.webContents.print(printOptions, (success, failureReason) => {
              copiesPrinted++;

              if (!success) {
                console.error(`❌ Print failed for copy ${copiesPrinted}:`, failureReason);
                printWindow.close();
                resolve({
                  success: false,
                  error: `فشلت الطباعة: ${failureReason || 'خطأ غير معروف'}`,
                });
                return;
              }

              console.log(`✓ Copy ${copiesPrinted}/${printCopies} printed successfully`);

              // Print next copy or finish
              if (copiesPrinted < printCopies) {
                setTimeout(() => printOneCopy(), 500);
              } else {
                printWindow.close();
                console.log(`✅ All ${printCopies} ${printCopies === 1 ? 'copy' : 'copies'} printed successfully!`);
                resolve({
                  success: true,
                  message: `تم طباعة الباركود بنجاح (${printCopies} ${printCopies === 1 ? 'نسخة' : 'نسخ'})`,
                });
              }
            });
          };

          // Start printing
          printOneCopy();
        }, 500);
      });

      // Handle errors
      printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load image:', errorDescription);
        printWindow.close();
        resolve({
          success: false,
          error: `فشل تحميل الصورة: ${errorDescription}`,
        });
      });

      // Timeout
      setTimeout(() => {
        if (!printWindow.isDestroyed()) {
          console.error('❌ Print timeout');
          printWindow.close();
          resolve({
            success: false,
            error: 'انتهت مهلة الطباعة',
          });
        }
      }, 15000);
    });

  } catch (error: any) {
    console.error('❌ Print barcode error:', error);
    return {
      success: false,
      error: error.message || 'فشلت طباعة الباركود',
    };
  }
}
