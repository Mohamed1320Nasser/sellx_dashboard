import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, FileText, Eye, Printer, Mail, CheckCircle, Clock, XCircle, Calendar, User, FileDown, ShoppingCart, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Modal, DataTable, Badge } from "../components/ui";
import type { Column, TableFilter } from "../components/ui/DataTable";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useQuotes,
  useDeleteQuote,
  usePrintQuote,
  useConvertQuoteToSale,
  useEmailQuote,
  useGenerateQuotePdf,
} from "../hooks/api/useQuotes";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyUtils";
import { printReceipt } from "../services/printService";
import toast from "react-hot-toast";
import type { Quote } from "../types";

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);

  // API hooks
  const { data: quotesData, isLoading } = useQuotes({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
  });

  const deleteMutation = useDeleteQuote();
  const printMutation = usePrintQuote();
  const convertToSaleMutation = useConvertQuoteToSale();
  const emailMutation = useEmailQuote();
  const generatePdfMutation = useGenerateQuotePdf();

  // Helper function to check if quote is expired
  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  // Table columns
  const columns: Column<Quote>[] = [
    {
      key: "quoteNumber",
      label: "رقم العرض",
      render: (quote: Quote) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-indigo-600">{quote.quoteNumber}</span>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "العميل",
      render: (quote: Quote) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {(quote.customerName || "غ")[0]}
          </div>
          <span className="font-medium text-gray-900 text-sm">{quote.customerName || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "items",
      label: "الأصناف",
      render: (quote: Quote) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Package className="w-4 h-4" />
          <span className="font-medium">{quote.items?.length || 0}</span>
        </div>
      ),
    },
    {
      key: "total",
      label: "المبلغ",
      render: (quote: Quote) => (
        <span className="font-bold text-gray-900">
          {formatCurrency(quote.total)}
        </span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (quote: Quote) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error'; icon: React.ReactNode }> = {
          DRAFT: { label: "مسودة", variant: "default", icon: <Clock className="w-3 h-3 ml-1" /> },
          SENT: { label: "مرسل", variant: "primary", icon: <Mail className="w-3 h-3 ml-1" /> },
          PRINTED: { label: "مطبوع", variant: "success", icon: <Printer className="w-3 h-3 ml-1" /> },
          ACCEPTED: { label: "مقبول", variant: "success", icon: <CheckCircle className="w-3 h-3 ml-1" /> },
          REJECTED: { label: "مرفوض", variant: "error", icon: <XCircle className="w-3 h-3 ml-1" /> },
        };
        const status = statusMap[quote.status] || statusMap.DRAFT;

        // Check for special states
        if (quote.convertedToSaleId) {
          return (
            <Badge variant="success">
              <ShoppingCart className="w-3 h-3 ml-1" />
              تم البيع
            </Badge>
          );
        }

        if (isExpired(quote.validUntil) && quote.status !== "ACCEPTED" && quote.status !== "REJECTED") {
          return (
            <Badge variant="error">
              <AlertTriangle className="w-3 h-3 ml-1" />
              منتهي
            </Badge>
          );
        }

        return (
          <Badge variant={status.variant}>
            {status.icon}
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "validUntil",
      label: "صالح حتى",
      render: (quote: Quote) => {
        if (!quote.validUntil) return <span className="text-gray-400 text-sm">-</span>;
        const expired = isExpired(quote.validUntil);
        return (
          <span className={`text-sm ${expired ? "text-red-600 font-medium" : "text-gray-600"}`}>
            {formatTableDate(quote.validUntil)}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "التاريخ",
      render: (quote: Quote) => (
        <span className="text-gray-600 text-sm">
          {formatTableDate(quote.createdAt)}
        </span>
      ),
    },
  ];

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العرض السعري؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrintA4 = (quote: Quote) => {
    // Open A4 print view in new tab
    window.open(`/quotes/${quote.id}/print`, '_blank');
  };

  const handleConvertToSale = (quote: Quote) => {
    setConvertingQuote(quote);
  };

  const confirmConvertToSale = () => {
    if (convertingQuote) {
      const companyId = company?.companyId || 0;
      convertToSaleMutation.mutate({ id: convertingQuote.id, companyId }, {
        onSuccess: (data: any) => {
          setConvertingQuote(null);
          // Success toast is handled by useConvertQuoteToSale hook
          // Navigate to the new sale
          if (data?.data?.saleId) {
            navigate(`/sales/${data.data.saleId}`);
          }
        },
        onError: () => {
          // Error toast is handled by useConvertQuoteToSale hook via useApiErrorHandler
          setConvertingQuote(null);
        }
      });
    }
  };

  const handleEmailQuote = (id: string) => {
    const companyId = company?.companyId || 0;
    emailMutation.mutate({ id, companyId });
  };

  const handlePrintThermal = async (quote: Quote) => {
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
      };

      await printReceipt({
        sale: receiptData,
        company: company?.company || { name: 'POS System' },
        cashier: { name: 'Quote' }
      });

      toast.success('تم طباعة العرض السعري');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('فشل في الطباعة');
    }
  };

  const statusOptions = useMemo(() => [
    { value: "", label: "جميع الحالات" },
    { value: "DRAFT", label: "مسودة" },
    { value: "SENT", label: "مرسل" },
    { value: "PRINTED", label: "مطبوع" },
    { value: "ACCEPTED", label: "مقبول" },
    { value: "REJECTED", label: "مرفوض" },
  ], []);

  // Filter handlers
  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("");
    setCurrentPage(1);
  }, []);

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'status',
      label: 'الحالة',
      type: 'select',
      options: statusOptions,
      value: statusFilter,
      onChange: (value) => handleStatusFilter(value as string),
    },
  ], [statusOptions, statusFilter, handleStatusFilter]);

  // Calculate statistics
  const quotesList = quotesData?.data?.list || [];
  const totalQuotes = quotesData?.data?.totalCount || 0;
  const totalValue = quotesList.reduce((sum: number, quote: any) => sum + (Number(quote.total) || 0), 0);
  const draftQuotes = quotesList.filter((q: any) => q.status === 'DRAFT').length;
  const acceptedQuotes = quotesList.filter((q: any) => q.status === 'ACCEPTED').length;
  const rejectedQuotes = quotesList.filter((q: any) => q.status === 'REJECTED').length;
  const convertedQuotes = quotesList.filter((q: any) => q.convertedToSaleId).length;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">العروض السعرية</h1>
            <p className="text-gray-600 mt-1">إدارة العروض السعرية للعملاء</p>
          </div>
          <Button
            onClick={() => navigate('/quotes/create')}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>عرض سعري جديد</span>
          </Button>
        </div>

        {/* Summary Cards - 2 rows, 3 cards each */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Row 1 - Main Stats */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">العروض</p>
                <p className="text-lg font-bold text-gray-900">{totalQuotes}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">القيمة</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">تم البيع</p>
                <p className="text-lg font-bold text-green-600">{convertedQuotes}</p>
              </div>
            </div>
          </Card>

          {/* Row 2 - Status Stats */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">مسودة</p>
                <p className="text-lg font-bold text-gray-600">{draftQuotes}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">مقبول</p>
                <p className="text-lg font-bold text-green-600">{acceptedQuotes}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">مرفوض</p>
                <p className="text-lg font-bold text-red-600">{rejectedQuotes}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quotes Table with integrated search and filters */}
        <DataTable<Quote>
          title="جميع عروض الأسعار"
          columns={columns}
          data={quotesData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في عروض الأسعار (رقم العرض، اسم العميل...)"
          onSearch={handleSearch}
          filters={tableFilters}
          onClearFilters={handleClearFilters}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (quote) => navigate(`/quotes/${quote.id}`),
              variant: "primary",
            },
            {
              icon: ShoppingCart,
              label: "تحويل لفاتورة بيع",
              onClick: (quote) => handleConvertToSale(quote),
              variant: "success",
              show: (quote) => !quote.convertedToSaleId && quote.status !== "REJECTED",
            },
            {
              icon: Mail,
              label: "إرسال بالبريد",
              onClick: (quote) => handleEmailQuote(quote.id),
              variant: "primary",
              show: (quote) => quote.customerEmail && quote.status === "DRAFT",
            },
            {
              icon: FileDown,
              label: "تحميل PDF",
              onClick: (quote) => generatePdfMutation.mutate({ quote, company }),
              variant: "primary",
            },
            {
              icon: Printer,
              label: "طباعة حرارية",
              onClick: (quote) => handlePrintThermal(quote),
              variant: "primary",
            },
            {
              icon: Edit,
              label: "تعديل",
              onClick: (quote) => navigate(`/quotes/${quote.id}/edit`),
              variant: "warning",
              show: (quote) => !quote.convertedToSaleId,
            },
            {
              icon: Trash2,
              label: "حذف",
              onClick: (quote) => handleDelete(quote.id),
              variant: "danger",
              show: (quote) => !quote.convertedToSaleId,
            },
          ]}
          totalItems={quotesData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد عروض أسعار حتى الآن. قم بإضافة عرض سعري جديد للبدء!"
        />

        {/* Convert to Sale Confirmation Modal */}
        <Modal
          isOpen={!!convertingQuote}
          onClose={() => setConvertingQuote(null)}
          title="تحويل العرض السعري إلى فاتورة بيع"
          size="md"
        >
          {convertingQuote && (
            <div className="space-y-6">
              {/* Quote Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{convertingQuote.quoteNumber}</h3>
                    <p className="text-gray-600">{convertingQuote.customerName || "عميل غير محدد"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="text-gray-900">{convertingQuote.subtotal?.toFixed(2)} {convertingQuote.currency}</span>
                  </div>
                  {convertingQuote.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الخصم:</span>
                      <span className="text-green-600">-{convertingQuote.totalDiscount?.toFixed(2)} {convertingQuote.currency}</span>
                    </div>
                  )}
                  {convertingQuote.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الضريبة ({convertingQuote.taxPercent}%):</span>
                      <span className="text-gray-900">{convertingQuote.taxAmount?.toFixed(2)} {convertingQuote.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-indigo-200">
                    <span className="text-gray-900">المجموع الكلي:</span>
                    <span className="text-indigo-600">{convertingQuote.total?.toFixed(2)} {convertingQuote.currency}</span>
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
                      سيتم إنشاء فاتورة بيع جديدة بنفس تفاصيل العرض السعري.
                      لن يمكن تعديل أو حذف العرض السعري بعد التحويل.
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Preview */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-900">المنتجات ({convertingQuote.items?.length || 0})</h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {convertingQuote.items?.map((item, index) => (
                    <div key={index} className="px-4 py-2 flex justify-between items-center border-b last:border-b-0 hover:bg-gray-50">
                      <div>
                        <span className="text-gray-900">{item.productName}</span>
                        <span className="text-gray-500 text-sm mr-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.lineTotal?.toFixed(2)} {convertingQuote.currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setConvertingQuote(null)}
                >
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
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default Quotes;

