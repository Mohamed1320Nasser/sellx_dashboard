import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, CreditCard, Smartphone, Building2, CheckCircle, Clock, XCircle, AlertCircle, Printer } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Card } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, PaymentMethod, PaymentStatus } from '../services/paymentService';
import { formatCurrency } from '../utils/currencyUtils';
import { formatTableDate } from '../utils/dateUtils';
import { usePrinter } from '../hooks/usePrinter';
import { PrintStatus } from '../components/pos/PrintStatus';
import toast from 'react-hot-toast';

const PaymentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useSessionAuthStore();

  const companyId = company?.companyId || company?.company?.id;

  // Hardware integration
  const { isPrinting, printReceipt } = usePrinter({
    onPrint: (result) => {
      toast.success('Payment receipt printed successfully');
    },
    onError: (error) => {
      toast.error(`Print failed: ${error.message}`);
    }
  });

  // Fetch payment data
  const { data: paymentResponse, isLoading, error } = useQuery({
    queryKey: ['payment', id, companyId],
    queryFn: () => paymentService.getById(id!, companyId!),
    enabled: !!id && !!companyId,
  });

  const payment = (paymentResponse as any)?.data;

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: () => paymentService.delete(id!, companyId!),
    onSuccess: () => {
      toast.success('تم حذف الدفعة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      navigate('/payments');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء حذف الدفعة';
      toast.error(errorMessage);
    },
  });

  const handleBack = () => {
    navigate('/payments');
  };

  const handleEdit = () => {
    navigate(`/payments/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      deletePaymentMutation.mutate();
    }
  };

  const handlePrintReceipt = async () => {
    if (!payment) return;

    const receiptContent = `**PAYMENT RECEIPT**
---
SellX POS System
---
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Payment ID: ${payment.id}
---
Payment Method: ${payment.paymentMethod}
Amount: ${formatCurrency(payment.amount)}
Status: ${payment.paymentStatus}
---
${payment.notes ? `Notes: ${payment.notes}` : ''}
---
Thank you for your business!
QR:https://sellx.com
---
`;

    await printReceipt({
      type: 'receipt',
      content: receiptContent,
      options: {
        width: 58,
        copies: 1,
        cut: true
      }
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case PaymentMethod.CASH:
        return <DollarSign className="w-5 h-5" />;
      case PaymentMethod.MOBILE_WALLET:
        return <Smartphone className="w-5 h-5" />;
      case PaymentMethod.BANK_TRANSFER:
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'نقدي';
      case PaymentMethod.MOBILE_WALLET:
        return 'محفظة إلكترونية';
      case PaymentMethod.BANK_TRANSFER:
        return 'تحويل بنكي';
      default:
        return method;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5" />;
      case PaymentStatus.PENDING:
        return <Clock className="w-5 h-5" />;
      case PaymentStatus.FAILED:
        return <XCircle className="w-5 h-5" />;
      case PaymentStatus.CANCELLED:
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'مكتمل';
      case PaymentStatus.PENDING:
        return 'في الانتظار';
      case PaymentStatus.FAILED:
        return 'فشل';
      case PaymentStatus.CANCELLED:
        return 'ملغي';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'text-green-600 bg-green-50 border-green-200';
      case PaymentStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case PaymentStatus.FAILED:
        return 'text-red-600 bg-red-50 border-red-200';
      case PaymentStatus.CANCELLED:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !payment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل الدفعة</h3>
          <p className="text-gray-600 mb-4">لم يتم العثور على الدفعة أو حدث خطأ في التحميل</p>
          <Button onClick={handleBack}>العودة إلى المدفوعات</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 ml-1" />
              العودة
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تفاصيل الدفعة #{payment.id}</h1>
              <p className="text-gray-600">عرض تفاصيل الدفعة</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              loading={isPrinting}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              loading={deletePaymentMutation.isPending}
              className="flex items-center text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 ml-1" />
              حذف
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">معلومات الدفعة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الدفعة</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <p className="text-gray-900 font-medium">#{payment.id}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <p className="text-gray-900 font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span className="text-gray-900">{getPaymentMethodLabel(payment.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حالة الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(payment.paymentStatus)}`}>
                        {getPaymentStatusIcon(payment.paymentStatus)}
                        <span className="mr-2">{getPaymentStatusLabel(payment.paymentStatus)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 ml-1" />
                        {formatTableDate(payment.paymentDate)}
                      </div>
                    </div>
                  </div>

                  {payment.reference && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المرجع</label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <p className="text-gray-900">{payment.reference}</p>
                      </div>
                    </div>
                  )}
                </div>

                {payment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <p className="text-gray-900">{payment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Related Invoice */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">الفاتورة المرتبطة</h3>
                </div>

                {(payment as any).sale && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900">فاتورة بيع</h4>
                        <p className="text-sm text-green-700">#{(payment as any).sale.id}</p>
                        <p className="text-sm text-green-600">{(payment as any).sale.receiptNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-900">{formatCurrency((payment as any).sale.totalAmount)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/sales/${(payment as any).sale.id}`)}
                          className="mt-2"
                        >
                          عرض الفاتورة
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(payment as any).purchase && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900">فاتورة شراء</h4>
                        <p className="text-sm text-blue-700">#{(payment as any).purchase.id}</p>
                        <p className="text-sm text-blue-600">{(payment as any).purchase.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-900">
                          {formatCurrency(((payment as any).purchase.totalAmount || 0) + ((payment as any).purchase.taxAmount || 0))}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/purchases/${(payment as any).purchase.id}`)}
                          className="mt-2"
                        >
                          عرض الفاتورة
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card padding="lg">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">ملخص الدفعة</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">المبلغ</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">طريقة الدفع</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">الحالة</div>
                    <div className={`text-sm font-semibold ${getPaymentStatusColor(payment.paymentStatus).split(' ')[0]}`}>
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Print Status */}
            <PrintStatus
              isPrinting={isPrinting}
              isConnected={true} // This would come from device status in a real implementation
              lastPrint={payment ? `Payment #${payment.id}` : undefined}
              lastPrintTime={Date.now()}
            />

            {/* Additional Information */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">معلومات إضافية</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الإنشاء</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 ml-1" />
                        {formatTableDate(payment.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">آخر تحديث</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 ml-1" />
                        {formatTableDate(payment.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {(payment as any).user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <p className="text-gray-900">{(payment as any).user.fullname}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentDetails;
