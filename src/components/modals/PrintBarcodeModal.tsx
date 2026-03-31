/**
 * Print Barcode Modal - Professional POS Style
 *
 * Features:
 * - Live barcode preview
 * - Quantity selector (1-100)
 * - Uses printer settings from store
 */

import React, { useState } from 'react';
import { X, Printer, Plus, Minus } from 'lucide-react';
import { Button, Card } from '../ui';
import { BarcodePreview } from '../barcode/BarcodePreview';
import { usePrinterConfigStore } from '../../stores/printerConfigStore';

export interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (quantity: number) => void | Promise<void>;
  product: {
    name: string;
    sku: string;
    price: number;
  };
}

export function PrintBarcodeModal({
  isOpen,
  onClose,
  onPrint,
  product,
}: PrintBarcodeModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const printerConfig = usePrinterConfigStore();

  if (!isOpen) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await onPrint(quantity);
      onClose();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < 100) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.min(100, Math.max(1, value)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">طباعة باركود المنتج</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">معاينة الباركود</h3>
          <div className="flex justify-center bg-gray-50 rounded-lg p-6">
            <BarcodePreview
              barcode={product.sku}
              productName={product.name}
              labelWidth={printerConfig.labelWidth}
              labelHeight={printerConfig.labelHeight}
              barcodeFormat={printerConfig.barcodeFormat}
              barcodeHeight={printerConfig.barcodeHeight}
              barcodeWidth={printerConfig.barcodeWidth}
              fontSize={printerConfig.labelFontSize}
              showBarcodeText={printerConfig.showBarcodeText}
              scale={2}
              showBorder={true}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">اسم المنتج:</span>
              <span className="font-semibold text-gray-900">{product.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">رمز SKU:</span>
              <span className="font-mono font-semibold text-gray-900">{product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">السعر:</span>
              <span className="font-semibold text-gray-900">{product.price.toFixed(2)} ج.م</span>
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            عدد النسخ
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={handleQuantityChange}
              className="flex-1 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:outline-none focus:border-primary-500"
            />

            <button
              onClick={incrementQuantity}
              disabled={quantity >= 100}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            (الحد الأقصى: 100 نسخة)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isPrinting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-primary-600 hover:bg-primary-700"
            disabled={isPrinting}
          >
            <Printer className="w-5 h-5 ml-2" />
            {isPrinting ? 'جاري الطباعة...' : `طباعة (${quantity})`}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PrintBarcodeModal;
