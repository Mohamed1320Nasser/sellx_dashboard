/**
 * PrintStatus component - stub for backward compatibility
 */

import React from 'react';

interface PrintStatusProps {
  status?: 'idle' | 'printing' | 'success' | 'error';
  message?: string;
  isPrinting?: boolean;
  isConnected?: boolean;
  lastPrint?: string;
  lastPrintTime?: number;
  [key: string]: any; // Allow any other properties for backward compatibility
}

export function PrintStatus({ status = 'idle', message, isPrinting, isConnected }: PrintStatusProps) {
  // Use isPrinting prop if status not explicitly provided
  const effectiveStatus = isPrinting ? 'printing' : status;

  if (effectiveStatus === 'idle' && !isPrinting) return null;

  return (
    <div className={`px-3 py-2 rounded-lg text-sm ${
      effectiveStatus === 'printing' || isPrinting ? 'bg-blue-100 text-blue-800' :
      effectiveStatus === 'success' ? 'bg-green-100 text-green-800' :
      effectiveStatus === 'error' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {message || effectiveStatus}
    </div>
  );
}
