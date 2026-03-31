import React from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

interface PaymentSummaryProps {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  isLoading?: boolean;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalAmount,
  paidAmount,
  remainingAmount,
  paymentStatus,
  isLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'PARTIAL':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'UNPAID':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'مدفوع بالكامل';
      case 'PARTIAL':
        return 'مدفوع جزئياً';
      case 'UNPAID':
        return 'غير مدفوع';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <DollarSign className="w-5 h-5" />;
      case 'PARTIAL':
        return <TrendingUp className="w-5 h-5" />;
      case 'UNPAID':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mr-3">ملخص المدفوعات</h3>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(paymentStatus)}`}>
          {getStatusIcon(paymentStatus)}
          <span className="mr-2">{getStatusLabel(paymentStatus)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-sm text-gray-500">المبلغ الإجمالي</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatCurrency(paidAmount)}
          </div>
          <div className="text-sm text-gray-500">المبلغ المدفوع</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${
            remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(remainingAmount)}
          </div>
          <div className="text-sm text-gray-500">المبلغ المتبقي</div>
        </div>
      </div>

      {remainingAmount > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 ml-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">مبلغ متبقي</h4>
              <p className="text-sm text-yellow-700">
                يتبقى {formatCurrency(remainingAmount)} من إجمالي {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {remainingAmount === 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-green-600 ml-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800">مدفوع بالكامل</h4>
              <p className="text-sm text-green-700">
                تم دفع المبلغ الإجمالي بالكامل
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;
