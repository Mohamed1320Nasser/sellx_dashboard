/**
 * Printer hook - stub for backward compatibility
 * Use the new printService instead
 */

interface PrinterOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onPrint?: (result?: any) => void;
  [key: string]: any; // Allow any other properties for backward compatibility
}

export function usePrinter(options?: PrinterOptions) {
  return {
    isPrinting: false,
    printers: [],
    printReceipt: async (data: any) => {
      console.warn('usePrinter is deprecated. Use printService instead.');
      // Stub implementation - does nothing
      options?.onSuccess?.();
      options?.onPrint?.();
    },
    printLabel: async (data: any) => {
      console.warn('usePrinter is deprecated. Use printService instead.');
      options?.onSuccess?.();
      options?.onPrint?.();
    }
  };
}
