import { useState, useEffect, useCallback } from "react";

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
    };
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

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Configuration loading removed - hardware API not available
      setError("Configuration loading not available");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback(
    async (newConfig: Partial<AppConfig>) => {
      setError("Configuration update not available");
      return false;
    },
    [loadConfig]
  );

  const updateBackendUrl = useCallback(
    async (url: string) => {
      setError("Backend URL update not available");
      return false;
    },
    [loadConfig]
  );

  const testBackendConnection = useCallback(async (url?: string) => {
    return {
      success: false,
      error: "Backend connection test not available",
    };
  }, []);

  const resetConfig = useCallback(async () => {
    setError("Configuration reset not available");
    return false;
  }, [loadConfig]);

  const exportConfig = useCallback(async () => {
    setError("Configuration export not available");
    return null;
  }, []);

  const importConfig = useCallback(
    async (configJson: string) => {
      setError("Configuration import not available");
      return false;
    },
    [loadConfig]
  );

  return {
    config,
    loading,
    error,
    loadConfig,
    updateConfig,
    updateBackendUrl,
    testBackendConnection,
    resetConfig,
    exportConfig,
    importConfig,
  };
}
