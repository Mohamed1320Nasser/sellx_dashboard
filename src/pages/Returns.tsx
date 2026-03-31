import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  Clock,
  DollarSign,
  Download,
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, StatisticsCard, DataTable, Badge } from "../components/ui";
import type { Column, TableFilter } from "../components/ui/DataTable";
import { formatCurrency, formatNumber } from "../utils";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useReturns,
  useReturnStatistics,
  useUpdateReturnStatus,
  useDeleteReturn,
} from "../hooks/api/useReturns";
import { formatTableDate } from "../utils/dateUtils";
import type { Return } from "../types";
import { ReturnStatus } from "../types";


const Returns: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");

  // API hooks
  const { data: returnsData, isLoading } = useReturns({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter || undefined,
  });

  const { data: statistics, isLoading: statsLoading, error: statsError } = useReturnStatistics(company?.companyId || 0);
  
  // Check if we have a valid company ID
  const hasValidCompanyId = company?.companyId && company.companyId > 0;
  

  const updateStatusMutation = useUpdateReturnStatus();
  const deleteMutation = useDeleteReturn();

  // Filter handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value as ReturnStatus | "");
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("");
    setCurrentPage(1);
  }, []);

  // Filter options
  const statusOptions = useMemo(() => [
    { value: "", label: "جميع الحالات" },
    { value: "PENDING", label: "في الانتظار" },
    { value: "COMPLETED", label: "مكتمل" },
    { value: "REJECTED", label: "مرفوض" },
  ], []);

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

  // Table columns
  const columns: Column<Return>[] = [
    {
      key: "returnNumber",
      label: "رقم الإرجاع",
      render: (returnData: Return) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <RotateCcw className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-primary-600">{returnData.returnNumber || "-"}</span>
        </div>
      ),
    },
    {
      key: "client",
      label: "العميل",
      render: (returnData: Return) => (
        <div>
          {returnData.client?.name ? (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{returnData.client.name}</div>
                {returnData.client.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3 h-3" />
                    {returnData.client.phone}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">عميل نقدي</span>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "المبلغ",
      render: (returnData: Return) => (
        <span className="font-bold text-success-600 text-lg">
          {returnData.totalAmount ? formatCurrency(Number(returnData.totalAmount)) : "0.00 ج.م"}
        </span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (returnData: Return) => {
        const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'error' }> = {
          PENDING: { label: "في الانتظار", variant: "warning" },
          COMPLETED: { label: "مكتمل", variant: "success" },
          REJECTED: { label: "مرفوض", variant: "error" },
        };
        const status = returnData.status || "PENDING";
        const statusInfo = statusMap[status] || statusMap.PENDING;
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
      key: "returnDate",
      label: "التاريخ",
      render: (returnData: Return) => {
        if (!returnData.returnDate) return <span className="text-gray-400">-</span>;
        const date = typeof returnData.returnDate === 'object'
          ? new Date(returnData.returnDate as any)
          : new Date(returnData.returnDate);
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatTableDate(date)}</span>
          </div>
        );
      },
    },
  ];


  // Handlers


  // Quick approve/reject handlers
  const handleQuickApprove = (returnId: string) => {
    if (company?.companyId) {
      updateStatusMutation.mutate(
        { 
          id: returnId, 
          data: { status: ReturnStatus.COMPLETED, companyId: company.companyId } 
        }
      );
    }
  };

  const handleQuickReject = (returnId: string) => {
    if (company?.companyId) {
      updateStatusMutation.mutate(
        { 
          id: returnId, 
          data: { status: ReturnStatus.REJECTED, companyId: company.companyId } 
        }
      );
    }
  };


  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الإرجاع؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-6 h-6" />
              إدارة المرتجعات
            </h1>
            <p className="text-gray-600 mt-1">
              إدارة طلبات الإرجاع ومعالجة المرتجعات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </Button>
            <Button
              onClick={() => navigate('/returns/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إرجاع جديد
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              خطأ في تحميل إحصائيات المرتجعات: {statsError.message || 'خطأ غير معروف'}
            </p>
          </div>
        )}
        {/* Statistics */}
        {!hasValidCompanyId && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">خطأ: لا يوجد معرف شركة صالح</p>
            <p className="text-red-500 text-xs mt-1">Company ID: {company?.companyId || 'غير محدد'}</p>
          </div>
        )}
        {statsLoading && hasValidCompanyId && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 text-sm">جاري تحميل إحصائيات المرتجعات...</p>
          </div>
        )}
        {statsError && hasValidCompanyId && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">خطأ في تحميل الإحصائيات: {statsError.message}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            title="في الانتظار"
            value={formatNumber(statistics?.pendingReturns || 0)}
            icon={Clock}
            color="#F59E0B"
            isLoading={statsLoading}
          />

          <StatisticsCard
            title="مكتمل"
            value={formatNumber(statistics?.completedReturns || 0)}
            icon={CheckCircle}
            color="#10B981"
            isLoading={statsLoading}
          />

          <StatisticsCard
            title="مرفوض"
            value={formatNumber(statistics?.rejectedReturns || 0)}
            icon={XCircle}
            color="#EF4444"
            isLoading={statsLoading}
          />

          <StatisticsCard
            title="إجمالي الاسترداد"
            value={formatCurrency(statistics?.totalRefundAmount || 0)}
            icon={DollarSign}
            color="#8B5CF6"
            isLoading={statsLoading}
          />
        </div>

        {/* Returns Table with integrated search and filters */}
        <DataTable<Return>
          title="جميع طلبات الإرجاع"
          columns={columns}
          data={returnsData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في طلبات الإرجاع (رقم الإرجاع، اسم العميل...)"
          onSearch={handleSearch}
          filters={tableFilters}
          onClearFilters={handleClearFilters}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (returnData) => navigate(`/returns/${returnData.id}`),
              variant: "primary",
            },
            {
              icon: CheckCircle,
              label: "تأكيد الإرجاع",
              onClick: (returnData) => handleQuickApprove(returnData.id),
              variant: "success",
              show: (returnData) => returnData.status === "PENDING",
            },
            {
              icon: XCircle,
              label: "رفض الإرجاع",
              onClick: (returnData) => handleQuickReject(returnData.id),
              variant: "danger",
              show: (returnData) => returnData.status === "PENDING",
            },
            {
              icon: Trash2,
              label: "حذف",
              onClick: (returnData) => handleDelete(returnData.id),
              variant: "danger",
            },
          ]}
          totalItems={returnsData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد طلبات إرجاع حتى الآن. قم بإضافة طلب إرجاع جديد للبدء!"
        />




      </div>
    </Layout>
  );
};

export default Returns;
