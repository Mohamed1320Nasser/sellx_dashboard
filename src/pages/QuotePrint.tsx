import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, Download, Mail, Building2, Phone, Mail as MailIcon, MapPin, Calendar, FileText, User, CheckCircle } from "lucide-react";
import { Button } from "../components/ui";
import { useQuote } from "../hooks/api/useQuotes";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { formatTableDate } from "../utils/dateUtils";

const QuotePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || company?.company?.id || 0;
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: quoteData, isLoading, error } = useQuote(id || "", companyId);

  useEffect(() => {
    if (isPrinting) {
      window.print();
      setIsPrinting(false);
    }
  }, [isPrinting]);

  const handlePrint = () => {
    setIsPrinting(true);
  };

  const handleBack = () => {
    navigate("/quotes");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg">جاري تحميل العرض السعري...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
          <p className="text-gray-600 mb-6">لم يتم العثور على العرض السعري</p>
          <Button onClick={handleBack} variant="outline" className="px-6">
            العودة للعروض السعرية
          </Button>
        </div>
      </div>
    );
  }

  const quote = quoteData;
  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white shadow-md border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Print Content */}
      <div className="max-w-5xl mx-auto py-8 px-4 print:py-0 print:px-0 print:max-w-none">
        <div className="bg-white shadow-2xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-8 print:p-6">
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative flex justify-between items-start">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center print:w-16 print:h-16">
                  <Building2 className="w-10 h-10 text-white print:w-8 print:h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2 print:text-2xl">{company?.name || "SellX"}</h1>
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
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 print:px-4 print:py-3">
                  <p className="text-white/80 text-sm mb-1">عرض سعري</p>
                  <p className="text-2xl font-bold print:text-xl">{quote.quoteNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details Section */}
          <div className="p-8 print:p-6">
            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4 print:mb-6">
              {/* Quote Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 print:p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center print:w-8 print:h-8">
                    <FileText className="w-5 h-5 text-indigo-600 print:w-4 print:h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900">معلومات العرض</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">التاريخ:</span>
                    <span className="font-medium text-gray-900">{formatTableDate(quote.createdAt)}</span>
                  </div>
                  {quote.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">صالح حتى:</span>
                      <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTableDate(quote.validUntil)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">العملة:</span>
                    <span className="font-medium text-gray-900">{quote.currency}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 print:p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center print:w-8 print:h-8">
                    <User className="w-5 h-5 text-emerald-600 print:w-4 print:h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900">معلومات العميل</h3>
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
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 print:p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center print:w-8 print:h-8">
                    <CheckCircle className="w-5 h-5 text-amber-600 print:w-4 print:h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900">حالة العرض</h3>
                </div>
                <div className="space-y-2">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    quote.status === 'DRAFT' ? 'bg-gray-200 text-gray-700' :
                    quote.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                    quote.status === 'PRINTED' ? 'bg-purple-100 text-purple-700' :
                    quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {quote.status === "DRAFT" && "مسودة"}
                    {quote.status === "SENT" && "مرسل"}
                    {quote.status === "PRINTED" && "مطبوع"}
                    {quote.status === "ACCEPTED" && "مقبول"}
                    {quote.status === "REJECTED" && "مرفوض"}
                  </div>
                  {isExpired && quote.status !== 'ACCEPTED' && (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 mr-2">
                      منتهي الصلاحية
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-base print:mb-3">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full print:h-5"></span>
                تفاصيل المنتجات
              </h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                      <th className="px-4 py-4 text-right font-semibold print:py-3 print:px-3 print:text-sm">#</th>
                      <th className="px-4 py-4 text-right font-semibold print:py-3 print:px-3 print:text-sm">المنتج</th>
                      <th className="px-4 py-4 text-center font-semibold print:py-3 print:px-3 print:text-sm">الكمية</th>
                      <th className="px-4 py-4 text-center font-semibold print:py-3 print:px-3 print:text-sm">سعر الوحدة</th>
                      <th className="px-4 py-4 text-center font-semibold print:py-3 print:px-3 print:text-sm">الخصم</th>
                      <th className="px-4 py-4 text-center font-semibold print:py-3 print:px-3 print:text-sm">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items?.map((item, index) => (
                      <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 transition-colors`}>
                        <td className="px-4 py-4 print:py-3 print:px-3">
                          <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 print:w-6 print:h-6 print:text-xs">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 print:py-3 print:px-3">
                          <div>
                            <div className="font-medium text-gray-900 print:text-sm">{item.productName}</div>
                            {item.productSku && (
                              <div className="text-xs text-gray-500 mt-1">SKU: {item.productSku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center print:py-3 print:px-3">
                          <span className="inline-flex items-center justify-center w-10 h-8 bg-indigo-100 text-indigo-700 rounded-lg font-medium print:text-sm print:w-8 print:h-6">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700 print:py-3 print:px-3 print:text-sm">
                          {item.unitPrice.toFixed(2)} {quote.currency}
                        </td>
                        <td className="px-4 py-4 text-center print:py-3 print:px-3 print:text-sm">
                          {item.lineDiscount > 0 ? (
                            <span className="text-green-600 font-medium">-{item.lineDiscount.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-gray-900 print:py-3 print:px-3 print:text-sm">
                          {item.lineTotal.toFixed(2)} {quote.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Section */}
            <div className="flex justify-end mb-8 print:mb-6">
              <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 print:p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 print:text-base print:mb-3">ملخص العرض السعري</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المجموع الفرعي:</span>
                      <span className="font-medium text-gray-900">{quote.subtotal.toFixed(2)} {quote.currency}</span>
                    </div>
                    {quote.totalDiscount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">إجمالي الخصومات:</span>
                        <span className="font-medium text-green-600">-{quote.totalDiscount.toFixed(2)} {quote.currency}</span>
                      </div>
                    )}
                    {quote.taxPercent > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">الضريبة ({quote.taxPercent}%):</span>
                        <span className="font-medium text-gray-900">{quote.taxAmount.toFixed(2)} {quote.currency}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900 print:text-lg">المجموع الكلي:</span>
                        <span className="text-2xl font-bold text-indigo-600 print:text-xl">{quote.total.toFixed(2)} {quote.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {quote.notes && (
              <div className="mb-8 print:mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-base print:mb-3">
                  <span className="w-1.5 h-6 bg-amber-500 rounded-full print:h-5"></span>
                  ملاحظات
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 print:p-4">
                  <p className="text-gray-700 whitespace-pre-wrap print:text-sm">{quote.notes}</p>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-base print:mb-3">
                <span className="w-1.5 h-6 bg-gray-400 rounded-full print:h-5"></span>
                الشروط والأحكام
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 print:p-4">
                <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside print:text-xs">
                  <li>الأسعار المذكورة صالحة خلال فترة صلاحية العرض فقط</li>
                  <li>يتم احتساب الضريبة وفقاً للقوانين المعمول بها</li>
                  <li>قد تتغير الأسعار دون إشعار مسبق بعد انتهاء صلاحية العرض</li>
                  <li>التوصيل والتركيب غير مشمولين إلا إذا تم ذكرهما صراحة</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-8 print:pt-6">
              <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4 print:mb-6">
                {/* Signature - Company */}
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 h-16 mb-3 print:h-12"></div>
                  <p className="text-gray-600 font-medium print:text-sm">توقيع المسؤول</p>
                  <p className="text-gray-400 text-sm print:text-xs">{company?.name || "SellX"}</p>
                </div>
                {/* Signature - Customer */}
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 h-16 mb-3 print:h-12"></div>
                  <p className="text-gray-600 font-medium print:text-sm">توقيع العميل</p>
                  <p className="text-gray-400 text-sm print:text-xs">{quote.customerName || "العميل"}</p>
                </div>
              </div>

              {/* Thank You Message */}
              <div className="text-center bg-gradient-to-r from-primary-50 via-primary-50 to-primary-50 rounded-xl p-6 border border-primary-100 print:p-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2 print:text-lg">شكراً لاختياركم {company?.name || "خدماتنا"}</h4>
                <p className="text-gray-600 print:text-sm">نتطلع للتعامل معكم</p>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500 print:gap-4 print:text-xs">
                  {company?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </span>
                  )}
                  {company?.email && (
                    <span className="flex items-center gap-1">
                      <MailIcon className="w-4 h-4" />
                      {company.email}
                    </span>
                  )}
                </div>
              </div>

              {/* SellX Signature */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center print:mt-4 print:pt-3">
                <p className="text-sm text-gray-400 print:text-xs">
                  تم إنشاء هذا المستند بواسطة نظام <span className="font-semibold text-primary-600">SellX</span> لإدارة نقاط البيع
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html, body {
            width: 210mm;
            height: 297mm;
          }

          .print\\:hidden {
            display: none !important;
          }

          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bg-gradient-to-br,
          .bg-gradient-to-r {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .shadow-2xl {
            box-shadow: none !important;
          }

          .rounded-2xl {
            border-radius: 0 !important;
          }

          /* Ensure colors print correctly */
          .from-indigo-600,
          .via-purple-600,
          .to-indigo-700 {
            background: linear-gradient(to bottom right, #4f46e5, #7c3aed, #4338ca) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .from-gray-800,
          .to-gray-900 {
            background: linear-gradient(to right, #1f2937, #111827) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Table styling */
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          /* Ensure backgrounds print */
          .bg-gray-50,
          .bg-gradient-to-br,
          .bg-indigo-100,
          .bg-emerald-100,
          .bg-amber-100,
          .bg-amber-50 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuotePrint;
