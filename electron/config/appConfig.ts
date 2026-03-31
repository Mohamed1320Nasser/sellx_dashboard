// Import electron-store with CommonJS require for Electron main process
let Store: any;
try {
  Store = require('electron-store');
} catch (error) {
  console.warn('[AppConfig] electron-store not available:', error);
}

export interface PrinterConfig {
  type: 'usb' | 'network';
  deviceId?: string;
  profileName: string; // Changed from keyof typeof PRINTER_PROFILES
  width: number;
  copies: number;
  enableQueue?: boolean;
  network?: {
    host: string;
    port: number;
    timeout: number;
    name?: string;
  };
}

export interface AppConfig {
  backend: {
    apiUrl: string;
    timeout: number;
    retries: number;
  };
  hardware: {
    scanner: {
      mode: "hid" | "serial";
      comPort?: string;
      baudRate: number;
      debounceMs: number;
      prefix?: string;
      suffix?: string;
    };
    printer: {
      deviceId?: string;
      width: number;
      copies: number;
      autoPrint?: boolean;
      autoPrintReceipts?: boolean;
      autoPrintBarcodes?: boolean;
    };
    barcodePrinter?: PrinterConfig;
    receiptPrinter?: PrinterConfig;
  };
  ui: {
    theme: "light" | "dark" | "auto";
    language: "ar" | "en";
    fontSize: "small" | "medium" | "large";
  };
  debug: {
    enabled: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
  };
}

const defaultConfig: AppConfig = {
  backend: {
    apiUrl: process.env.API_URL || "https://api.sellpoint.morita.vip",
    timeout: 30000,
    retries: 3,
  },
  hardware: {
    scanner: {
      mode: "hid",
      baudRate: 9600,
      debounceMs: 100,
    },
    printer: {
      width: 80,
      copies: 1,
      autoPrint: true,
      autoPrintReceipts: true,
      autoPrintBarcodes: false,
    },
    barcodePrinter: {
      type: 'usb',
      profileName: 'XPRINTER_80MM',
      width: 80,
      copies: 1,
      enableQueue: true,
    },
    receiptPrinter: {
      type: 'usb',
      profileName: 'XPRINTER_80MM',
      width: 80,
      copies: 1,
      enableQueue: true,
    },
  },
  ui: {
    theme: "light",
    language: "ar",
    fontSize: "medium",
  },
  debug: {
    enabled: false,
    logLevel: "info",
  },
};

// Type-safe store schema
const schema = {
  backend: {
    type: "object" as const,
    properties: {
      apiUrl: { type: "string" as const },
      timeout: { type: "number" as const, minimum: 1000, maximum: 120000 },
      retries: { type: "number" as const, minimum: 0, maximum: 10 },
    },
  },
  hardware: {
    type: "object" as const,
    properties: {
      scanner: {
        type: "object" as const,
        properties: {
          mode: { type: "string" as const, enum: ["hid", "serial"] },
          comPort: { type: "string" as const },
          baudRate: { type: "number" as const, minimum: 1200, maximum: 115200 },
          debounceMs: { type: "number" as const, minimum: 0, maximum: 1000 },
          prefix: { type: "string" as const },
          suffix: { type: "string" as const },
        },
      },
      printer: {
        type: "object" as const,
        properties: {
          deviceId: { type: "string" as const },
          width: { type: "number" as const, minimum: 24, maximum: 80 },
          copies: { type: "number" as const, minimum: 1, maximum: 10 },
          autoPrint: { type: "boolean" as const },
          autoPrintReceipts: { type: "boolean" as const },
          autoPrintBarcodes: { type: "boolean" as const },
        },
      },
    },
  },
  ui: {
    type: "object" as const,
    properties: {
      theme: { type: "string" as const, enum: ["light", "dark", "auto"] },
      language: { type: "string" as const, enum: ["ar", "en"] },
      fontSize: { type: "string" as const, enum: ["small", "medium", "large"] },
    },
  },
  debug: {
    type: "object" as const,
    properties: {
      enabled: { type: "boolean" as const },
      logLevel: {
        type: "string" as const,
        enum: ["error", "warn", "info", "debug"],
      },
    },
  },
};

// In-memory store interface
interface MemoryStore {
  data: AppConfig;
  get(key: string, defaultValue?: any): any;
  set(key: string | AppConfig, value?: any): void;
  clear(): void;
}

