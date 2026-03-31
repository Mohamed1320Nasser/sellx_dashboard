import React, { useState } from "react";
import { Plus, Edit, Trash2, Truck, Phone, Mail, Calendar, ShoppingCart, Building } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Modal, Input, ConfirmDialog, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "../hooks/api/useSuppliers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Supplier } from "../types";
import { formatTableDate } from "../utils/dateUtils";

const supplierSchema = z.object({
  name: z.string().min(1, "اسم المورد مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const SupplierForm: React.FC<{
  supplier?: Supplier;
  companyId: number;
  onSubmit: (data: SupplierFormData & { companyId: number }) => void;
  loading?: boolean;
  onCancel?: () => void;
}> = ({ supplier, companyId, onSubmit, loading = false, onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      address: supplier?.address || "",
    },
  });

  const handleFormSubmit = (data: SupplierFormData) => {
    onSubmit({ ...data, companyId });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        label="اسم المورد"
        placeholder="أدخل اسم المورد"
        {...register("name")}
        error={errors.name?.message}
        disabled={loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="أدخل البريد الإلكتروني"
          {...register("email")}
          error={errors.email?.message}
          disabled={loading}
        />

        <Input
          label="رقم الهاتف"
          placeholder="أدخل رقم الهاتف"
          {...register("phone")}
          error={errors.phone?.message}
          disabled={loading}
        />
      </div>

      <Input
        label="العنوان"
        placeholder="أدخل العنوان"
        {...register("address")}
        error={errors.address?.message}
        disabled={loading}
      />

      <div className="flex justify-end space-x-4 space-x-reverse">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            إلغاء
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {supplier ? "تحديث المورد" : "إنشاء مورد جديد"}
        </Button>
      </div>
    </form>
  );
};

const Suppliers: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    supplier: Supplier | null;
  }>({ isOpen: false, supplier: null });

  // API hooks
  const { data: suppliersData, isLoading } = useSuppliers({
    companyId: company?.companyId || company?.company?.id,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
  });

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  // Table columns
  const columns: Column<Supplier>[] = [
    {
      key: "name",
      label: "اسم المورد",
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning-500/30">
            <Building className="w-6 h-6 text-white" />
          </div>
          <span className="font-medium text-gray-900">{supplier.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "البريد الإلكتروني",
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span>{supplier.email || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      label: "رقم الهاتف",
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{supplier.phone || "غير محدد"}</span>
        </div>
      ),
    },
    {
      key: "_count",
      label: "عدد المشتريات",
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-warning-600" />
          <span className="font-bold text-warning-600">{(supplier as any)._count?.purchases || 0}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الإضافة",
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate((supplier as any).createdAt)}</span>
        </div>
      ),
    },
  ];

  // Handlers
  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (editingSupplier) {
      updateMutation.mutate(
        { id: editingSupplier.id, data },
        {
          onSuccess: () => {
            setEditingSupplier(null);
          },
        }
      );
    }
  };

  const handleDelete = (supplier: Supplier) => {
    setDeleteConfirm({ isOpen: true, supplier });
  };

  const confirmDelete = () => {
    if (deleteConfirm.supplier) {
      deleteMutation.mutate({
        id: deleteConfirm.supplier.id,
        companyId: company?.companyId || company?.company?.id,
      });
      setDeleteConfirm({ isOpen: false, supplier: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, supplier: null });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الموردين</h1>
            <p className="text-gray-600 mt-1">
              إدارة الموردين وبيانات الاتصال بهم
            </p>
          </div>
          <PermissionGuard permission="canCreateSuppliers">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مورد جديد
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Card */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning-500/30">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">إجمالي الموردين</p>
              <p className="text-2xl font-bold text-gray-900">
                {(suppliersData as any)?.data?.totalCount || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Suppliers Table with integrated search */}
        <DataTable<Supplier>
          title="جميع الموردين"
          columns={columns}
          data={suppliersData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في الموردين (الاسم، البريد الإلكتروني، رقم الهاتف...)"
          onSearch={handleSearch}
          actions={[
            {
              icon: Edit,
              label: "تعديل المورد",
              onClick: (supplier) => setEditingSupplier(supplier),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف المورد",
              onClick: (supplier) => handleDelete(supplier),
              variant: "danger",
            },
          ]}
          totalItems={suppliersData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد موردين حتى الآن. قم بإضافة مورد جديد للبدء!"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="إضافة مورد جديد"
        >
          <SupplierForm
            companyId={company?.companyId || company?.company?.id}
            onSubmit={handleCreate}
            loading={createMutation.isPending}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingSupplier}
          onClose={() => setEditingSupplier(null)}
          title="تعديل المورد"
        >
          {editingSupplier && (
            <SupplierForm
              supplier={editingSupplier}
              companyId={company?.companyId || company?.company?.id}
              onSubmit={handleUpdate}
              loading={updateMutation.isPending}
              onCancel={() => setEditingSupplier(null)}
            />
          )}
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف المورد "${deleteConfirm.supplier?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Suppliers;
