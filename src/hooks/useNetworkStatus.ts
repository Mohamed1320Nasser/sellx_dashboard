import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

/**
 * Hook to monitor network connectivity status
 * Works in both Electron (via IPC) and browser (via navigator.onLine)
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true, // Assume online initially
    isChecking: false,
    lastChecked: null,
  });

  // Check if we're in Electron
  const isElectron = typeof window !== 'undefined' && window.isElectron;

  // Manual check function
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      if (isElectron && window.networkAPI?.checkNow) {
        // Use Electron IPC
        const result = await window.networkAPI.checkNow();
        setStatus({
          isOnline: result.online,
          isChecking: false,
          lastChecked: new Date(),
        });
        return result.online;
      } else {
        // Browser fallback - use navigator.onLine + fetch test
        if (!navigator.onLine) {
          setStatus({
            isOnline: false,
            isChecking: false,
            lastChecked: new Date(),
          });
          return false;
        }

        // Double-check with actual fetch
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await fetch('https://www.google.com', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          setStatus({
            isOnline: true,
            isChecking: false,
            lastChecked: new Date(),
          });
          return true;
        } catch {
          setStatus({
            isOnline: false,
            isChecking: false,
            lastChecked: new Date(),
          });
          return false;
        }
      }
    } catch (error) {
      console.error('[useNetworkStatus] Check failed:', error);
      setStatus((prev) => ({
        ...prev,
        isChecking: false,
        lastChecked: new Date(),
      }));
      return false;
    }
  }, [isElectron]);

  // Initial check and setup listeners
  useEffect(() => {
    // Initial check
    if (isElectron && window.networkAPI?.getStatus) {
      window.networkAPI.getStatus().then((result) => {
        setStatus({
          isOnline: result.online,
          isChecking: false,
          lastChecked: new Date(),
        });
      });
    } else {
      // Browser: Use navigator.onLine as initial value
      setStatus({
        isOnline: navigator.onLine,
        isChecking: false,
        lastChecked: new Date(),
      });
    }

    // Setup listeners
    if (isElectron && window.networkAPI?.onStatusChange) {
      // Electron: Listen for IPC events
      const cleanup = window.networkAPI.onStatusChange((data) => {
        setStatus({
          isOnline: data.online,
          isChecking: false,
          lastChecked: new Date(),
        });
      });

      return cleanup;
    } else {
      // Browser: Listen for online/offline events
      const handleOnline = () => {
        setStatus({
          isOnline: true,
          isChecking: false,
          lastChecked: new Date(),
        });
      };

      const handleOffline = () => {
        setStatus({
          isOnline: false,
          isChecking: false,
          lastChecked: new Date(),
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isElectron]);

  return {
    ...status,
    checkConnection,
  };
}

export default useNetworkStatus;
