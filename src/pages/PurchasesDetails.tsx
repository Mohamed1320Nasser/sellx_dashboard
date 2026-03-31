import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Calendar, Download, Edit, Plus, Printer, FileText, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Card } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '../services/purchaseService';
import { paymentService, type CreatePaymentRequest } from '../services/paymentService';
import { PaymentModal, PaymentHistory } from '../components/payments';
import { formatCurrency, formatNumber } from '../utils/currencyUtils';
import { formatTableDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { usePrinter } from '../hooks/usePrinter';
// import type { Purchase } from '../types';

const PurchasesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const queryClient = useQueryClient();

  const companyId = company?.companyId || company?.company?.id;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Printer hook
  const { isPrinting, printReceipt, printers } = usePrinter({
    onPrint: () => {
      toast.success("تم طباعة فاتورة الشراء بنجاح");
    },
    onError: (error) => {
      toast.error(`فشل في الطباعة: ${error.message}`);
    },
  });

  // Fetch purchase data
  const { data: purchase, isLoading, error } = useQuery({
    queryKey: ['purchase', id, companyId],
    queryFn: () => purchaseService.getById(parseInt(id!), companyId!),
    enabled: !!id && !!companyId,
    select: (data: any) => data?.data || data,
  });

  const handleBack = () => {
    navigate('/purchases');
  };

  const handleEdit = () => {
    navigate(`/purchases/${id}/edit`);
  };

  // Reprint purchase receipt handler
  const handleReprintReceipt = useCallback(async () => {
    if (!purchase) {
      toast.error('لا توجد بيانات لفاتورة الشراء');
      return;
    }

    if (printers.length === 0) {
      toast.error('لا توجد طابعة متصلة. يرجى توصيل الطابعة أولاً.');
      return;
    }

    const receiptContent = `**${company?.name || 'فاتورة شراء'}**
---
${company?.name || 'SellX POS System'}
---
رقم الفاتورة: ${purchase.invoiceNumber}
التاريخ: ${purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}
الوقت: ${purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleTimeString('ar-SA') : new Date().toLocaleTimeString('ar-SA')}
المورد: ${purchase.supplier?.name || 'مورد غير محدد'}
طريقة الدفع: ${purchase.paymentMethod === 'CASH' ? 'نقدي' : 'آخر'}
---
المنتجات:
${purchase.items?.map((item: any) =>
  `${item.product?.name || 'منتج'} x${item.quantity} = ${formatCurrency(item.totalPrice || (item.quantity * item.unitPrice))}`
).join('\n') || ''}
---
${purchase.taxAmount && purchase.taxAmount > 0 ? `الضريبة: ${formatCurrency(purchase.taxAmount)}\n` : ''}المجموع الكلي: ${formatCurrency(purchase.totalAmount)}
حالة الدفع: ${purchase.paymentStatus === 'PAID' ? 'مدفوع' : purchase.paymentStatus === 'PARTIAL' ? 'مدفوع جزئياً' : 'غير مدفوع'}
---
شكراً لتعاملكم مع ${company?.name || 'شركتنا'}!
---
نظام SellX لنقاط البيع
---
`;

    try {
      await printReceipt({
        type: 'receipt',
        content: receiptContent,
        options: {
          width: 48,
          copies: 1,
        },
      });
    } catch (error) {
      console.error('Print error:', error);
    }
  }, [purchase, printReceipt, printers]);

  const handleDownloadInvoice = () => {
    if (!purchase?.invoiceUrl) {
      toast.error('رابط الفاتورة غير متوفر');
      return;
    }

    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = purchase.invoiceUrl;
      link.download = `invoice-${purchase?.invoiceNumber || 'purchase'}.${purchase.invoiceUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('جاري تحميل الفاتورة...');
    } catch (error) {
      toast.error('فشل في تحميل الفاتورة');
    }
  };

  // Payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentService.create(data),
    onSuccess: () => {
      toast.success('تم إضافة الدفعة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['purchase', id, companyId] });
      setShowPaymentModal(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.msg || error?.message || 'حدث خطأ أثناء إضافة الدفعة';
      toast.error(errorMessage);
    },
  });

  const handleCreatePayment = async (data: CreatePaymentRequest) => {
    await createPaymentMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري التحميل...</h2>
            <p className="text-gray-600">يرجى الانتظار بينما نقوم بتحميل بيانات عملية الشراء</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!companyId) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في البيانات</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على معرف الشركة</p>
            <Button onClick={handleBack}>
              العودة إلى قائمة المشتريات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل عملية الشراء</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'حدث خطأ أثناء تحميل بيانات عملية الشراء'}
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>معرف عملية الشراء: {id}</p>
              <p>معرف الشركة: {companyId}</p>
            </div>
            <Button onClick={handleBack}>
              العودة إلى قائمة المشتريات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!purchase) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">عملية الشراء غير موجودة</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على عملية الشراء المطلوبة</p>
            <Button onClick={handleBack}>
              العودة إلى قائمة المشتريات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const paymentStatusMap = {
    PAID: { text: "مدفوع", color: "text-green-600 bg-green-100" },
    PARTIAL: { text: "مدفوع جزئياً", color: "text-yellow-600 bg-yellow-100" },
    UNPAID: { text: "غير مدفوع", color: "text-red-600 bg-red-100" },
  };

  const status = paymentStatusMap[purchase.paymentStatus as keyof typeof paymentStatusMap] || 
                { text: purchase.paymentStatus, color: "text-gray-600 bg-gray-100" };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center space-x-2 space-x-reverse text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                فاتورة شراء رقم {purchase.invoiceNumber}
              </h1>
              <p className="text-gray-500 text-sm">تفاصيل عملية الشراء</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              onClick={handleReprintReceipt}
              variant="outline"
              size="sm"
              disabled={isPrinting || printers.length === 0}
              className="text-green-600 border-green-200 hover:bg-green-50"
              title={printers.length === 0 ? 'لا توجد طابعة متصلة' : 'إعادة طباعة الفاتورة'}
            >
              <Printer className="w-4 h-4 ml-1" />
              {isPrinting ? 'جاري الطباعة...' : 'إعادة الطباعة'}
            </Button>
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 ml-1" />
              تحميل PDF
            </Button>
            <Button
              onClick={handleEdit}
              size="sm"
            >
              <Edit className="w-4 h-4 ml-1" />
              تعديل
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase Information */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات الفاتورة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفاتورة</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900 font-mono">{purchase.invoiceNumber}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الشراء</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {purchase.purchaseDate ? formatTableDate(purchase.purchaseDate) : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {purchase.supplier?.name || 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإنشاء</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {purchase.createdAt ? formatTableDate(purchase.createdAt) : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">آخر تحديث</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {purchase.updatedAt ? formatTableDate(purchase.updatedAt) : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Invoice File Display */}
            {purchase.invoiceUrl && (
              <Card padding="lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">فاتورة الشراء المرفقة</h3>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {!purchase.invoiceUrl.toLowerCase().endsWith('.pdf') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                            disabled={zoom >= 3}
                            className="text-gray-700 border-gray-300"
                            title="تكبير"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
                            disabled={zoom <= 0.5}
                            className="text-gray-700 border-gray-300"
                            title="تصغير"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setZoom(1)}
                            disabled={zoom === 1}
                            className="text-gray-700 border-gray-300"
                            title="الحجم الأصلي"
                          >
                            <span className="text-xs font-medium">100%</span>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadInvoice}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 ml-1" />
                        تحميل
                      </Button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    {purchase.invoiceUrl.toLowerCase().endsWith('.pdf') ? (
                      // PDF Display with embedded viewer
                      <div className="relative">
                        <iframe
                          src={purchase.invoiceUrl}
                          className="w-full h-[700px]"
                          title="فاتورة الشراء"
                        />
                      </div>
                    ) : (
                      // Image Display with zoom
                      <div className="overflow-auto max-h-[700px] p-4 bg-checkered">
                        <div className="flex items-center justify-center min-h-[400px]">
                          <img
                            src={purchase.invoiceUrl}
                            alt="فاتورة الشراء"
                            style={{
                              transform: `scale(${zoom})`,
                              transformOrigin: 'center',
                              transition: 'transform 0.2s ease',
                              maxWidth: '100%',
                              height: 'auto',
                            }}
                            className="shadow-lg rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">
                        {purchase.invoiceUrl.toLowerCase().endsWith('.pdf') ? 'ملف PDF' : 'صورة'}
                      </span>
                      {!purchase.invoiceUrl.toLowerCase().endsWith('.pdf') && (
                        <span className="text-xs text-gray-500">• التكبير: {Math.round(zoom * 100)}%</span>
                      )}
                    </div>
                    <a
                      href={purchase.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 ml-1" />
                      فتح في نافذة جديدة
                    </a>
                  </div>
                </div>
              </Card>
            )}

            {/* Purchase Items */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">منتجات الفاتورة</h3>
                </div>
              
                {purchase.items && purchase.items.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المنتج
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            السعر
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            الكمية
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            المجموع
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchase.items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product?.name || 'منتج غير محدد'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.product?.sku || ''}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد منتجات في هذه الفاتورة</p>
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
                <h3 className="text-lg font-semibold text-gray-900">ملخص المدفوعات</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">المبلغ الإجمالي</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency((purchase.totalAmount || 0) + (purchase.taxAmount || 0))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">المبلغ المدفوع</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(purchase.paidAmount || 0)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">المبلغ المتبقي</div>
                    <div className={`text-xl font-bold ${
                      (purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency((purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Management */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">إدارة المدفوعات</h3>
                  </div>
                  {(purchase.totalAmount || 0) + (purchase.taxAmount || 0) - (purchase.paidAmount || 0) > 0 && (
                    <Button
                      onClick={() => {
                        setShowPaymentModal(true);
                      }}
                      size="sm"
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة دفعة
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-md font-semibold text-gray-800">تاريخ المدفوعات</h4>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <PaymentHistory
                      payments={purchase.payments || []}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Information */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات إضافية</h3>
                </div>

                <div className="space-y-4">
                  {purchase.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <p className="text-gray-900">{purchase.notes}</p>
                      </div>
                    </div>
                  )}

                  {purchase.reminderEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">إعدادات التذكير</label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <p className="text-gray-900">
                          <span className="font-medium">التذكير مفعل</span>
                          {purchase.reminderDate && (
                            <span className="block text-sm text-gray-600 mt-1">
                              تاريخ التذكير: {formatTableDate(purchase.reminderDate)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
        }}
        onSubmit={handleCreatePayment}
        purchaseId={parseInt(id!)}
        companyId={companyId!}
        remainingAmount={(purchase?.totalAmount || 0) + (purchase?.taxAmount || 0) - (purchase?.paidAmount || 0)}
        isLoading={createPaymentMutation.isPending}
      />
    </Layout>
  );
};

export default PurchasesDetails;
