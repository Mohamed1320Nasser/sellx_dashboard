/// <reference types="vite/client" />

/**
 * Global type declarations for window properties
 * These are exposed by Electron preload script
 */

interface NetworkAPI {
  getStatus: () => Promise<{ online: boolean }>;
  checkNow: () => Promise<{ online: boolean }>;
  onStatusChange: (callback: (status: { online: boolean }) => void) => () => void;
}

interface ConfigAPI {
  getConfig: () => Promise<any>;
  setConfig: (config: any) => Promise<any>;
  getBackendUrl: () => Promise<any>;
  setBackendUrl: (url: string) => Promise<any>;
  testBackend: (url?: string) => Promise<any>;
  resetConfig: () => Promise<any>;
  exportConfig: () => Promise<any>;
  importConfig: (configJson: string) => Promise<any>;
}

interface PrinterAPI {
  setConfig: (config: any) => Promise<any>;
  printReceipt: (receiptData: any, config?: any) => Promise<any>;
  printLabel: (labelData: any, config?: any) => Promise<any>;
  testPrint: (config?: any) => Promise<any>;
  getAvailablePrinters: () => Promise<string[]>;
  checkStatus: (config?: any) => Promise<any>;
  // Test utilities
  testNetworkConnection: (ip: string, port: number) => Promise<{ success: boolean; message: string; latencyMs?: number; error?: string }>;
  testUSBConnection: () => Promise<{ success: boolean; message: string; error?: string }>;
  sendNetworkTestPrint: (ip: string, port: number, paperWidth: '58mm' | '80mm') => Promise<{ success: boolean; message: string; error?: string }>;
  sendUSBTestPrint: (paperWidth: '58mm' | '80mm') => Promise<{ success: boolean; message: string; error?: string }>;
  discoverUSB: () => Promise<any[]>;
  runComprehensiveTest: (connectionType: 'LAN' | 'USB', ip?: string, port?: number, paperWidth?: '58mm' | '80mm') => Promise<any>;
  // Image printing
  printImage: (imageBuffer: ArrayBuffer, config?: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Test methods
  testMethod1: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  testMethod2: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  testMethod3: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  testMethod4: (config: any) => Promise<{ success: boolean; message?: string; error?: string }>;
}

declare global {
  interface Window {
    isElectron?: boolean;
    networkAPI?: NetworkAPI;
    configAPI?: ConfigAPI;
    printerAPI?: PrinterAPI;
  }
}

export {};
