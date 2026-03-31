import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, Receipt, Calendar, Eye, Edit, Trash2, Truck, FileText } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, DataTable, Badge, ConfirmDialog } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { usePurchases, useDeletePurchase } from "../hooks/api/usePurchases";
import { formatTableDate } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyUtils";
import type { Purchase } from "../types/business";

const Purchases: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    purchase: Purchase | null;
  }>({ isOpen: false, purchase: null });

  // API hooks
  const { data: purchasesData, isLoading } = usePurchases({
    companyId: company?.companyId || 0,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
  });

  const deleteMutation = useDeletePurchase();

  // Table columns
  const columns: Column<Purchase>[] = [
    {
      key: "id",
      label: "رقم الفاتورة",
      render: (purchase: Purchase) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="font-bold text-primary-600">#{purchase.id}</span>
          {(purchase as any).invoiceUrl && (
            <div className="relative group">
              <div className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full transition-all group-hover:bg-blue-200">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                يحتوي على فاتورة مرفقة
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "supplier",
      label: "المورد",
      render: (purchase: Purchase) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning-500/30">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-900">{(purchase as any).supplier?.name || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "المبلغ الإجمالي",
      render: (purchase: Purchase) => (
        <span className="text-gray-900 text-lg">{formatCurrency((purchase as any).totalAmount)}</span>
      ),
    },
    {
      key: "paidAmount",
      label: "المبلغ المدفوع",
      render: (purchase: Purchase) => (
        <span className="text-success-600 text-lg">{formatCurrency((purchase as any).paidAmount || 0)}</span>
      ),
    },
    {
      key: "paymentStatus",
      label: "حالة الدفع",
      render: (purchase: Purchase) => {
        const status = (purchase as any).paymentStatus;
        const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
          PAID: { label: "مدفوع", variant: "success" },
          PARTIAL: { label: "مدفوع جزئياً", variant: "warning" },
          UNPAID: { label: "غير مدفوع", variant: "error" },
        };
        const statusInfo = statusMap[status] || { label: status, variant: "primary" as const };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
      key: "purchaseDate",
      label: "تاريخ الشراء",
      render: (purchase: Purchase) => (
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 ml-2" />
          {formatTableDate((purchase as any).purchaseDate)}
        </div>
      ),
    },
  ];


  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.purchase) return;
    
    try {
      await deleteMutation.mutateAsync({
        id: deleteConfirm.purchase.id,
        companyId: company?.companyId || 0,
      });
      setDeleteConfirm({ isOpen: false, purchase: null });
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  // Calculate totals
  const totalPurchases = (purchasesData as any)?.data?.totalCount || 0;
  const totalAmount = ((purchasesData as any)?.data?.list || []).reduce(
    (sum: number, purchase: Purchase) => sum + (Number(purchase.totalAmount) || 0),
    0
  );

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المشتريات</h1>
            <p className="text-gray-600 mt-1">
              إدارة عمليات الشراء من الموردين
            </p>
          </div>
          <PermissionGuard permission="canCreatePurchases">
            <Button onClick={() => navigate('/purchases/create')}>
              <Plus className="w-4 h-4 ml-2" />
              عملية شراء جديدة
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-gray-900">{totalPurchases}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                <p className="text-2xl font-bold text-green-600">{totalAmount.toFixed(2)} جنيه</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">اليوم</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatTableDate(new Date())}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Purchases Table with integrated search */}
        <DataTable<Purchase>
          title="جميع المشتريات"
          columns={columns}
          data={purchasesData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في المشتريات (رقم الفاتورة، المورد...)"
          onSearch={handleSearch}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (purchase) => navigate(`/purchases/${purchase.id}`),
              variant: "primary",
            },
            {
              icon: Edit,
              label: "تعديل المشتريات",
              onClick: (purchase) => navigate(`/purchases/${purchase.id}/edit`),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف المشتريات",
              onClick: (purchase) => setDeleteConfirm({ isOpen: true, purchase }),
              variant: "danger",
            },
          ]}
          totalItems={purchasesData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد مشتريات حتى الآن. قم بإضافة مشتريات جديدة للبدء!"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, purchase: null })}
          onConfirm={handleDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف عملية الشراء رقم ${deleteConfirm.purchase?.id}؟`}
          confirmText="حذف"
          cancelText="إلغاء"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Purchases;
