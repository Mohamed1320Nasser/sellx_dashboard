import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, DollarSign, Package, Download, Building2, Phone, Mail as MailIcon, MapPin, User, CreditCard, CheckCircle, Clock, AlertCircle, Percent, TrendingUp, Printer } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, Card, Badge } from '../components/ui';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useQuery } from '@tanstack/react-query';
import { saleService } from '../services/saleService';
import { formatCurrency, formatNumber } from '../utils/currencyUtils';
import { formatTableDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { printReceipt } from '../services/printService';
import { companyService } from '../services/companyService';

const SalesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company, user } = useSessionAuthStore();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const companyId = company?.companyId || company?.company?.id;

  // Fetch sale data
  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale', id, companyId],
    queryFn: () => saleService.getById(id!, companyId!),
    enabled: !!id && !!companyId,
    select: (data: any) => data?.data || data, // Extract the actual sale data from wrapped response
  });

  const handleBack = () => {
    navigate('/sales');
  };

  const handleDownloadPDF = async () => {
    if (!sale || !pdfContentRef.current) {
      toast.error("لا توجد بيانات للتحميل");
      return;
    }

    setIsGeneratingPDF(true);
    const loadingToast = toast.loading("جاري إنشاء ملف PDF...");

    try {
      const pdfElement = pdfContentRef.current;

      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      pdf.save(`فاتورة-${sale.receiptNumber}.pdf`);

      toast.dismiss(loadingToast);
      toast.success("تم تحميل ملف PDF بنجاح");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.dismiss(loadingToast);
      toast.error("حدث خطأ أثناء إنشاء ملف PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!sale) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }

    try {
      // Fetch full company profile with logo
      const companyId = company?.companyId || company?.id;
      let fullCompany = company?.company || { name: 'POS System' };
      if (companyId) {
        try {
          fullCompany = await companyService.getProfile(companyId);
        } catch (err) {
          console.warn('Could not fetch company profile, using default data');
        }
      }

      await printReceipt({
        sale: sale,
        company: fullCompany,
        cashier: user
      });
    } catch (error) {
      console.error('Print error:', error);
      toast.error('فشلت عملية الطباعة');
    }
  };


  if (isLoading) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <Card padding="lg">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="h-32 bg-gray-200 rounded mt-6"></div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!companyId) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في البيانات</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على معرف الشركة</p>
            <Button onClick={handleBack}>
              العودة إلى قائمة المبيعات
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
            <Receipt className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل الفاتورة</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'حدث خطأ أثناء تحميل بيانات الفاتورة'}
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>معرف الفاتورة: {id}</p>
              <p>معرف الشركة: {companyId}</p>
            </div>
            <Button onClick={handleBack}>
              العودة إلى قائمة المبيعات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sale) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">الفاتورة غير موجودة</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على الفاتورة المطلوبة</p>
            <Button onClick={handleBack}>
              العودة إلى قائمة المبيعات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const paymentMethodText = {
    CASH: 'نقدي',
    CARD: 'بطاقة ائتمان',
    CREDIT: 'آجل'
  };

  const paymentMethodColor = {
    CASH: 'text-green-600 bg-green-50',
    CARD: 'text-blue-600 bg-blue-50',
    CREDIT: 'text-orange-600 bg-orange-50'
  };

  const paymentStatusText = {
    PAID: 'مدفوع',
    PARTIAL: 'مدفوع جزئياً',
    UNPAID: 'غير مدفوع'
  };

  const paymentStatusConfig = {
    PAID: { color: 'text-green-600 bg-green-50', icon: CheckCircle },
    PARTIAL: { color: 'text-amber-600 bg-amber-50', icon: Clock },
    UNPAID: { color: 'text-red-600 bg-red-50', icon: AlertCircle }
  };

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
                فاتورة رقم {sale.receiptNumber}
              </h1>
              <p className="text-gray-500 text-sm">تفاصيل عملية البيع</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              onClick={handlePrintReceipt}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة الفاتورة
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              disabled={isGeneratingPDF}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 ml-1" />
              {isGeneratingPDF ? "جاري التحميل..." : "تحميل PDF"}
            </Button>
          </div>
        </div>

        {/* Sale Overview Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sale Information Card */}
            <Card padding="lg" className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات الفاتورة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الفاتورة</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900 font-mono">{sale.receiptNumber}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البيع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {sale.saleDate ? formatTableDate(sale.saleDate) : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {sale.client?.name || 'عميل نقدي'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        paymentMethodColor[sale.paymentMethod as keyof typeof paymentMethodColor] || 'text-gray-600 bg-gray-50'
                      }`}>
                        {paymentMethodText[sale.paymentMethod as keyof typeof paymentMethodText] || sale.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      {(() => {
                        const status = sale.paymentStatus as keyof typeof paymentStatusConfig;
                        const config = paymentStatusConfig[status] || paymentStatusConfig.UNPAID;
                        const StatusIcon = config.icon;
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {paymentStatusText[status] || sale.paymentStatus}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإنشاء</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {sale.createdAt ? formatTableDate(sale.createdAt) : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">آخر تحديث</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">
                        {sale.updatedAt ? formatTableDate(sale.updatedAt) : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Summary Card */}
            <Card padding="lg">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">الملخص المالي</h3>
                </div>

                <div className="space-y-3">
                  {/* Subtotal */}
                  {sale.subtotal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المجموع الفرعي</span>
                      <span className="font-medium text-gray-900">{formatCurrency(sale.subtotal)}</span>
                    </div>
                  )}

                  {/* Discount */}
                  {((sale.discountAmount && sale.discountAmount > 0) || (sale.discountPercent && sale.discountPercent > 0)) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        الخصم {sale.discountPercent ? `(${sale.discountPercent}%)` : ''}
                      </span>
                      <span className="font-medium text-red-600">-{formatCurrency(sale.discountAmount || 0)}</span>
                    </div>
                  )}

                  {/* Tax */}
                  {sale.taxAmount && sale.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        الضريبة {sale.taxRate ? `(${sale.taxRate}%)` : ''}
                      </span>
                      <span className="font-medium text-gray-900">+{formatCurrency(sale.taxAmount)}</span>
                    </div>
                  )}

                  {/* Additional Fee */}
                  {sale.additionalFee && sale.additionalFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {sale.additionalFeeLabel || "رسوم إضافية"}
                      </span>
                      <span className="font-medium text-gray-900">+{formatCurrency(sale.additionalFee)}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">المجموع الكلي</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(sale.totalAmount)}
                    </span>
                  </div>

                  {/* Paid Amount & Remaining */}
                  {sale.paymentStatus !== 'PAID' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">المبلغ المدفوع</span>
                        <span className="font-medium text-green-600">{formatCurrency(sale.paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">المبلغ المتبقي</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency((sale.totalAmount || 0) - (sale.paidAmount || 0))}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Profit Section */}
                  {sale.totalProfit !== undefined && sale.totalProfit !== null && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg">
                        <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          صافي الربح
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(sale.totalProfit)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Items Count */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">عدد المنتجات</p>
                      <p className="text-xl font-bold text-gray-900">{sale.items?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">إجمالي الكمية</p>
                      <p className="text-xl font-bold text-gray-900">
                        {sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sale Items Section */}
          <Card padding="lg">
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mr-3">منتجات الفاتورة</h3>
              </div>

              {sale.items && sale.items.length > 0 ? (
                (() => {
                  // Check if any item has cost/profit data
                  const showCostProfit = sale.items.some((item: any) => item.costPrice !== undefined && item.costPrice !== null);
                  const colSpan = showCostProfit ? 5 : 3;

                  return (
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
                            {showCostProfit && (
                              <>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  التكلفة
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  الربح
                                </th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sale.items.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.product?.name || 'منتج غير محدد'}
                                  </div>
                                  {item.product?.sku && (
                                    <div className="text-sm text-gray-500">
                                      SKU: {item.product.sku}
                                    </div>
                                  )}
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
                              {showCostProfit && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {formatCurrency(item.costPrice * item.quantity)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                                    {formatCurrency(item.profit || (item.totalPrice - (item.costPrice * item.quantity)))}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          {sale.additionalFee && sale.additionalFee > 0 && (
                            <tr>
                              <td colSpan={colSpan} className="px-6 py-2 text-right text-sm text-gray-600">
                                {sale.additionalFeeLabel || "رسوم إضافية"}:
                              </td>
                              <td className="px-6 py-2 text-sm font-medium text-gray-900">
                                {formatCurrency(sale.additionalFee)}
                              </td>
                              {showCostProfit && <td></td>}
                            </tr>
                          )}
                          <tr>
                            <td colSpan={colSpan} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                              المجموع الكلي:
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">
                              {formatCurrency(sale.totalAmount)}
                            </td>
                            {showCostProfit && (
                              <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                {formatCurrency(sale.totalProfit || 0)}
                              </td>
                            )}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد منتجات في هذه الفاتورة</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Hidden PDF Content - This will be captured for PDF generation */}
        <div className="fixed left-[-9999px] top-0">
          <div ref={pdfContentRef} className="w-[210mm] bg-white p-8" dir="rtl">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                {/* Company Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs mb-1">SellX</p>
                    <h1 className="text-2xl font-bold mb-2">{company?.name || "SellX"}</h1>
                    <div className="space-y-1 text-white/90 text-sm">
                      {company?.address && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {company.address}
                        </p>
                      )}
                      {company?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {company.phone}
                        </p>
                      )}
                      {company?.email && (
                        <p className="flex items-center gap-2">
                          <MailIcon className="w-4 h-4" />
                          {company.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Receipt Number Badge */}
                <div className="text-left">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                    <p className="text-white/80 text-sm mb-1">فاتورة بيع</p>
                    <p className="text-xl font-bold">{sale?.receiptNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sale Details Section */}
            <div className="p-6 border border-t-0 border-gray-200 rounded-b-xl">
              {/* Info Cards Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Sale Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">معلومات الفاتورة</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">التاريخ:</span>
                      <span className="font-medium text-gray-900">{sale?.saleDate ? formatTableDate(sale.saleDate) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">الوقت:</span>
                      <span className="font-medium text-gray-900">
                        {sale?.saleDate ? new Date(sale.saleDate).toLocaleTimeString('ar-SA') : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">معلومات العميل</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">الاسم:</span>
                      <span className="font-medium text-gray-900">{sale?.client?.name || "عميل نقدي"}</span>
                    </div>
                    {sale?.client?.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">الهاتف:</span>
                        <span className="font-medium text-gray-900">{sale.client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">طريقة الدفع</h3>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        sale?.paymentMethod === "CASH"
                          ? "bg-green-100 text-green-700"
                          : sale?.paymentMethod === "CARD"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {sale?.paymentMethod === "CASH" && "نقدي"}
                      {sale?.paymentMethod === "CARD" && "بطاقة"}
                      {sale?.paymentMethod === "CREDIT" && "آجل"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-primary-600 rounded-full"></span>
                  تفاصيل المنتجات
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                        <th className="px-3 py-3 text-right font-semibold text-sm">#</th>
                        <th className="px-3 py-3 text-right font-semibold text-sm">المنتج</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">الكمية</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">سعر الوحدة</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale?.items?.map((item: any, index: number) => (
                        <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="px-3 py-3">
                            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{item.product?.name || 'منتج'}</div>
                              {item.product?.sku && <div className="text-xs text-gray-500 mt-1">SKU: {item.product.sku}</div>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-6 bg-primary-100 text-primary-700 rounded-lg font-medium text-sm">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700 text-sm">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gray-900 text-sm">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-md">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-base font-bold text-gray-900 mb-3">ملخص الفاتورة</h3>
                    <div className="space-y-2">
                      {sale?.additionalFee && sale.additionalFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{sale.additionalFeeLabel || "رسوم إضافية"}:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(sale.additionalFee)}
                          </span>
                        </div>
                      )}
                      <div className="border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">المجموع الكلي:</span>
                          <span className="text-xl font-bold text-primary-600">
                            {formatCurrency(sale?.totalAmount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 pt-6">
                {/* Thank You Message */}
                <div className="text-center bg-gradient-to-r from-primary-50 via-primary-50 to-primary-50 rounded-xl p-4 border border-primary-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">شكراً لاختياركم {company?.name || "خدماتنا"}</h4>
                  <p className="text-gray-600 text-sm">نتطلع لخدمتكم مرة أخرى</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                    {company?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {company.phone}
                      </span>
                    )}
                    {company?.email && (
                      <span className="flex items-center gap-1">
                        <MailIcon className="w-3 h-3" />
                        {company.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* SellX Signature */}
                <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400">
                    تم إنشاء هذا المستند بواسطة نظام <span className="font-semibold text-primary-600">SellX</span> لإدارة نقاط البيع
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesDetails;
