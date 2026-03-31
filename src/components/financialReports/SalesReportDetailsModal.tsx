import React from 'react';
import { Modal } from '../ui';
import { formatCurrency, formatDate, formatNumber } from '../../utils';
import { Receipt, User, Calendar, Package, DollarSign } from 'lucide-react';
import type { SalesReportItem } from '../../types/business';

interface SalesReportDetailsModalProps {
  sale: SalesReportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const SalesReportDetailsModal: React.FC<SalesReportDetailsModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  if (!sale) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="تفاصيل البيع">
      <div className="space-y-6">
        {/* Sale Header */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Receipt className="w-5 h-5 text-gray-400 ml-2" />
              <div>
                <p className="text-sm text-gray-500">رقم الإيصال</p>
                <p className="font-medium text-gray-900">{sale.receiptNumber}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-gray-400 ml-2" />
              <div>
                <p className="text-sm text-gray-500">إجمالي المبلغ</p>
                <p className="font-medium text-gray-900">{formatCurrency(sale.totalAmount)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 ml-2" />
              <div>
                <p className="text-sm text-gray-500">تاريخ البيع</p>
                <p className="font-medium text-gray-900">{formatDate(sale.saleDate)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Package className="w-5 h-5 text-gray-400 ml-2" />
              <div>
                <p className="text-sm text-gray-500">عدد الأصناف</p>
                <p className="font-medium text-gray-900">{formatNumber(sale._count.items)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        {sale.client && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-blue-500 ml-2" />
              <h3 className="text-lg font-medium text-gray-900">معلومات العميل</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">اسم العميل</p>
                <p className="font-medium text-gray-900">{sale.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">رقم العميل</p>
                <p className="font-medium text-gray-900">#{sale.client.id}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        {sale.user && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 text-green-500 ml-2" />
              <h3 className="text-lg font-medium text-gray-900">معلومات الموظف</h3>
            </div>
            <div>
              <p className="text-sm text-gray-500">اسم الموظف</p>
              <p className="font-medium text-gray-900">{sale.user.fullname}</p>
            </div>
          </div>
        )}

        {/* Sale Items */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 ml-2" />
            أصناف البيع
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنتج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكمية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    سعر الوحدة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجمالي
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sale.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.product.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">إجمالي البيع</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(sale.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SalesReportDetailsModal;
