import { app, BrowserWindow, shell, ipcMain } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { registerConfigHandlers } from "./ipc/configHandlers";
import { registerPrinterHandlers } from "./printer/ipcHandlers";

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Network status monitoring
let isOnline = true;
let networkCheckInterval: NodeJS.Timeout | null = null;

// Determine if running in development mode
// Check multiple conditions to reliably detect dev mode
const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

// App information
const APP_NAME = "SellX POS";
const APP_VERSION = app.getVersion() || "1.0.0";

// Only log in development
if (isDev) {
  console.log(`[ELECTRON] ${APP_NAME} v${APP_VERSION}`);
  console.log(`[ELECTRON] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[ELECTRON] Development mode: ${isDev}`);
}

async function createWindow(): Promise<void> {
  // Determine icon path based on platform and environment
  let iconPath: string;
  if (isDev) {
    iconPath = join(__dirname, "../../public/icon.png");
  } else {
    // In production, try multiple possible locations
    const possiblePaths = [
      join(__dirname, "../public/icon.png"),
      join(__dirname, "../../public/icon.png"),
      join(process.resourcesPath || "", "app/public/icon.png"),
    ];
    iconPath = possiblePaths.find(p => existsSync(p)) || possiblePaths[0];
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: APP_NAME,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
      // Disable web security to allow API calls to external server
      // This is needed because Electron apps have CORS issues with external APIs
      webSecurity: false,
      sandbox: false, // Needed for IPC
      spellcheck: false,
      devTools: true, // TEMP: Enable for debugging white page issue
    },
    icon: iconPath,
    titleBarStyle: "default",
    show: false,
    backgroundColor: "#ffffff",
  });

  // Set app user model id for Windows
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_NAME);
  }

  // Load the app
  if (isDev) {
    await loadDevServer();
  } else {
    await loadProductionApp();
  }

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Fallback: Show window after a timeout if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log("[ELECTRON] Forcing window to show (timeout fallback)");
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Security: Handle navigation
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow localhost in development and file:// in production
    const isAllowed =
      (isDev && parsedUrl.hostname === "localhost") ||
      navigationUrl.startsWith("file://");

    if (!isAllowed) {
      event.preventDefault();
      // Open external URLs in default browser
      shell.openExternal(navigationUrl);
    }
  });

  // Security: Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

async function loadDevServer(): Promise<void> {
  if (!mainWindow) return;

  const devPorts = [5173, 5174, 5175, 5176, 5177];
  let devUrl: string | null = null;

  // Find available development server
  for (const port of devPorts) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        devUrl = `http://localhost:${port}`;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!devUrl) {
    console.error("[ELECTRON] No development server found. Please run 'npm run dev' first.");
    app.quit();
    return;
  }

  console.log(`[ELECTRON] Loading development server: ${devUrl}`);
  await mainWindow.loadURL(devUrl);

  // Open DevTools docked to the right side of the window (not detached)
  mainWindow.webContents.openDevTools({ mode: "right" });

  // Development logging
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[ELECTRON] Page loaded successfully");
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error(`[ELECTRON] Failed to load: ${errorCode} - ${errorDescription}`);
  });
}

async function loadProductionApp(): Promise<void> {
  if (!mainWindow) return;

  // In production, the index.html is in the dist folder alongside main.js
  const indexPath = join(__dirname, "index.html");

  console.log(`[ELECTRON] __dirname: ${__dirname}`);
  console.log(`[ELECTRON] Looking for index.html at: ${indexPath}`);

  if (!existsSync(indexPath)) {
    console.error(`[ELECTRON] index.html not found at: ${indexPath}`);
    // Try alternative paths
    const altPaths = [
      join(__dirname, "../dist/index.html"),
      join(process.resourcesPath || "", "app/dist/index.html"),
    ];

    for (const altPath of altPaths) {
      if (existsSync(altPath)) {
        console.log(`[ELECTRON] Found index.html at: ${altPath}`);
        await mainWindow.loadFile(altPath);
        return;
      }
    }

    console.error("[ELECTRON] Could not find index.html in any location");
    app.quit();
    return;
  }

  console.log(`[ELECTRON] Loading production app from: ${indexPath}`);
  await mainWindow.loadFile(indexPath);

  // TEMP: Open DevTools to debug white page issue
  mainWindow.webContents.openDevTools({ mode: "right" });

  // Production logging and error handling
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[ELECTRON] Production page loaded successfully");
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error(`[ELECTRON] Failed to load: ${errorCode} - ${errorDescription}`);
  });

  // Listen for console messages from renderer
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const levels = ["verbose", "info", "warning", "error"];
    console.log(`[RENDERER ${levels[level] || level}] ${message} (${sourceId}:${line})`);
  });

  // Listen for renderer crashes
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[ELECTRON] Renderer process gone:", details);
  });

  // Listen for unresponsive renderer
  mainWindow.webContents.on("unresponsive", () => {
    console.error("[ELECTRON] Renderer became unresponsive");
  });
}

// Ignore certificate errors (for development/self-signed certs)
// This helps when API server has SSL issues
app.commandLine.appendSwitch("ignore-certificate-errors");

// ============================================================================
// NETWORK STATUS MONITORING
// ============================================================================

// Check if we have internet connectivity by pinging a reliable endpoint
async function checkNetworkStatus(): Promise<boolean> {
  const endpoints = [
    'https://www.google.com',
    'https://www.cloudflare.com',
    'https://www.microsoft.com',
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }
    } catch {
      // Try next endpoint
      continue;
    }
  }

  return false;
}

// Start monitoring network status
function startNetworkMonitoring(): void {
  // Initial check
  checkNetworkStatus().then((online) => {
    isOnline = online;
    notifyRendererNetworkStatus(online);
    console.log(`[NETWORK] Initial status: ${online ? 'ONLINE' : 'OFFLINE'}`);
  });

  // Check every 5 seconds
  networkCheckInterval = setInterval(async () => {
    const online = await checkNetworkStatus();

    // Only notify if status changed
    if (online !== isOnline) {
      isOnline = online;
      notifyRendererNetworkStatus(online);
      console.log(`[NETWORK] Status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    }
  }, 5000);
}

// Stop monitoring
function stopNetworkMonitoring(): void {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
}

// Notify renderer process about network status
function notifyRendererNetworkStatus(online: boolean): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network:status-changed', { online });
  }
}

// Register network IPC handlers
function registerNetworkHandlers(): void {
  // Get current network status
  ipcMain.handle('network:get-status', async () => {
    const online = await checkNetworkStatus();
    isOnline = online;
    return { online };
  });

  // Force check network status
  ipcMain.handle('network:check', async () => {
    const online = await checkNetworkStatus();
    isOnline = online;
    notifyRendererNetworkStatus(online);
    return { online };
  });
}

// ============================================================================

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Register IPC handlers before creating window
  registerConfigHandlers();
  registerNetworkHandlers();
  registerPrinterHandlers();

  await createWindow();

  // Start network monitoring after window is created
  startNetworkMonitoring();

  app.on("activate", () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // Stop network monitoring
  stopNetworkMonitoring();

  // On macOS, keep app running even when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation from renderer
app.on("web-contents-created", (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient("sellx");

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[ELECTRON] Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[ELECTRON] Unhandled Rejection:", reason);
});

// Export for potential use in other modules
export { mainWindow };
