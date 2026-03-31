import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Receipt, ShoppingCart, Download, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, Package, User, Printer, DollarSign } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, DataTable, Badge } from "../components/ui";
import type { Column, TableFilter } from "../components/ui/DataTable";
import type { DateRange } from "../components/filters";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useSales,
  useGenerateReceipt,
} from "../hooks/api/useSales";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyUtils";
import type { Sale, PaymentStatus } from "../types";
import { PrintReceiptPreview } from "../components/printer/PrintReceiptPreview";
import toast from "react-hot-toast";

// Removed schemas and types - now handled in SalesCreate page

// Removed ClientForm component - now handled in SalesCreate page

// Removed SaleItem interface - now handled in SalesCreate page

// Removed SaleForm component - now handled in dedicated SalesCreate page

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const { company, user } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [additionalFeeFilter, setAdditionalFeeFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "" });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printableSale, setPrintableSale] = useState<any>(null);

  // API hooks
  const { data: salesData, isLoading } = useSales({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    paymentMethod: paymentFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    additionalFeeFilter: additionalFeeFilter || undefined,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  });

  // Removed createMutation - now handled in SalesCreate page
  const generateReceiptMutation = useGenerateReceipt();

  // Table columns
  const columns: Column<Sale>[] = [
    {
      key: "receiptNumber",
      label: "رقم الفاتورة",
      render: (sale: Sale) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary-500" />
          <span className="font-bold text-primary-600">#{(sale as any).receiptNumber || sale.id}</span>
        </div>
      ),
    },
    {
      key: "client",
      label: "العميل",
      render: (sale: Sale) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {((sale as any).client?.name || "ع")[0]}
          </div>
          <span className="font-medium text-gray-900 text-sm">{(sale as any).client?.name || "عميل نقدي"}</span>
        </div>
      ),
    },
    {
      key: "items",
      label: "الأصناف",
      render: (sale: Sale) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Package className="w-4 h-4" />
          <span className="font-medium">{(sale as any)._count?.items || (sale as any).items?.length || 0}</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "المبلغ",
      render: (sale: Sale) => {
        const totalAmount = Number((sale as any).totalAmount) || 0;
        const paidAmount = Number((sale as any).paidAmount) || 0;
        const paymentStatus = sale.paymentStatus;

        return (
          <div>
            <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
            {paymentStatus !== 'PAID' && paidAmount > 0 && (
              <div className="text-xs text-amber-600">
                مدفوع: {formatCurrency(paidAmount)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "additionalFee",
      label: "رسوم إضافية",
      render: (sale: Sale) => {
        const additionalFee = Number((sale as any).additionalFee) || 0;
        const additionalFeeLabel = (sale as any).additionalFeeLabel;

        if (additionalFee === 0) {
          return <span className="text-gray-400 text-sm">-</span>;
        }

        return (
          <div className="text-sm">
            <div className="font-semibold text-blue-600">{formatCurrency(additionalFee)}</div>
            {additionalFeeLabel && (
              <div className="text-xs text-gray-500">{additionalFeeLabel}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "paymentMethod",
      label: "الدفع",
      render: (sale: Sale) => {
        const paymentMethod = (sale as any).paymentMethod;
        const methods: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' }> = {
          CASH: { label: "نقدي", variant: "success" },
          CARD: { label: "بطاقة", variant: "primary" },
          CREDIT: { label: "آجل", variant: "warning" },
        };
        const method = methods[paymentMethod] || { label: paymentMethod, variant: "primary" as const };
        return <Badge variant={method.variant}>{method.label}</Badge>;
      },
    },
    {
      key: "paymentStatus",
      label: "الحالة",
      render: (sale: Sale) => {
        const paymentStatus = sale.paymentStatus;
        const statuses: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'error'; icon: React.ReactNode }> = {
          PAID: { label: "مدفوع", variant: "success", icon: <CheckCircle className="w-3 h-3 ml-1" /> },
          PARTIAL: { label: "جزئي", variant: "warning", icon: <Clock className="w-3 h-3 ml-1" /> },
          UNPAID: { label: "غير مدفوع", variant: "error", icon: <AlertCircle className="w-3 h-3 ml-1" /> },
        };
        const status = statuses[paymentStatus] || { label: paymentStatus, variant: "primary" as const, icon: null };
        return (
          <Badge variant={status.variant}>
            {status.icon}
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "user",
      label: "الموظف",
      render: (sale: Sale) => (
        <div className="flex items-center gap-1 text-gray-600 text-sm">
          <User className="w-3 h-3" />
          <span>{(sale as any).user?.fullname || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "التاريخ",
      render: (sale: Sale) => (
        <div className="text-gray-600 text-sm">
          {formatTableDate((sale as any).saleDate || (sale as any).createdAt)}
        </div>
      ),
    },
  ];

  // Handlers
  // Removed handleCreate - now handled in SalesCreate page

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePaymentFilter = useCallback((value: string) => {
    setPaymentFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePaymentStatusFilter = useCallback((value: string) => {
    setPaymentStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleAdditionalFeeFilter = useCallback((value: string) => {
    setAdditionalFeeFilter(value);
    setCurrentPage(1);
  }, []);

  const paymentFilterOptions = [
    { value: "", label: "جميع الطرق" },
    { value: "CASH", label: "نقدي" },
    { value: "CARD", label: "بطاقة" },
    { value: "CREDIT", label: "آجل" },
  ];

  const paymentStatusOptions = [
    { value: "", label: "جميع الحالات" },
    { value: "PAID", label: "مدفوع" },
    { value: "PARTIAL", label: "جزئي" },
    { value: "UNPAID", label: "غير مدفوع" },
  ];

  const additionalFeeFilterOptions = [
    { value: "", label: "الكل" },
    { value: "withFees", label: "برسوم" },
    { value: "noFees", label: "بدون رسوم" },
  ];

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'paymentMethod',
      label: 'طريقة الدفع',
      type: 'select',
      options: paymentFilterOptions,
      value: paymentFilter,
      onChange: (value) => handlePaymentFilter(value as string),
    },
    {
      key: 'paymentStatus',
      label: 'حالة الدفع',
      type: 'select',
      options: paymentStatusOptions,
      value: paymentStatusFilter,
      onChange: (value) => handlePaymentStatusFilter(value as string),
    },
    {
      key: 'additionalFeeFilter',
      label: 'الرسوم الإضافية',
      type: 'select',
      options: additionalFeeFilterOptions,
      value: additionalFeeFilter,
      onChange: (value) => handleAdditionalFeeFilter(value as string),
    },
  ], [paymentFilter, handlePaymentFilter, paymentStatusFilter, handlePaymentStatusFilter, additionalFeeFilter, handleAdditionalFeeFilter]);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setPaymentFilter("");
    setPaymentStatusFilter("");
    setAdditionalFeeFilter("");
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
  }, []);

  // Calculate totals
  const salesList = (salesData as any)?.data?.list || [];
  const totalSales = (salesData as any)?.data?.totalCount || 0;
  const totalRevenue = salesList.reduce((sum: number, sale: any) => sum + (Number(sale.totalAmount) || 0), 0);
  const totalProfit = salesList.reduce((sum: number, sale: any) => sum + (Number(sale.totalProfit) || 0), 0);
  const totalAdditionalFees = salesList.reduce((sum: number, sale: any) => sum + (Number(sale.additionalFee) || 0), 0);
  const paidSales = salesList.filter((sale: any) => sale.paymentStatus === 'PAID').length;
  const partialSales = salesList.filter((sale: any) => sale.paymentStatus === 'PARTIAL').length;
  const unpaidSales = salesList.filter((sale: any) => sale.paymentStatus === 'UNPAID').length;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المبيعات</h1>
            <p className="text-gray-600 mt-1">
              إدارة عمليات البيع وإصدار الفواتير
            </p>
          </div>
          <PermissionGuard permission="canCreateSales">
            <Button onClick={() => navigate('/sales/create')}>
              <Plus className="w-4 h-4 ml-2" />
              عملية بيع جديدة
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Cards - 2 rows, 3 cards each */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Row 1 - Main Stats */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">المبيعات</p>
                <p className="text-lg font-bold text-gray-900">{totalSales}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الإيرادات</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">الأرباح</p>
                <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </Card>

          {/* Row 2 - Payment Status */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">مدفوع</p>
                <p className="text-lg font-bold text-green-600">{paidSales}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">رسوم إضافية</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(totalAdditionalFees)}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">غير مدفوع</p>
                <p className="text-lg font-bold text-red-600">{unpaidSales}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sales Table with integrated search and filters */}
        <DataTable<Sale>
          title="جميع المبيعات"
          columns={columns}
          data={salesData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في المبيعات (رقم الفاتورة، العميل...)"
          onSearch={handleSearch}
          filters={tableFilters}
          onClearFilters={handleClearFilters}
          dateRangeFilter={{
            value: dateRange,
            onChange: handleDateRangeChange,
          }}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (sale) => navigate(`/sales/${sale.id}`),
              variant: "primary",
            },
            {
              icon: Download,
              label: "تحميل PDF",
              onClick: (sale) => {
                generateReceiptMutation.mutate({
                  saleId: sale.id,
                  companyId: company?.companyId || 0
                });
              },
              variant: "success",
            },
            {
              icon: Printer,
              label: "طباعة الفاتورة",
              onClick: (sale) => {
                setPrintableSale(sale);
                setShowPrintModal(true);
              },
              variant: "primary",
            },
          ]}
          totalItems={salesData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد مبيعات حتى الآن"
        />

        {/* Create Sale Modal removed - now using dedicated SalesCreate page */}

        {/* Print Receipt Preview Modal */}
        {printableSale && (
          <PrintReceiptPreview
            sale={printableSale}
            companyId={company?.companyId || company?.id || 0}
            cashier={user || { name: 'Cashier' }}
            isOpen={showPrintModal}
            onClose={() => {
              setShowPrintModal(false);
              setPrintableSale(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Sales;
