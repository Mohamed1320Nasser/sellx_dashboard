import React, { useState } from 'react';
import { X, Printer, Package, Barcode, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import type { Product } from '../../types';

interface PrintBarcodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onPrint?: (copies: number) => Promise<void>;
  printerConnected?: boolean;
}

const PrintBarcodeDialog: React.FC<PrintBarcodeDialogProps> = ({
  isOpen,
  onClose,
  product,
  onPrint,
  printerConnected = true,
}) => {
  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!product) return null;

  // Determine which barcode to print
  const barcodeValue = product.localBarcode || product.originalBarcode || product.sku;
  const barcodeType = product.localBarcode
    ? 'باركود محلي'
    : product.originalBarcode
    ? 'باركود أصلي'
    : 'SKU';

  const handlePrint = async () => {
    if (!onPrint || copies < 1) return;

    setIsPrinting(true);
    try {
      await onPrint(copies);
      onClose();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="طباعة ملصق الباركود" size="md">
      <div className="space-y-6">
        {/* Success Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 ml-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                تم إنشاء المنتج بنجاح!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                هل تريد طباعة ملصقات الباركود الآن؟
              </p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{product.description || 'لا يوجد وصف'}</p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">رمز المنتج (SKU):</span>
                  <span className="font-medium text-gray-900">{product.sku}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">نوع الباركود:</span>
                  <span className="font-medium text-gray-900">{barcodeType}</span>
                </div>

                {/* Barcode Display */}
                <div className="mt-3 p-3 bg-white border-2 border-gray-300 rounded-lg text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Barcode className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 tracking-wider font-mono">
                    {barcodeValue}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{product.barcodeFormat || 'UNKNOWN'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Number of Copies */}
        {printerConnected && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عدد النسخ المطلوبة
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
              يمكنك طباعة من 1 إلى 100 نسخة من الملصق
            </p>
          </div>
        )}

        {/* Printer Status Warning */}
        {!printerConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">⚠️ الطابعة غير متصلة</p>
                <p className="text-xs text-yellow-700 mt-1">
                  لن تتمكن من طباعة الملصقات الآن. يمكنك طباعتها لاحقاً من صفحة تفاصيل المنتج بعد توصيل الطابعة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Print Preview Info */}
        {printerConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              📄 سيتم طباعة <span className="font-bold">{copies}</span> ملصق باركود بحجم 1×2 بوصة
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPrinting}
          >
            {printerConnected ? 'تخطي' : 'إغلاق'}
          </Button>
          {printerConnected && (
            <Button
              onClick={handlePrint}
              disabled={isPrinting || !onPrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 ml-2" />
              {isPrinting ? 'جاري الطباعة...' : 'طباعة الآن'}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center pt-2">
          💡 تلميح: يمكنك طباعة الملصقات لاحقاً من صفحة تفاصيل المنتج
        </div>
      </div>
    </Modal>
  );
};

export default PrintBarcodeDialog;
