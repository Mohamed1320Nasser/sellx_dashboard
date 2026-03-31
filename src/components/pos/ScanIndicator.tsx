/**
 * ScanIndicator component - stub for backward compatibility
 */

import React from 'react';
import { Scan } from 'lucide-react';

interface ScanIndicatorProps {
  isScanning?: boolean;
  lastScan?: string | null;
  isConnected?: boolean;
  [key: string]: any; // Allow any other properties for backward compatibility
}

export function ScanIndicator({ isScanning = false, lastScan, isConnected }: ScanIndicatorProps) {
  if (!isScanning && !lastScan) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      isScanning ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    }`}>
      <Scan className="w-4 h-4" />
      {isScanning ? 'جاري المسح...' : `تم المسح: ${lastScan}`}
    </div>
  );
}