class AppConfigManager {
  private electronStore: any = null;
  private memoryStore: MemoryStore;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize memory store as fallback
    this.memoryStore = {
      data: { ...defaultConfig },
      get: (key: string, defaultValue?: any) => {
        const keys = key.split('.');
        let value: any = this.memoryStore.data;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return defaultValue;
          }
        }
        return value ?? defaultValue;
      },
      set: (keyOrConfig: string | AppConfig, value?: any) => {
        if (typeof keyOrConfig === 'string') {
          const keys = keyOrConfig.split('.');
          let obj: any = this.memoryStore.data;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
              obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = value;
        } else {
          this.memoryStore.data = this.deepMerge(this.memoryStore.data, keyOrConfig);
        }
      },
      clear: () => {
        this.memoryStore.data = { ...defaultConfig };
      }
    };

    // Try to initialize electron-store
    this.initializeStore();
  }

  private initializeStore(): void {
    if (!Store) {
      console.log("[AppConfig] Using in-memory store (electron-store not available)");
      this.isInitialized = true;
      return;
    }

    try {
      this.electronStore = new Store({
        name: "app-config",
        defaults: defaultConfig,
        schema: schema as any,
        clearInvalidConfig: true,
      });
      this.isInitialized = true;
      console.log("[AppConfig] electron-store initialized successfully");
    } catch (error) {
      console.error("[AppConfig] Failed to initialize electron-store:", error);
      console.log("[AppConfig] Using in-memory store as fallback");
      this.electronStore = null;
      this.isInitialized = true;
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  get(): AppConfig {
    if (!this.isInitialized) {
      console.warn("[AppConfig] Store not initialized, returning defaults");
      return defaultConfig;
    }

    if (this.electronStore) {
      return this.electronStore.store as AppConfig;
    }
    return this.memoryStore.data;
  }

  set(config: Partial<AppConfig>): void {
    if (!this.isInitialized) {
      console.warn("[AppConfig] Store not initialized, cannot set config");
      return;
    }

    if (this.electronStore) {
      // Deep merge and set the entire store
      const currentConfig = this.electronStore.store as AppConfig;
      const mergedConfig = this.deepMerge(currentConfig, config);
      this.electronStore.store = mergedConfig;
    } else {
      this.memoryStore.set(config as AppConfig);
    }
  }

  getBackendUrl(): string {
    if (!this.isInitialized) {
      return defaultConfig.backend.apiUrl;
    }

    if (this.electronStore) {
      return this.electronStore.get("backend.apiUrl", defaultConfig.backend.apiUrl);
    }
    return this.memoryStore.get("backend.apiUrl", defaultConfig.backend.apiUrl);
  }

  setBackendUrl(url: string): void {
    if (!this.isInitialized) return;

    if (this.electronStore) {
      this.electronStore.set("backend.apiUrl", url);
    } else {
      this.memoryStore.set("backend.apiUrl", url);
    }
  }

  getHardwareConfig(): AppConfig["hardware"] {
    if (!this.isInitialized) {
      return defaultConfig.hardware;
    }

    if (this.electronStore) {
      return this.electronStore.get("hardware", defaultConfig.hardware);
    }
    return this.memoryStore.get("hardware", defaultConfig.hardware);
  }

  setHardwareConfig(config: Partial<AppConfig["hardware"]>): void {
    if (!this.isInitialized) return;

    const currentHardware = this.getHardwareConfig();
    const mergedHardware = { ...currentHardware, ...config };

    if (this.electronStore) {
      this.electronStore.set("hardware", mergedHardware);
    } else {
      this.memoryStore.set("hardware", mergedHardware);
    }
  }

  reset(): void {
    if (!this.isInitialized) return;

    if (this.electronStore) {
      this.electronStore.clear();
    } else {
      this.memoryStore.clear();
    }
    console.log("[AppConfig] Configuration reset to defaults");
  }

  export(): string {
    return JSON.stringify(this.get(), null, 2);
  }

  import(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson) as AppConfig;
      this.set(config);
      return true;
    } catch (error) {
      console.error("[AppConfig] Failed to import config:", error);
      return false;
    }
  }
}

export const appConfig = new AppConfigManager();
