import React from 'react';
import { Calendar, DollarSign, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatTableDate } from '../../utils/dateUtils';
import type { Payment } from '../../services/paymentService';

interface PaymentHistoryProps {
  payments: Payment[];
  isLoading?: boolean;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments, isLoading = false }) => {
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="w-4 h-4" />;
      case 'MOBILE_WALLET':
        return <Smartphone className="w-4 h-4" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'نقدي';
      case 'MOBILE_WALLET':
        return 'محفظة إلكترونية';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      default:
        return method;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'PENDING':
        return 'في الانتظار';
      case 'FAILED':
        return 'فشل';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مدفوعات</h3>
        <p className="text-gray-500">لم يتم إضافة أي مدفوعات بعد</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  {getPaymentMethodIcon(payment.paymentMethod)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1 flex-wrap">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPaymentStatusColor(payment.paymentStatus)}`}>
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 break-words">
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 ml-3">
                <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                  <Calendar className="w-4 h-4 ml-1 flex-shrink-0" />
                  <span className="text-xs">{formatTableDate(payment.paymentDate)}</span>
                </div>
              </div>
            </div>

            {(payment.reference || payment.notes) && (
              <div className="pt-3 border-t border-gray-200">
                {payment.reference && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">المرجع: </span>
                    <span className="text-sm text-gray-600 break-words">{payment.reference}</span>
                  </div>
                )}
                {payment.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">ملاحظات: </span>
                    <span className="text-sm text-gray-600 break-words">{payment.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">إجمالي المدفوعات:</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
          </span>
        </div>
      </div>
    </>
  );
};

export default PaymentHistory;
