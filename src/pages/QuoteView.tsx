import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  FileDown,
  Mail,
  ShoppingCart,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  Building2,
  Phone,
  Mail as MailIcon,
  MapPin,
  User,
  CheckCircle,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Badge, Modal } from "../components/ui";
import { useQuote, useDeleteQuote, useConvertQuoteToSale, useEmailQuote } from "../hooks/api/useQuotes";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency, formatNumber } from "../utils/currencyUtils";
import { printReceipt } from "../services/printService";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Quote } from "../types";

const QuoteView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || company?.company?.id || 0;
  const [convertingQuote, setConvertingQuote] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const { data: quote, isLoading, error } = useQuote(id || "", companyId);
  const deleteMutation = useDeleteQuote();
  const convertToSaleMutation = useConvertQuoteToSale();
  const emailMutation = useEmailQuote();

  // Helper function to check if quote is expired
  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const handleBack = () => {
    navigate("/quotes");
  };

  const handlePrintA4 = () => {
    window.open(`/quotes/${id}/print`, "_blank");
  };

  const handlePrintThermal = async () => {
    if (!quote) return;

    try {
      // Convert quote to receipt format for printing
      const receiptData = {
        id: quote.id,
        receiptNumber: quote.quoteNumber,
        createdAt: quote.createdAt,
        subtotal: parseFloat(quote.subtotal.toString()),
        discountAmount: parseFloat(quote.totalDiscount?.toString() || '0'),
        taxRate: parseFloat(quote.taxPercent?.toString() || '0'),
        taxAmount: parseFloat(quote.taxAmount?.toString() || '0'),
        total: parseFloat(quote.total.toString()),
        paidAmount: parseFloat(quote.total.toString()),
        items: (quote.items || []).map((item: any) => ({
          productName: item.productName || '',
          quantity: item.quantity || 0,
          unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
          totalPrice: parseFloat(item.lineTotal?.toString() || '0'),
        })),
        company: {
          name: company?.company?.name || '',
          address: company?.company?.address || '',
          phone: company?.company?.phone || '',
        },
        cashier: {
          name: 'Quote',
        },
      };

      await printReceipt({
        sale: receiptData,
        company: company?.company || { name: 'POS System' },
        cashier: { name: 'Quote' }
      });

      toast.success("تم طباعة العرض السعري");
    } catch (error) {
      console.error('Print error:', error);
      toast.error("فشل في الطباعة");
    }
  };

  const formatQuoteForPrint = (quote: Quote): string => {
    const lines = [];
    lines.push("================================");
    lines.push(`       ${company?.name || 'عرض سعري'}       `);
    lines.push("================================");
    lines.push(`رقم العرض: ${quote.quoteNumber}`);
    lines.push(`التاريخ: ${new Date(quote.createdAt).toLocaleDateString("ar-EG")}`);
    lines.push("--------------------------------");

    if (quote.customerName) {
      lines.push(`العميل: ${quote.customerName}`);
    }
    if (quote.customerContact) {
      lines.push(`الهاتف: ${quote.customerContact}`);
    }
    if (quote.customerEmail) {
      lines.push(`البريد: ${quote.customerEmail}`);
    }

    lines.push("================================");
    lines.push("المنتجات:");
    lines.push("--------------------------------");

    quote.items?.forEach((item) => {
      lines.push(`${item.productName}`);
      lines.push(`  ${item.quantity} × ${item.unitPrice} ${quote.currency} = ${item.lineTotal} ${quote.currency}`);
      if (item.lineDiscount > 0) {
        lines.push(`  خصم: ${item.lineDiscount} ${quote.currency}`);
      }
    });

    lines.push("================================");
    lines.push(`المجموع الفرعي: ${quote.subtotal} ${quote.currency}`);

    if (quote.totalDiscount > 0) {
      lines.push(`الخصم: -${quote.totalDiscount} ${quote.currency}`);
    }

    if (quote.taxAmount > 0) {
      lines.push(`الضريبة (${quote.taxPercent}%): ${quote.taxAmount} ${quote.currency}`);
    }

    lines.push("--------------------------------");
    lines.push(`المجموع الكلي: ${quote.total} ${quote.currency}`);
    lines.push("================================");

    if (quote.validUntil) {
      lines.push(`صالح حتى: ${new Date(quote.validUntil).toLocaleDateString("ar-EG")}`);
    }

    if (quote.notes) {
      lines.push("ملاحظات:");
      lines.push(quote.notes);
    }

    lines.push("");
    lines.push(`شكراً لتعاملكم مع ${company?.name || 'شركتنا'}!`);
    lines.push("--------------------------------");
    lines.push("نظام SellX لنقاط البيع");
    lines.push("");

    return lines.join("\n");
  };

  const handleEmailQuote = () => {
    if (id && companyId) {
      emailMutation.mutate({ id, companyId });
    }
  };

  const handleEdit = () => {
    navigate(`/quotes`);
  };

  const handleDelete = () => {
    if (id && window.confirm("هل أنت متأكد من حذف هذا العرض السعري؟")) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          navigate("/quotes");
        },
      });
    }
  };

  const handleConvertToSale = () => {
    setConvertingQuote(true);
  };

  const confirmConvertToSale = () => {
    if (id && companyId) {
      convertToSaleMutation.mutate(
        { id, companyId },
        {
          onSuccess: (data: any) => {
            setConvertingQuote(false);
            if (data?.data?.saleId) {
              navigate(`/sales/${data.data.saleId}`);
            }
          },
          onError: () => {
            setConvertingQuote(false);
          },
        }
      );
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote || !pdfContentRef.current) {
      toast.error("لا توجد بيانات للتحميل");
      return;
    }

    setIsGeneratingPDF(true);
    const loadingToast = toast.loading("جاري إنشاء ملف PDF...");

    try {
      // Create the PDF content element
      const pdfElement = pdfContentRef.current;

      // Use html2canvas to capture the content
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Calculate dimensions for A4 paper
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to first page
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add more pages if needed
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

      // Save the PDF
      pdf.save(`عرض-سعري-${quote.quoteNumber}.pdf`);

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

  // Loading state - skeleton like SalesDetails
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

  // Error state - no company ID
  if (!companyId) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في البيانات</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على معرف الشركة</p>
            <Button onClick={handleBack}>العودة إلى قائمة العروض السعرية</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل العرض السعري</h2>
            <p className="text-gray-600 mb-4">{(error as any)?.message || "حدث خطأ أثناء تحميل بيانات العرض السعري"}</p>
            <div className="text-sm text-gray-500 mb-4">
              <p>معرف العرض: {id}</p>
              <p>معرف الشركة: {companyId}</p>
            </div>
            <Button onClick={handleBack}>العودة إلى قائمة العروض السعرية</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!quote) {
    return (
      <Layout>
        <div className="w-full space-y-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">العرض السعري غير موجود</h2>
            <p className="text-gray-600 mb-4">لم يتم العثور على العرض السعري المطلوب</p>
            <Button onClick={handleBack}>العودة إلى قائمة العروض السعرية</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const expired = isExpired(quote.validUntil);

  const statusMap: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "error" }> = {
    DRAFT: { label: "مسودة", variant: "default" },
    SENT: { label: "مرسل", variant: "primary" },
    PRINTED: { label: "مطبوع", variant: "success" },
    ACCEPTED: { label: "مقبول", variant: "success" },
    REJECTED: { label: "مرفوض", variant: "error" },
  };
  const status = statusMap[quote.status] || statusMap.DRAFT;

  const statusColor: Record<string, string> = {
    DRAFT: "text-gray-600 bg-gray-50",
    SENT: "text-blue-600 bg-blue-50",
    PRINTED: "text-green-600 bg-green-50",
    ACCEPTED: "text-green-600 bg-green-50",
    REJECTED: "text-red-600 bg-red-50",
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
              <h1 className="text-2xl font-bold text-gray-900">عرض سعري رقم {quote.quoteNumber}</h1>
              <p className="text-gray-500 text-sm">تفاصيل العرض السعري</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button onClick={handlePrintThermal} variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
              <Printer className="w-4 h-4 ml-1" />
              طباعة حرارية
            </Button>
            <Button onClick={handlePrintA4} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <FileDown className="w-4 h-4 ml-1" />
              طباعة A4
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
            {quote.customerEmail && quote.status === "DRAFT" && (
              <Button
                onClick={handleEmailQuote}
                variant="outline"
                size="sm"
                disabled={emailMutation.isPending}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Mail className="w-4 h-4 ml-1" />
                {emailMutation.isPending ? "جاري الإرسال..." : "إرسال بالبريد"}
              </Button>
            )}
            {!quote.convertedToSaleId && quote.status !== "REJECTED" && (
              <Button onClick={handleConvertToSale} size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <ShoppingCart className="w-4 h-4 ml-1" />
                تحويل لفاتورة
              </Button>
            )}
          </div>
        </div>

        {/* Quote Overview Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quote Information Card */}
            <Card padding="lg" className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">معلومات العرض السعري</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم العرض</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900 font-mono">{quote.quoteNumber}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[quote.status] || "text-gray-600 bg-gray-50"
                        }`}
                      >
                        {status.label}
                      </span>
                      {expired && quote.status !== "ACCEPTED" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-50 mr-2">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          منتهي الصلاحية
                        </span>
                      )}
                      {quote.convertedToSaleId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50 mr-2">
                          تم التحويل
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">{quote.customerName || "غير محدد"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">{quote.customerContact || "-"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">{quote.customerEmail || "-"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العملة</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">{quote.currency}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإنشاء</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-gray-900">{quote.createdAt ? formatTableDate(quote.createdAt) : "غير محدد"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">صالح حتى</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className={expired ? "text-red-600 font-medium" : "text-gray-900"}>
                        {quote.validUntil ? formatTableDate(quote.validUntil) : "غير محدد"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {quote.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <p className="text-gray-900 whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                  </div>
                )}
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المجموع الفرعي</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-lg font-medium text-gray-900">
                        {formatCurrency(quote.subtotal)} {quote.currency}
                      </span>
                    </div>
                  </div>

                  {quote.totalDiscount > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي الخصومات</label>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <span className="text-lg font-medium text-green-600">
                          -{formatCurrency(quote.totalDiscount)} {quote.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {quote.taxPercent > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الضريبة ({quote.taxPercent}%)</label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <span className="text-lg font-medium text-gray-900">
                          {formatCurrency(quote.taxAmount)} {quote.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {(quote as any).additionalFee > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {(quote as any).additionalFeeLabel || "رسوم إضافية"}
                      </label>
                      <div className="bg-gray-50 rounded-lg p-3 border">
                        <span className="text-lg font-medium text-gray-900">
                          {formatCurrency((quote as any).additionalFee)} {quote.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المجموع الكلي</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(quote.total)} {quote.currency}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عدد المنتجات</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-lg font-semibold text-gray-900">{quote.items?.length || 0}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي الكمية</label>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <span className="text-lg font-semibold text-gray-900">
                        {quote.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {!quote.convertedToSaleId && (
                  <div className="pt-4 border-t space-y-2">
                    <Button variant="outline" onClick={handleEdit} className="w-full justify-center">
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل العرض
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      loading={deleteMutation.isPending}
                      className="w-full justify-center text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف العرض
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quote Items Section */}
          <Card padding="lg">
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mr-3">منتجات العرض السعري</h3>
              </div>

              {quote.items && quote.items.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الخصم</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quote.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.productName || "منتج غير محدد"}</div>
                              {item.productSku && <div className="text-sm text-gray-500">SKU: {item.productSku}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unitPrice)} {quote.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(item.quantity)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.lineDiscount > 0 ? (
                              <span className="text-green-600">
                                -{formatCurrency(item.lineDiscount)} {quote.currency}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.lineTotal)} {quote.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-600">
                          المجموع الفرعي:
                        </td>
                        <td className="px-6 py-2 text-sm font-medium text-gray-900">
                          {formatCurrency(quote.subtotal)} {quote.currency}
                        </td>
                      </tr>
                      {quote.totalDiscount > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-600">
                            إجمالي الخصومات:
                          </td>
                          <td className="px-6 py-2 text-sm font-medium text-green-600">
                            -{formatCurrency(quote.totalDiscount)} {quote.currency}
                          </td>
                        </tr>
                      )}
                      {quote.taxPercent > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-600">
                            الضريبة ({quote.taxPercent}%):
                          </td>
                          <td className="px-6 py-2 text-sm font-medium text-gray-900">
                            {formatCurrency(quote.taxAmount)} {quote.currency}
                          </td>
                        </tr>
                      )}
                      {(quote as any).additionalFee > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-600">
                            {(quote as any).additionalFeeLabel || "رسوم إضافية"}:
                          </td>
                          <td className="px-6 py-2 text-sm font-medium text-gray-900">
                            {formatCurrency((quote as any).additionalFee)} {quote.currency}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          المجموع الكلي:
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          {formatCurrency(quote.total)} {quote.currency}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد منتجات في هذا العرض السعري</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Convert to Sale Confirmation Modal */}
        <Modal isOpen={convertingQuote} onClose={() => setConvertingQuote(false)} title="تحويل العرض السعري إلى فاتورة بيع" size="md">
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{quote.quoteNumber}</h3>
                  <p className="text-gray-600">{quote.customerName || "عميل غير محدد"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="text-gray-900">
                    {formatCurrency(quote.subtotal)} {quote.currency}
                  </span>
                </div>
                {quote.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="text-green-600">
                      -{formatCurrency(quote.totalDiscount)} {quote.currency}
                    </span>
                  </div>
                )}
                {quote.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الضريبة ({quote.taxPercent}%):</span>
                    <span className="text-gray-900">
                      {formatCurrency(quote.taxAmount)} {quote.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-indigo-200">
                  <span className="text-gray-900">المجموع الكلي:</span>
                  <span className="text-indigo-600">
                    {formatCurrency(quote.total)} {quote.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversion Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">ملاحظة مهمة</h4>
                  <p className="text-sm text-amber-700">
                    سيتم إنشاء فاتورة بيع جديدة بنفس تفاصيل العرض السعري. لن يمكن تعديل أو حذف العرض السعري بعد التحويل.
                  </p>
                </div>
              </div>
            </div>

            {/* Items Preview */}
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">المنتجات ({quote.items?.length || 0})</h4>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {quote.items?.map((item, index) => (
                  <div key={index} className="px-4 py-2 flex justify-between items-center border-b last:border-b-0 hover:bg-gray-50">
                    <div>
                      <span className="text-gray-900">{item.productName}</span>
                      <span className="text-gray-500 text-sm mr-2">× {item.quantity}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(item.lineTotal)} {quote.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setConvertingQuote(false)}>
                إلغاء
              </Button>
              <Button
                onClick={confirmConvertToSale}
                loading={convertToSaleMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <ShoppingCart className="w-4 h-4 ml-2" />
                تأكيد التحويل لفاتورة بيع
              </Button>
            </div>
          </div>
        </Modal>

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

                {/* Quote Number Badge */}
                <div className="text-left">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                    <p className="text-white/80 text-sm mb-1">عرض سعري</p>
                    <p className="text-xl font-bold">{quote.quoteNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Details Section */}
            <div className="p-6 border border-t-0 border-gray-200 rounded-b-xl">
              {/* Info Cards Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Quote Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">معلومات العرض</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">التاريخ:</span>
                      <span className="font-medium text-gray-900">{formatTableDate(quote.createdAt)}</span>
                    </div>
                    {quote.validUntil && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">صالح حتى:</span>
                        <span className={`font-medium ${expired ? "text-red-600" : "text-gray-900"}`}>{formatTableDate(quote.validUntil)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">العملة:</span>
                      <span className="font-medium text-gray-900">{quote.currency}</span>
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
                      <span className="font-medium text-gray-900">{quote.customerName || "غير محدد"}</span>
                    </div>
                    {quote.customerContact && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">الهاتف:</span>
                        <span className="font-medium text-gray-900">{quote.customerContact}</span>
                      </div>
                    )}
                    {quote.customerEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">البريد:</span>
                        <span className="font-medium text-gray-900 text-xs">{quote.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">حالة العرض</h3>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        quote.status === "DRAFT"
                          ? "bg-gray-200 text-gray-700"
                          : quote.status === "SENT"
                          ? "bg-blue-100 text-blue-700"
                          : quote.status === "PRINTED"
                          ? "bg-purple-100 text-purple-700"
                          : quote.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {quote.status === "DRAFT" && "مسودة"}
                      {quote.status === "SENT" && "مرسل"}
                      {quote.status === "PRINTED" && "مطبوع"}
                      {quote.status === "ACCEPTED" && "مقبول"}
                      {quote.status === "REJECTED" && "مرفوض"}
                    </div>
                    {expired && quote.status !== "ACCEPTED" && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 mr-2">
                        منتهي الصلاحية
                      </div>
                    )}
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
                        <th className="px-3 py-3 text-center font-semibold text-sm">الخصم</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items?.map((item, index) => (
                        <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="px-3 py-3">
                            <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{item.productName}</div>
                              {item.productSku && <div className="text-xs text-gray-500 mt-1">SKU: {item.productSku}</div>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-6 bg-primary-100 text-primary-700 rounded-lg font-medium text-sm">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-700 text-sm">
                            {item.unitPrice.toFixed(2)} {quote.currency}
                          </td>
                          <td className="px-3 py-3 text-center text-sm">
                            {item.lineDiscount > 0 ? (
                              <span className="text-green-600 font-medium">-{item.lineDiscount.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gray-900 text-sm">
                            {item.lineTotal.toFixed(2)} {quote.currency}
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
                    <h3 className="text-base font-bold text-gray-900 mb-3">ملخص العرض السعري</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">المجموع الفرعي:</span>
                        <span className="font-medium text-gray-900">
                          {quote.subtotal.toFixed(2)} {quote.currency}
                        </span>
                      </div>
                      {quote.totalDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">إجمالي الخصومات:</span>
                          <span className="font-medium text-green-600">
                            -{quote.totalDiscount.toFixed(2)} {quote.currency}
                          </span>
                        </div>
                      )}
                      {quote.taxPercent > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">الضريبة ({quote.taxPercent}%):</span>
                          <span className="font-medium text-gray-900">
                            {quote.taxAmount.toFixed(2)} {quote.currency}
                          </span>
                        </div>
                      )}
                      {(quote as any).additionalFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{(quote as any).additionalFeeLabel || "رسوم إضافية"}:</span>
                          <span className="font-medium text-gray-900">
                            {((quote as any).additionalFee).toFixed(2)} {quote.currency}
                          </span>
                        </div>
                      )}
                      <div className="border-t-2 border-dashed border-gray-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">المجموع الكلي:</span>
                          <span className="text-xl font-bold text-primary-600">
                            {quote.total.toFixed(2)} {quote.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {quote.notes && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
                    ملاحظات
                  </h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{quote.notes}</p>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gray-400 rounded-full"></span>
                  الشروط والأحكام
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <ul className="space-y-1 text-xs text-gray-600 list-disc list-inside">
                    <li>الأسعار المذكورة صالحة خلال فترة صلاحية العرض فقط</li>
                    <li>يتم احتساب الضريبة وفقاً للقوانين المعمول بها</li>
                    <li>قد تتغير الأسعار دون إشعار مسبق بعد انتهاء صلاحية العرض</li>
                    <li>التوصيل والتركيب غير مشمولين إلا إذا تم ذكرهما صراحة</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Signature - Company */}
                  <div className="text-center">
                    <div className="border-b-2 border-gray-300 h-12 mb-2"></div>
                    <p className="text-gray-600 font-medium text-sm">توقيع المسؤول</p>
                    <p className="text-gray-400 text-xs">{company?.name || "SellX"}</p>
                  </div>
                  {/* Signature - Customer */}
                  <div className="text-center">
                    <div className="border-b-2 border-gray-300 h-12 mb-2"></div>
                    <p className="text-gray-600 font-medium text-sm">توقيع العميل</p>
                    <p className="text-gray-400 text-xs">{quote.customerName || "العميل"}</p>
                  </div>
                </div>

                {/* Thank You Message */}
                <div className="text-center bg-gradient-to-r from-primary-50 via-primary-50 to-primary-50 rounded-xl p-4 border border-primary-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">شكراً لاختياركم {company?.name || "خدماتنا"}</h4>
                  <p className="text-gray-600 text-sm">نتطلع للتعامل معكم</p>
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

export default QuoteView;
