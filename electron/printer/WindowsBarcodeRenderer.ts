/**
 * Windows Barcode Renderer
 * Renders barcode labels as HTML and prints via Windows printer
 *
 * Uses BrowserWindow to render HTML with JsBarcode, then prints to Windows printer
 */

import { BrowserWindow } from 'electron';
import { PrinterConfig, LabelData, PrintResult } from './types';
import { PrinterError, PrinterErrorCode } from './errors';
import { selectBestPrinter } from './PrinterDetector';

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
    window.addEventListener('load', function() {
      try {
        console.log('Generating barcode for SKU: ${sku}');
        JsBarcode("#barcode", "${sku}", {
          format: "${barcodeFormat}",
          width: ${barcodeWidth},
          height: ${barcodeHeight},
          displayValue: true,
          fontSize: 12,
          margin: 1,
          background: "#ffffff",
          lineColor: "#000000",
          textMargin: 0,
          font: "monospace",
          fontOptions: "bold"
        });
        console.log('Barcode generated successfully');
      } catch (error) {
        console.error('Barcode generation error:', error);
        document.body.innerHTML = '<div style="padding: 5mm; color: red; font-size: 8px;">Error: ' + error.message + '<br>SKU: ${sku}<br>Format: ${barcodeFormat}</div>';
      }
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Print barcode label using Windows printer
 * Renders HTML in hidden window, then sends to printer
 */
export async function printBarcodeViaWindows(
  labelData: LabelData,
  config: PrinterConfig
): Promise<PrintResult> {
  // *** SMART PRINTER SELECTION ***
  // Auto-detect best printer if not specified
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
  console.log('║   WINDOWS USB BARCODE PRINT (HTML)       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('📅 Time:', new Date().toISOString());
  console.log('🖨️ Printer:', printerName);
  console.log('🪟 Method: Windows Printing API + HTML Rendering');
  console.log('🏷️ Product:', labelData.productName);
  console.log('📋 SKU:', labelData.sku);
  console.log('💰 Price:', labelData.price);
  console.log('📦 Barcode Format:', labelData.barcodeFormat || 'CODE128');
  console.log('═════════════════════════════════════════════');

  return new Promise((resolve) => {
    // Create hidden window for rendering
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Allow external CDN scripts (JsBarcode)
      },
    });

    // Generate HTML
    const html = generateBarcodeHTML(labelData, config);

    // Load HTML content
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for page to load
    printWindow.webContents.on('did-finish-load', () => {
      console.log('✓ HTML content loaded, waiting for barcode rendering...');

      // Debug: Check if JsBarcode loaded
      setTimeout(async () => {
        try {
          const jsbarCodeExists = await printWindow.webContents.executeJavaScript(`
            typeof JsBarcode !== 'undefined'
          `);
          console.log('🔍 JsBarcode loaded?', jsbarCodeExists);

          const barcodeContent = await printWindow.webContents.executeJavaScript(`
            document.querySelector('#barcode')?.innerHTML || 'BARCODE ELEMENT NOT FOUND'
          `);
          console.log('🔍 Barcode SVG content (first 300 chars):', barcodeContent.substring(0, 300));

          const bodyContent = await printWindow.webContents.executeJavaScript(`
            document.body?.innerHTML?.substring(0, 500) || 'BODY NOT FOUND'
          `);
          console.log('🔍 Body HTML (first 500 chars):', bodyContent);

        } catch (debugError: any) {
          console.error('❌ Debug check error:', debugError.message);
        }
      }, 1000);

      // Wait for barcode to render (JsBarcode CDN needs time to load and execute)
      setTimeout(() => {
        console.log('✓ Barcode rendered, sending to printer...');

        // Print options
        const printOptions = {
          silent: true, // Don't show print dialog
          deviceName: printerName, // Use detected/configured printer name
          margins: {
            marginType: 'none' as const,
          },
        };

        console.log('🖨️ Print options:', printOptions);

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
                error: `Print failed: ${failureReason || 'Unknown error'}`,
              });
              return;
            }

            console.log(`✓ Copy ${copiesPrinted}/${printCopies} printed successfully`);

            // Print next copy or finish
            if (copiesPrinted < printCopies) {
              // Small delay between copies
              setTimeout(() => printOneCopy(), 500);
            } else {
              // All copies printed
              printWindow.close();
              console.log(`✅ All ${printCopies} ${printCopies === 1 ? 'copy' : 'copies'} printed successfully!`);
              resolve({
                success: true,
                message: `Label printed successfully (${printCopies} ${printCopies === 1 ? 'copy' : 'copies'})`,
              });
            }
          });
        };

        // Start printing
        printOneCopy();

      }, 1500); // Wait 1.5 seconds for barcode to render (JsBarcode from CDN)
    });

    // Handle load errors
    printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('❌ Failed to load print content:', errorDescription);
      printWindow.close();
      resolve({
        success: false,
        error: `Failed to load print content: ${errorDescription}`,
      });
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        console.error('❌ Print timeout (10 seconds)');
        printWindow.close();
        resolve({
          success: false,
          error: 'Print timeout - operation took too long',
        });
      }
    }, 10000);
  });
}
