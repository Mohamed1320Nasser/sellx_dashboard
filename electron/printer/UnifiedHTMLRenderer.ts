/**
 * UNIFIED HTML RENDERER
 * Single source of truth for all HTML-based printing
 *
 * DESIGN PRINCIPLES:
 * - DRY (Don't Repeat Yourself): One renderer for all print jobs
 * - Separation of Concerns: Rendering vs Printing
 * - Reusability: Works for USB and LAN (via image conversion)
 * - Consistency: Same HTML templates as frontend
 */

import { BrowserWindow } from 'electron';

export interface HTMLRenderOptions {
  html: string;
  printerName: string;
  copies?: number;
  silent?: boolean;
  waitTime?: number; // Time to wait for rendering (ms)
}

export interface RenderResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Render HTML and print to Windows printer
 * Used for: USB printing (both receipt and barcode)
 *
 * @param options - HTML content and print settings
 * @returns Promise with print result
 */
export async function renderAndPrint(
  options: HTMLRenderOptions
): Promise<RenderResult> {
  const {
    html,
    printerName,
    copies = 1,
    silent = true,
    waitTime = 1500,
  } = options;

  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   UNIFIED HTML RENDERER & PRINTER        ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('📅 Time:', new Date().toISOString());
  console.log('🖨️ Printer:', printerName);
  console.log('📄 Copies:', copies);
  console.log('🔇 Silent:', silent);
  console.log('⏱️ Wait Time:', waitTime, 'ms');
  console.log('═════════════════════════════════════════════');

  return new Promise((resolve) => {
    // Create hidden window for rendering
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Allow external resources (CDN, fonts, etc.)
      },
    });

    // Load HTML content
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    // Wait for page to load
    printWindow.webContents.on('did-finish-load', () => {
      console.log('✓ HTML content loaded');
      console.log(`⏳ Waiting ${waitTime}ms for rendering...`);

      // Wait for rendering to complete
      setTimeout(() => {
        console.log('✓ Rendering complete, starting print...');

        // Print options
        const printOptions = {
          silent: silent,
          deviceName: printerName,
          margins: {
            marginType: 'none' as const,
          },
        };

        console.log('🖨️ Print options:', printOptions);

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

            console.log(`✓ Copy ${copiesPrinted}/${copies} printed successfully`);

            // Print next copy or finish
            if (copiesPrinted < copies) {
              // Small delay between copies
              setTimeout(() => printOneCopy(), 500);
            } else {
              // All copies printed
              printWindow.close();
              console.log(`✅ All ${copies} ${copies === 1 ? 'copy' : 'copies'} printed successfully!`);
              resolve({
                success: true,
                message: `Printed successfully (${copies} ${copies === 1 ? 'copy' : 'copies'})`,
              });
            }
          });
        };

        // Start printing
        printOneCopy();

      }, waitTime);
    });

    // Handle load errors
    printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('❌ Failed to load HTML content:', errorDescription);
      printWindow.close();
      resolve({
        success: false,
        error: `Failed to load HTML: ${errorDescription}`,
      });
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        console.error('❌ Print timeout (15 seconds)');
        printWindow.close();
        resolve({
          success: false,
          error: 'Print timeout - operation took too long',
        });
      }
    }, 15000);
  });
}

/**
 * Render HTML to image buffer
 * Used for: LAN printing (convert HTML to image, then to ESC/POS)
 *
 * NOTE: This should be done in renderer process (frontend)
 * This is a placeholder for future implementation
 */
export async function renderToImage(html: string): Promise<Buffer> {
  // TODO: Implement HTML to image conversion in Electron main process
  // For now, this is handled by frontend (html-to-image library)
  throw new Error('renderToImage must be called from renderer process');
}
