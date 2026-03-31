// Default API configuration
const DEFAULT_API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "https://api.sellpoint.morita.vip",
  timeout: 30000,
  retries: 3,
};

// Runtime API configuration
let currentApiConfig = { ...DEFAULT_API_CONFIG };

// Get the current API configuration
export function getApiConfig() {
  return { ...currentApiConfig };
}

// Update the API configuration
export async function updateApiConfig(
  newConfig: Partial<typeof DEFAULT_API_CONFIG>
) {
  currentApiConfig = { ...currentApiConfig, ...newConfig };
}

// Load API configuration
export async function loadApiConfig() {
  console.log("[CONFIG] Loading API config...");
  console.log("[CONFIG] Final API config:", currentApiConfig);
}

// Test API connection
export async function testApiConnection(url?: string) {
  const testUrl = url || currentApiConfig.baseURL;

  try {
    const response = await fetch(`${testUrl}/health`, {
      method: "GET",
      timeout: 5000,
    } as any);

    return {
      success: response.ok,
      status: response.status,
      url: testUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
      url: testUrl,
    };
  }
}

// Get the current base URL
export function getBaseURL() {
  return currentApiConfig.baseURL;
}

// Set the base URL
export async function setBaseURL(url: string) {
  await updateApiConfig({ baseURL: url });
}

// Reset API configuration to defaults
export async function resetApiConfig() {
  console.log("[CONFIG] Resetting API config to defaults...");
  currentApiConfig = { ...DEFAULT_API_CONFIG };
}

// Initialize API configuration on app start
export async function initializeApiConfig() {
  await loadApiConfig();
}
