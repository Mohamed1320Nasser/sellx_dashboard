import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Wifi, AlertTriangle } from 'lucide-react';

interface NoInternetPageProps {
  onRetry?: () => void;
  onOnline?: () => void;
}

export default function NoInternetPage({ onRetry, onOnline }: NoInternetPageProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check network status
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    setRetryCount((prev) => prev + 1);

    try {
      // Try Electron API first
      if (window.networkAPI?.checkNow) {
        const result = await window.networkAPI.checkNow();
        setLastChecked(new Date());
        setIsChecking(false);

        if (result.online) {
          onOnline?.();
          return;
        }
      } else {
        // Fallback: Try to fetch from a reliable endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
          await fetch('https://www.google.com', {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          setLastChecked(new Date());
          setIsChecking(false);
          onOnline?.();
          return;
        } catch {
          clearTimeout(timeoutId);
        }
      }
    } catch (error) {
      console.error('[NoInternetPage] Connection check failed:', error);
    }

    setLastChecked(new Date());
    setIsChecking(false);
    onRetry?.();
  }, [onRetry, onOnline]);

  // Listen for network status changes from Electron
  useEffect(() => {
    if (!window.networkAPI?.onStatusChange) return;

    const cleanup = window.networkAPI.onStatusChange((status) => {
      if (status.online) {
        onOnline?.();
      }
    });

    return cleanup;
  }, [onOnline]);

  // Auto-retry every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChecking) {
        checkConnection();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isChecking, checkConnection]);

  // Format last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return null;
    return lastChecked.toLocaleTimeString('ar-EG');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-25"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
              <WifiOff className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            لا يوجد اتصال بالإنترنت
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
            <br />
            سيتم إعادة المحاولة تلقائياً.
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>محاولة إعادة الاتصال #{retryCount}</span>
          </div>

          {/* Retry Button */}
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className={`
              w-full py-4 px-6 rounded-2xl font-semibold text-lg
              flex items-center justify-center gap-3
              transition-all duration-300 transform
              ${isChecking
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/30'
              }
            `}
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5" />
                إعادة المحاولة
              </>
            )}
          </button>

          {/* Last checked time */}
          {lastChecked && (
            <p className="mt-4 text-xs text-gray-400">
              آخر فحص: {formatLastChecked()}
            </p>
          )}
        </div>

        {/* Help Card */}
        <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">؟</span>
            نصائح لحل المشكلة
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              تحقق من اتصال كابل الإنترنت أو الـ Wi-Fi
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              أعد تشغيل جهاز الراوتر
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              تواصل مع مزود خدمة الإنترنت
            </li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          SellX POS - نظام نقاط البيع
        </p>
      </div>
    </div>
  );
}
