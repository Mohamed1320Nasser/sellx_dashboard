import React from 'react';
import { Package, User, Calendar, Hash, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { Modal } from '../ui';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { StockMovementType } from '../../types/business';
import type { StockMovement } from '../../types/business';

interface StockMovementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockMovement: StockMovement;
}

const StockMovementDetailsModal: React.FC<StockMovementDetailsModalProps> = ({
  isOpen,
  onClose,
  stockMovement,
}) => {
  const getMovementTypeLabel = (type: StockMovementType) => {
    const labels = {
      [StockMovementType.PURCHASE]: 'شراء',
      [StockMovementType.SALE]: 'بيع',
      [StockMovementType.ADJUSTMENT]: 'تعديل مخزون',
      [StockMovementType.RETURN]: 'إرجاع',
    };
    return labels[type];
  };

  const getMovementTypeColor = (type: StockMovementType) => {
    const colors = {
      [StockMovementType.PURCHASE]: 'bg-green-100 text-green-800 border-green-200',
      [StockMovementType.SALE]: 'bg-red-100 text-red-800 border-red-200',
      [StockMovementType.ADJUSTMENT]: 'bg-blue-100 text-blue-800 border-blue-200',
      [StockMovementType.RETURN]: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type];
  };

  const getMovementTypeIcon = (type: StockMovementType) => {
    const icons = {
      [StockMovementType.PURCHASE]: TrendingUp,
      [StockMovementType.SALE]: TrendingDown,
      [StockMovementType.ADJUSTMENT]: Minus,
      [StockMovementType.RETURN]: RotateCcw,
    };
    return icons[type];
  };

  const getQuantityDisplay = (quantity: number) => {
    if (quantity > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3 ml-1" />
          +{quantity}
        </span>
      );
    } else if (quantity < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <TrendingDown className="w-3 h-3 ml-1" />
          {quantity}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Minus className="w-3 h-3 ml-1" />
          {quantity}
        </span>
      );
    }
  };

  const TypeIcon = getMovementTypeIcon(stockMovement.type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="تفاصيل حركة المخزون">
      <div className="p-6 space-y-6">
        {/* Movement Type Badge - Prominent at top */}
        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-medium border-2 ${getMovementTypeColor(stockMovement.type)}`}>
            <TypeIcon className="w-5 h-5 ml-2" />
            {getMovementTypeLabel(stockMovement.type)}
          </span>
        </div>

        {/* Product Information Card */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-5 border border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 ml-2 text-primary-600" />
            معلومات المنتج
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">اسم المنتج</span>
              <span className="text-base font-semibold text-gray-900">{stockMovement.product?.name || 'غير محدد'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">رمز المنتج</span>
              <span className="text-sm text-gray-900 font-mono bg-white px-3 py-1 rounded-md">{stockMovement.product?.sku || 'غير محدد'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">المخزون الحالي</span>
              <span className="text-base font-bold text-primary-600">{stockMovement.product?.stockQuantity || 0} وحدة</span>
            </div>
          </div>
        </div>

        {/* Movement Details Card */}
        <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Hash className="w-5 h-5 ml-2 text-gray-600" />
            تفاصيل الحركة
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">الكمية</span>
              <div>{getQuantityDisplay(stockMovement.quantity)}</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">المخزون السابق</span>
              <span className="text-base text-gray-900">{stockMovement.previousStock} وحدة</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">المخزون الجديد</span>
              <span className="text-base font-bold text-gray-900">{stockMovement.newStock} وحدة</span>
            </div>
            {stockMovement.reference && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">المرجع</span>
                <span className="text-sm text-gray-900 font-mono">{stockMovement.reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* User and Date Information - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-700">معلومات المستخدم</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">اسم المستخدم</span>
              <span className="text-sm font-medium text-gray-900">{stockMovement.user?.fullname || 'غير محدد'}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-700">معلومات التاريخ</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">تاريخ الإنشاء</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(stockMovement.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الوقت</span>
                <span className="text-sm font-medium text-gray-900">{formatDateTime(stockMovement.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Change Summary - Highlighted */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">ملخص التغيير</h3>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">من</div>
              <div className="text-2xl font-bold text-gray-700">{stockMovement.previousStock}</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">إلى</div>
              <div className="text-2xl font-bold text-primary-600">{stockMovement.newStock}</div>
            </div>
            <div className="mr-4">
              {getQuantityDisplay(stockMovement.quantity)}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StockMovementDetailsModal;
