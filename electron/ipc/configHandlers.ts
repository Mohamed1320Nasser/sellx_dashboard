import { ipcMain } from "electron";
import { appConfig, AppConfig } from "../config/appConfig";
import { IPC_CHANNELS } from "./channels";

export function registerConfigHandlers() {
  // Get full configuration
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    try {
      return { success: true, data: appConfig.get() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Update configuration
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    async (_, config: Partial<AppConfig>) => {
      try {
        appConfig.set(config);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Get backend URL specifically
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_BACKEND_URL, async () => {
    try {
      return { success: true, data: appConfig.getBackendUrl() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Set backend URL specifically
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET_BACKEND_URL,
    async (_, url: string) => {
      try {
        appConfig.setBackendUrl(url);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Test backend connection
  ipcMain.handle(IPC_CHANNELS.CONFIG_TEST_BACKEND, async (_, url?: string) => {
    try {
      const testUrl = url || appConfig.getBackendUrl();
      const response = await fetch(`${testUrl}/health`, {
        method: "GET",
        timeout: 5000,
      } as any);

      if (response.ok) {
        return { success: true, data: { status: "connected", url: testUrl } };
      } else {
        return {
          success: false,
          error: `Server responded with status ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  });

  // Reset configuration to defaults
  ipcMain.handle(IPC_CHANNELS.CONFIG_RESET, async () => {
    try {
      appConfig.reset();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Export configuration
  ipcMain.handle(IPC_CHANNELS.CONFIG_EXPORT, async () => {
    try {
      return { success: true, data: appConfig.export() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Import configuration
  ipcMain.handle(IPC_CHANNELS.CONFIG_IMPORT, async (_, configJson: string) => {
    try {
      const success = appConfig.import(configJson);
      return {
        success,
        error: success ? undefined : "Invalid configuration format",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}
