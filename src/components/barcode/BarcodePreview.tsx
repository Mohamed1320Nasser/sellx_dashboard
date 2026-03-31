/**
 * BarcodePreview - Shared barcode component for preview and printing
 *
 * Used in:
 * - DeviceSettings.tsx (label preview)
 * - ProductList print modal
 * - Print output (same HTML structure)
 *
 * This ensures what you see is what you print.
 */

import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { AlertCircle } from 'lucide-react';

export interface BarcodePreviewProps {
  barcode: string;
  companyName?: string;
  productName?: string;  // NEW: Product name
  price?: number;        // NEW: Product price
  // Label dimensions
  labelWidth?: number;  // mm
  labelHeight?: number; // mm
  // Barcode settings
  barcodeHeight?: number;
  barcodeWidth?: number;
  barcodeFormat?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39';
  showBarcodeText?: boolean;
  fontSize?: number;
  // Display options
  showBorder?: boolean;
  scale?: number; // Scale factor for screen display (1 = actual size)
  className?: string;
  // Error handling
  onError?: (error: string) => void;
}

// Default settings optimized for 35x25mm labels (1.36" x 0.98")
// These match FALLBACK_SETTINGS in useLabelSettings.ts
// UPDATED: Increased barcode height from 40px to 60px for better scannability
const DEFAULTS = {
  labelWidth: 35,           // 1.36 inch
  labelHeight: 25,          // 0.98 inch
  barcodeHeight: 60,        // 60px - improved scannability at 12" distance
  barcodeWidth: 2,          // Width 2 = compact but scannable
  barcodeFormat: 'CODE128' as const,
  showBarcodeText: true,
  fontSize: 9,              // 9px - compact but readable
  companyName: 'SellX',
};

export function BarcodePreview({
  barcode,
  companyName = DEFAULTS.companyName,
  productName,
  price,
  labelWidth = DEFAULTS.labelWidth,
  labelHeight = DEFAULTS.labelHeight,
  barcodeHeight = DEFAULTS.barcodeHeight,
  barcodeWidth = DEFAULTS.barcodeWidth,
  barcodeFormat = DEFAULTS.barcodeFormat,
  showBarcodeText = DEFAULTS.showBarcodeText,
  fontSize = DEFAULTS.fontSize,
  showBorder = true,
  scale = 1,
  className = '',
  onError,
}: BarcodePreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (svgRef.current && barcode) {
      try {
        // Clear previous error
        setError(null);

        // IMPORTANT: Use exact values from settings - NO Math.max() overrides!
        // This ensures WYSIWYG (What You See Is What You Get) - preview = print
        //
        // Size guidelines for 35x25mm labels (203 DPI = 8 dots/mm):
        // - barcodeHeight: 60px = 7.5mm (good scan range up to 12")
        // - barcodeWidth: 2 = minimum scannable, 3 = optimal
        // - fontSize: 9px = readable on thermal printers
        JsBarcode(svgRef.current, barcode, {
          format: barcodeFormat,
          width: barcodeWidth,          // Use exact value - no override
          height: barcodeHeight,        // Use exact value - no override
          displayValue: showBarcodeText,
          fontSize: fontSize,           // Use exact value - no override
          margin: 2,                    // Smaller margin for compact labels
          background: '#ffffff',
          lineColor: '#000000',
          textMargin: 1,                // Reduced text margin for compact layout
          font: 'monospace',
          fontOptions: 'bold',
        });
      } catch (e: any) {
        const errorMessage = e?.message || 'Failed to generate barcode';
        console.error('Barcode generation error:', e);
        setError(errorMessage);

        // Notify parent component
        if (onError) {
          onError(errorMessage);
        }
      }
    }
  }, [barcode, barcodeFormat, barcodeWidth, barcodeHeight, showBarcodeText, fontSize, onError]);

  // Calculate scaled dimensions for screen display
  const displayWidth = labelWidth * scale;
  const displayHeight = labelHeight * scale;

  return (
    <div
      className={`bg-white flex flex-col items-center justify-center ${showBorder ? 'border border-gray-400' : ''} ${className}`}
      style={{
        width: `${displayWidth}mm`,
        height: `${displayHeight}mm`,
        padding: `${1 * scale}mm`,
      }}
    >
      {error ? (
        // Error state - show user-friendly message
        <div className="flex flex-col items-center justify-center h-full text-center px-2">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-xs text-red-600 font-semibold mb-1">Barcode Error</p>
          <p className="text-xs text-gray-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Check barcode format and value
          </p>
        </div>
      ) : (
        <>
          {/* Product Name */}
          {productName && (
            <div
              className="font-bold text-center truncate w-full"
              style={{ fontSize: `${fontSize * scale}px`, marginBottom: `${0.5 * scale}mm` }}
            >
              {productName}
            </div>
          )}

          {/* Barcode */}
          <svg
            ref={svgRef}
            style={{
              maxWidth: `${(labelWidth - 4) * scale}mm`,
              height: 'auto',
            }}
          />

          {/* Price */}
          {price !== undefined && (
            <div
              className="font-bold text-center w-full"
              style={{ fontSize: `${10 * scale}px`, marginTop: `${0.5 * scale}mm` }}
            >
              {price.toFixed(2)} ج.م
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Generate HTML for printing - matches BarcodePreview exactly
 * This is used by the Electron printer
 */
export function generatePrintHTML(options: {
  barcode: string;
  companyName?: string;
  labelWidth?: number;
  labelHeight?: number;
  barcodeHeight?: number;
  barcodeWidth?: number;
  fontSize?: number;
  showBarcodeText?: boolean;
}): string {
  const {
    barcode,
    companyName = DEFAULTS.companyName,
    labelWidth = DEFAULTS.labelWidth,
    labelHeight = DEFAULTS.labelHeight,
    barcodeHeight = DEFAULTS.barcodeHeight,
    barcodeWidth = DEFAULTS.barcodeWidth,
    fontSize = DEFAULTS.fontSize,
    showBarcodeText = DEFAULTS.showBarcodeText,
  } = options;

  // This HTML structure matches the React component above
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${labelWidth}mm;
      height: ${labelHeight}mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1mm;
      font-family: Arial, sans-serif;
    }
    .company {
      font-size: 8px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 1mm;
    }
    .barcode-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    svg {
      max-width: ${labelWidth - 4}mm;
      height: auto;
    }
  </style>
</head>
<body>
  ${companyName ? `<div class="company">${companyName}</div>` : ''}
  <div class="barcode-container">
    <!-- Barcode SVG will be injected by Electron -->
    <div id="barcode-placeholder" data-barcode="${barcode}" data-height="${barcodeHeight}" data-width="${barcodeWidth}" data-font-size="${fontSize}" data-show-text="${showBarcodeText}"></div>
  </div>
</body>
</html>`;
}

export default BarcodePreview;
