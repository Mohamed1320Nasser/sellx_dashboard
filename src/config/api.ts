import { getApiConfig } from "@/shared/api/config";

// API Configuration - will be updated dynamically
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.sellpoint.morita.vip",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Function to get current API config (with dynamic baseURL)
export function getCurrentApiConfig() {
  const dynamicConfig = getApiConfig();
  return {
    ...API_CONFIG,
    baseURL: dynamicConfig.baseURL,
    timeout: dynamicConfig.timeout,
  };
}
