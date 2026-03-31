import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, DataTable, Badge, ConfirmDialog } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryService } from "../services/salaryService";
import type { Salary } from "../types";
import toast from "react-hot-toast";

const Salaries: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    salary: Salary | null;
  }>({ isOpen: false, salary: null });

  const companyId = company?.companyId || 0;

  // Fetch salaries
  const { data: salariesData, isLoading } = useQuery({
    queryKey: ["salaries", companyId, currentPage, pageSize, searchTerm],
    queryFn: () =>
      salaryService.getList({
        companyId,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!companyId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => salaryService.delete(id, companyId),
    onSuccess: () => {
      toast.success("تم حذف الراتب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      setDeleteConfirm({ isOpen: false, salary: null });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.msg || "حدث خطأ أثناء حذف الراتب");
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (deleteConfirm.salary) {
      deleteMutation.mutate(Number(deleteConfirm.salary.id));
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default'; icon: any }> = {
      DRAFT: { label: "مسودة", variant: "default", icon: Clock },
      APPROVED: { label: "معتمد", variant: "warning", icon: CheckCircle },
      PAID: { label: "مدفوع", variant: "success", icon: CheckCircle },
      CANCELLED: { label: "ملغي", variant: "error", icon: XCircle },
    };
    return configs[status] || configs.DRAFT;
  };

  // Table columns
  const columns: Column<Salary>[] = [
    {
      key: "user",
      label: "الموظف",
      render: (salary: Salary) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-900">
            {(salary as any).user?.fullname || "غير محدد"}
          </span>
        </div>
      ),
    },
    {
      key: "period",
      label: "الفترة",
      render: (salary: Salary) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {salary.month}/{salary.year}
          </span>
        </div>
      ),
    },
    {
      key: "baseSalary",
      label: "الراتب الأساسي",
      render: (salary: Salary) => (
        <span className="text-gray-900">{formatCurrency(salary.baseSalary)}</span>
      ),
    },
    {
      key: "allowances",
      label: "البدلات",
      render: (salary: Salary) => (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>{formatCurrency(salary.allowances)}</span>
        </div>
      ),
    },
    {
      key: "deductions",
      label: "الخصومات",
      render: (salary: Salary) => (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span>{formatCurrency(salary.deductions)}</span>
        </div>
      ),
    },
    {
      key: "netSalary",
      label: "الصافي",
      render: (salary: Salary) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="text-lg font-semibold text-green-600">
            {formatCurrency(salary.netSalary)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (salary: Salary) => {
        const config = getStatusConfig(salary.status);
        const Icon = config.icon;
        return (
          <Badge variant={config.variant}>
            <Icon className="w-3 h-3 ml-1 inline" />
            {config.label}
          </Badge>
        );
      },
    },
  ];

  // Calculate summary
  const totalSalaries = salariesData?.totalCount || 0;
  const totalPaid = (salariesData?.list || [])
    .filter((s: Salary) => s.status === "PAID")
    .reduce((sum: number, s: Salary) => sum + Number(s.netSalary), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الرواتب</h1>
            <p className="text-gray-600 mt-1">إدارة رواتب الموظفين والمدفوعات</p>
          </div>
          <PermissionGuard permission="canCreateSalaries">
            <Button onClick={() => navigate("/salaries/create")}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة راتب جديد
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-gray-900">{totalSalaries}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">المدفوع</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قيد المعالجة</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(salariesData?.list || []).filter(
                    (s: Salary) => s.status !== "PAID" && s.status !== "CANCELLED"
                  ).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Salaries Table */}
        <DataTable<Salary>
          title="جميع الرواتب"
          columns={columns}
          data={salariesData?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في الرواتب..."
          onSearch={handleSearch}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (salary) => navigate(`/salaries/${salary.id}`),
              variant: "primary",
            },
            {
              icon: Edit,
              label: "تعديل",
              onClick: (salary) => navigate(`/salaries/${salary.id}/edit`),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف",
              onClick: (salary) => setDeleteConfirm({ isOpen: true, salary }),
              variant: "danger",
            },
          ]}
          totalItems={salariesData?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد رواتب حتى الآن"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, salary: null })}
          onConfirm={handleDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف راتب ${(deleteConfirm.salary as any)?.user?.fullname}؟`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Salaries;
