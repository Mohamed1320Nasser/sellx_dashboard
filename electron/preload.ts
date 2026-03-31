import { contextBridge, ipcRenderer } from "electron";

// Configuration methods
const configAPI = {
  getConfig: async () => {
    return ipcRenderer.invoke("config:get");
  },

  setConfig: async (config: any) => {
    return ipcRenderer.invoke("config:set", config);
  },

  getBackendUrl: async () => {
    return ipcRenderer.invoke("config:get-backend-url");
  },

  setBackendUrl: async (url: string) => {
    return ipcRenderer.invoke("config:set-backend-url", url);
  },

  testBackend: async (url?: string) => {
    return ipcRenderer.invoke("config:test-backend", url);
  },

  resetConfig: async () => {
    return ipcRenderer.invoke("config:reset");
  },

  exportConfig: async () => {
    return ipcRenderer.invoke("config:export");
  },

  importConfig: async (configJson: string) => {
    return ipcRenderer.invoke("config:import", configJson);
  },
};

// Network status API
const networkAPI = {
  // Get current network status
  getStatus: async () => {
    return ipcRenderer.invoke("network:get-status");
  },

  // Force check network status
  checkNow: async () => {
    return ipcRenderer.invoke("network:check");
  },

  // Listen for network status changes
  onStatusChange: (callback: (status: { online: boolean }) => void) => {
    const handler = (_event: any, status: { online: boolean }) => {
      callback(status);
    };

    ipcRenderer.on("network:status-changed", handler);

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("network:status-changed", handler);
    };
  },
};

// Printer API
const printerAPI = {
  setConfig: async (config: any) => {
    return ipcRenderer.invoke("printer:setConfig", config);
  },

  printReceipt: async (receiptData: any, config?: any) => {
    return ipcRenderer.invoke("printer:printReceipt", receiptData, config);
  },

  printLabel: async (labelData: any, config?: any) => {
    return ipcRenderer.invoke("printer:printLabel", labelData, config);
  },

  testPrint: async (config?: any) => {
    return ipcRenderer.invoke("printer:testPrint", config);
  },

  getAvailablePrinters: async () => {
    return ipcRenderer.invoke("printer:getAvailablePrinters");
  },

  // NEW: Advanced printer detection
  getSystemPrinters: async () => {
    return ipcRenderer.invoke("printer:getSystemPrinters");
  },

  getDefaultPrinter: async () => {
    return ipcRenderer.invoke("printer:getDefaultPrinter");
  },

  findThermalPrinters: async () => {
    return ipcRenderer.invoke("printer:findThermalPrinters");
  },

  selectBestPrinter: async (savedPrinterName?: string) => {
    return ipcRenderer.invoke("printer:selectBestPrinter", savedPrinterName);
  },

  checkStatus: async (config?: any) => {
    return ipcRenderer.invoke("printer:checkStatus", config);
  },

  // New test utilities
  testNetworkConnection: async (ip: string, port: number) => {
    return ipcRenderer.invoke("printer:testNetworkConnection", ip, port);
  },

  testUSBConnection: async () => {
    return ipcRenderer.invoke("printer:testUSBConnection");
  },

  sendNetworkTestPrint: async (ip: string, port: number, paperWidth: '58mm' | '80mm') => {
    return ipcRenderer.invoke("printer:sendNetworkTestPrint", ip, port, paperWidth);
  },

  sendUSBTestPrint: async (paperWidth: '58mm' | '80mm') => {
    return ipcRenderer.invoke("printer:sendUSBTestPrint", paperWidth);
  },

  discoverUSB: async () => {
    return ipcRenderer.invoke("printer:discoverUSB");
  },

  runComprehensiveTest: async (connectionType: 'LAN' | 'USB', ip?: string, port?: number, paperWidth?: '58mm' | '80mm') => {
    return ipcRenderer.invoke("printer:runComprehensiveTest", connectionType, ip, port, paperWidth);
  },

  // Print image (HTML-to-image method)
  printImage: async (imageBuffer: ArrayBuffer, config?: any) => {
    return ipcRenderer.invoke("printer:printImage", Buffer.from(imageBuffer), config);
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("configAPI", configAPI);
contextBridge.exposeInMainWorld("networkAPI", networkAPI);
contextBridge.exposeInMainWorld("printerAPI", printerAPI);
contextBridge.exposeInMainWorld("isElectron", true);

// Type definitions for the exposed API
declare global {
  interface Window {
    configAPI: typeof configAPI;
    networkAPI: typeof networkAPI;
    printerAPI: typeof printerAPI;
    isElectron: boolean;
  }
}
