/**
 * Scanner hook - stub for backward compatibility
 */

interface ScannerOptions {
  onScan?: (code: string) => void;
  autoStart?: boolean;
  [key: string]: any; // Allow any other properties for backward compatibility
}

export function useScanner(options?: ScannerOptions) {
  return {
    isScanning: false,
    lastScan: null,
    startScanning: () => {
      console.warn('useScanner is deprecated.');
    },
    stopScanning: () => {
      console.warn('useScanner is deprecated.');
    }
  };
}
