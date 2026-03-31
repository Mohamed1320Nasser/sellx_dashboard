import React from 'react';
import { X, Package, Tag, DollarSign, BarChart3, Calendar, Hash, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { formatCurrency, formatNumber } from '../../utils/currencyUtils';
import { formatTableDate } from '../../utils/dateUtils';
import type { Product } from '../../types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!product) return null;

  const isLowStock = product.stockQuantity <= (product.minStockLevel || 0);
  const stockStatusColor = isLowStock ? 'text-red-600' : 'text-green-600';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تفاصيل المنتج" size="lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-600 mt-1">{product.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stock Status Alert */}
        {isLowStock && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 ml-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">مخزون منخفض</h3>
                <p className="text-sm text-red-700">
                  المخزون الحالي أقل من الحد الأدنى المطلوب
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              المعلومات الأساسية
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Hash className="w-4 h-4 ml-2" />
                  رمز المنتج (SKU)
                </span>
                <span className="font-medium text-gray-900">{product.sku}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Tag className="w-4 h-4 ml-2" />
                  الفئة
                </span>
                <span className="font-medium text-gray-900">
                  {product.category?.name || 'غير محدد'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 ml-2" />
                  تاريخ الإنشاء
                </span>
                <span className="font-medium text-gray-900">
                  {formatTableDate(product.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 ml-2" />
                  آخر تحديث
                </span>
                <span className="font-medium text-gray-900">
                  {formatTableDate(product.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              الأسعار والمخزون
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <DollarSign className="w-4 h-4 ml-2" />
                  سعر الشراء
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(product.purchasePrice)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <DollarSign className="w-4 h-4 ml-2" />
                  سعر البيع
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(product.sellingPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  المخزون الحالي
                </span>
                <span className={`font-medium ${stockStatusColor}`}>
                  {formatNumber(product.stockQuantity)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 ml-2" />
                  الحد الأدنى للمخزون
                </span>
                <span className="font-medium text-gray-900">
                  {formatNumber(product.minStockLevel || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">تحليل الربحية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">هامش الربح</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(product.sellingPrice - product.purchasePrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">نسبة الربح</p>
              <p className="text-xl font-bold text-green-600">
                {((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">قيمة المخزون</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(product.stockQuantity * product.purchasePrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">الوصف</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductDetailsModal;
