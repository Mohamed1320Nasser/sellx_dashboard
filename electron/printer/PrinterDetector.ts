/**
 * Printer Detector
 * Automatically detects and manages Windows printers
 *
 * BEST PRACTICES:
 * 1. Auto-detect system default printer
 * 2. List all available printers
 * 3. Smart fallback hierarchy
 * 4. Filter thermal printers
 */

import { webContents } from 'electron';

export interface DetectedPrinter {
  name: string;
  displayName: string;
  description: string;
  status: string;
  isDefault: boolean;
  options?: any;
}

/**
 * Get all system printers using Electron's API
 */
export async function getSystemPrinters(): Promise<DetectedPrinter[]> {
  try {
    console.log('🔍 Detecting system printers...');

    // Get any webContents to access printer list
    const allWebContents = webContents.getAllWebContents();
    if (allWebContents.length === 0) {
      console.warn('⚠️ No webContents available for printer detection');
      return [];
    }

    const wc = allWebContents[0];
    const printers = await wc.getPrintersAsync();

    console.log(`✅ Found ${printers.length} system printers`);

    return printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || '',
      status: printer.status?.toString() || 'unknown',
      isDefault: printer.isDefault || false,
      options: printer.options,
    }));
  } catch (error: any) {
    console.error('❌ Failed to get system printers:', error);
    return [];
  }
}

/**
 * Get the system default printer
 */
export async function getDefaultPrinter(): Promise<DetectedPrinter | null> {
  try {
    const printers = await getSystemPrinters();
    const defaultPrinter = printers.find((p) => p.isDefault);

    if (defaultPrinter) {
      console.log('✅ Default printer found:', defaultPrinter.name);
      return defaultPrinter;
    }

    console.warn('⚠️ No default printer set in system');
    return null;
  } catch (error: any) {
    console.error('❌ Failed to get default printer:', error);
    return null;
  }
}

/**
 * Find thermal printers by name patterns
 * Common thermal printer brands/models
 */
export async function findThermalPrinters(): Promise<DetectedPrinter[]> {
  const printers = await getSystemPrinters();

  // Common thermal printer name patterns
  const thermalPatterns = [
    /xprinter/i,
    /pos-?58/i,
    /pos-?80/i,
    /thermal/i,
    /receipt/i,
    /tm-?(t|m|u)\d+/i,  // Epson TM series (TM-T20, TM-T88, TM-U220, etc.)
    /tsp\d+/i,           // Star TSP series
    /rp-?80/i,           // Rongta RP80
    /zj-?58/i,           // Zjiang ZJ-58
    /bixolon/i,
    /citizen/i,
    /label/i,
    /barcode/i,
  ];

  const thermalPrinters = printers.filter((printer) => {
    const name = printer.name.toLowerCase();
    return thermalPatterns.some((pattern) => pattern.test(name));
  });

  console.log(`✅ Found ${thermalPrinters.length} thermal printers`);
  thermalPrinters.forEach((p) => {
    console.log(`   - ${p.name}${p.isDefault ? ' (DEFAULT)' : ''}`);
  });

  return thermalPrinters;
}

/**
 * Smart printer selection with fallback hierarchy
 *
 * PRIORITY:
 * 1. User's saved printer name (if exists and available)
 * 2. Last used thermal printer
 * 3. First detected thermal printer
 * 4. System default printer
 * 5. First available printer
 */
export async function selectBestPrinter(
  savedPrinterName?: string
): Promise<string | null> {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     SMART PRINTER SELECTION              ║');
  console.log('╚═══════════════════════════════════════════╝');

  const allPrinters = await getSystemPrinters();

  if (allPrinters.length === 0) {
    console.error('❌ No printers found on system');
    return null;
  }

  console.log(`📋 Total printers available: ${allPrinters.length}`);
  console.log(`💾 Saved printer name: ${savedPrinterName || '(none)'}`);

  // PRIORITY 1: User's saved printer (if exists and available)
  if (savedPrinterName && savedPrinterName.trim() !== '') {
    const savedPrinter = allPrinters.find(
      (p) => p.name.toLowerCase() === savedPrinterName.toLowerCase()
    );

    if (savedPrinter) {
      console.log('✅ PRIORITY 1: Using saved printer:', savedPrinter.name);
      return savedPrinter.name;
    } else {
      console.warn('⚠️ Saved printer not found, trying alternatives...');
    }
  }

  // PRIORITY 2 & 3: Thermal printers
  const thermalPrinters = await findThermalPrinters();

  if (thermalPrinters.length > 0) {
    // Prefer default thermal printer if available
    const defaultThermal = thermalPrinters.find((p) => p.isDefault);
    if (defaultThermal) {
      console.log('✅ PRIORITY 2: Using default thermal printer:', defaultThermal.name);
      return defaultThermal.name;
    }

    // Use first thermal printer
    console.log('✅ PRIORITY 3: Using first thermal printer:', thermalPrinters[0].name);
    return thermalPrinters[0].name;
  }

  // PRIORITY 4: System default printer
  const defaultPrinter = allPrinters.find((p) => p.isDefault);
  if (defaultPrinter) {
    console.log('✅ PRIORITY 4: Using system default printer:', defaultPrinter.name);
    return defaultPrinter.name;
  }

  // PRIORITY 5: First available printer
  console.log('✅ PRIORITY 5: Using first available printer:', allPrinters[0].name);
  return allPrinters[0].name;
}

/**
 * Validate if a printer is available
 */
export async function isPrinterAvailable(printerName: string): Promise<boolean> {
  const printers = await getSystemPrinters();
  return printers.some(
    (p) => p.name.toLowerCase() === printerName.toLowerCase()
  );
}
