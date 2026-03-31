import React, { useState, useRef } from 'react';
import { Printer, AlertCircle } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import type { Product } from '../../types';
import JsBarcode from 'jsbarcode';
import { useLabelSettings } from '../../hooks/useLabelSettings';

interface QuickPrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onPrint: (copies: number) => Promise<void>;
  printerConnected: boolean;
}

const QuickPrintBarcodeModal: React.FC<QuickPrintBarcodeModalProps> = ({
  isOpen,
  onClose,
  product,
  onPrint,
  printerConnected,
}) => {
  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const isPrintingRef = useRef(false);  // Additional ref to prevent race conditions

  // Get label settings from API (single source of truth)
  const { settings: labelSettings } = useLabelSettings();

  // Determine which barcode to print (calculate before hooks)
  const barcodeValue = product?.localBarcode || product?.originalBarcode || product?.sku || '';
  const barcodeType = product?.localBarcode
    ? 'باركود محلي'
    : product?.originalBarcode
    ? 'باركود أصلي'
    : 'SKU';

  // Generate barcode when component renders - use saved settings
  // IMPORTANT: This hook must be called on every render (not conditionally)
  //
  // For 35x25mm labels (1.36" x 0.98"):
  // - barcodeHeight: 70px = 8.75mm at 203 DPI
  // - barcodeWidth: 2 = compact but scannable
  // - fontSize: 10 = readable HRI text
  React.useEffect(() => {
    if (barcodeRef.current && barcodeValue && isOpen && product) {
      try {
        // Use exact settings from API - NO overrides
        // This ensures preview matches print output (WYSIWYG)
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: labelSettings.barcodeFormat as any,
          width: labelSettings.barcodeWidth,
          height: labelSettings.barcodeHeight,
          displayValue: labelSettings.showBarcodeText,
          fontSize: labelSettings.barcodeFontSize,
          margin: 2,       // Compact margin for small labels
          textMargin: 1,   // Compact text margin
          background: '#ffffff',
          lineColor: '#000000',
          font: 'monospace',
          fontOptions: 'bold',
        });
      } catch (error) {
        console.error('Barcode generation error:', error);
      }
    }
  }, [barcodeValue, isOpen, labelSettings, product]);

  // Early return AFTER all hooks
  if (!product) return null;

  const handlePrint = () => {
    // CRITICAL: Synchronous check BEFORE any async operation
    // This prevents race conditions from double-clicks
    if (isPrintingRef.current) {
      console.log('[QuickPrintModal] Print blocked - ref already set (fast double-click)');
      return;
    }

    // Set ref IMMEDIATELY (synchronous) before any state update
    isPrintingRef.current = true;

    // Now check other conditions
    if (copies < 1 || isPrinting) {
      console.log('[QuickPrintModal] Print blocked - invalid state');
      isPrintingRef.current = false;
      return;
    }

    // Set state for UI updates
    setIsPrinting(true);

    console.log(`[QuickPrintModal] Starting print: ${copies} copies`);

    // Fire and forget - don't wait for response
    onPrint(copies)
      .then(() => {
        console.log('[QuickPrintModal] Print completed successfully');
        setCopies(1); // Reset copies after successful print
        onClose();
      })
      .catch((error) => {
        console.error('[QuickPrintModal] Print error:', error);
      })
      .finally(() => {
        // Add small delay before releasing lock to prevent rapid re-clicks
        setTimeout(() => {
          isPrintingRef.current = false;
          setIsPrinting(false);
        }, 500);
      });
  };

  const handleClose = () => {
    setCopies(1); // Reset copies when closing
    isPrintingRef.current = false; // Reset print ref
    setIsPrinting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="طباعة ملصق الباركود" size="sm">
      <div className="space-y-5">
        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>

          {/* Barcode Display - Actual barcode preview */}
          <div className="mt-3 p-2 bg-white border-2 border-gray-200 rounded-lg text-center">
            <svg ref={barcodeRef} className="w-full"></svg>
            <p className="text-xs text-gray-500 mt-1">{barcodeType}</p>
          </div>

          {/* Label settings info - show actual mm size */}
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>الملصق: {labelSettings.labelWidth}×{labelSettings.labelHeight}mm</span>
            <span>|</span>
            <span>الباركود: {labelSettings.barcodeHeight}px ({(labelSettings.barcodeHeight / 8).toFixed(1)}mm)</span>
          </div>
        </div>

        {/* Printer Status Warning */}
        {!printerConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">الطابعة غير متصلة</p>
                <p className="text-xs text-yellow-700 mt-1">
                  يرجى توصيل الطابعة للمتابعة
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Number of Copies */}
        {printerConnected && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عدد النسخ
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={copies.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setCopies(Math.max(1, Math.min(100, value)));
              }}
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              الحد الأقصى 100 نسخة
            </p>
          </div>
        )}

        {/* Print Preview Info */}
        {printerConnected && copies > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              سيتم طباعة <span className="font-bold">{copies}</span> ملصق باركود
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPrinting}
          >
            إلغاء
          </Button>
          {printerConnected && (
            <Button
              onClick={handlePrint}
              disabled={isPrinting || copies < 1}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="w-4 h-4 ml-2" />
              {isPrinting ? 'جاري الطباعة...' : 'طباعة'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default QuickPrintBarcodeModal;
