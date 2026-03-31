import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Layout } from "../../components/layout";
import {
  Button,
  Card,
  Modal,
  Input,
  ConfirmDialog,
  DataTable,
  Badge,
} from "../../components/ui";
import type { Column } from "../../components/ui/DataTable";
import { PermissionGuard } from "../../components/common/PermissionGuard";
import { useSessionAuthStore } from "../../stores/sessionAuthStore";
import {
  useTaxSettings,
  useCreateTaxSetting,
  useUpdateTaxSetting,
  useDeleteTaxSetting,
  useToggleTaxSetting,
  useSetDefaultTaxSetting,
} from "../../hooks/api/useTax";
import { formatTableDate } from "../../utils/dateUtils";
import type { TaxSetting, TaxAppliesTo } from "../../types";

const TaxSettings: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    tax: TaxSetting | null;
  }>({ isOpen: false, tax: null });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    isDefault: false,
    isActive: true,
    appliesTo: "ALL" as TaxAppliesTo,
  });

  // Get company ID
  const companyId = company?.companyId || company?.company?.id || 0;

  // API hooks
  const { data: taxData, isLoading } = useTaxSettings({
    companyId,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
  });

  const createMutation = useCreateTaxSetting();
  const updateMutation = useUpdateTaxSetting();
  const deleteMutation = useDeleteTaxSetting();
  const toggleMutation = useToggleTaxSetting();
  const setDefaultMutation = useSetDefaultTaxSetting();

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      rate: "",
      description: "",
      isDefault: false,
      isActive: true,
      appliesTo: "ALL" as TaxAppliesTo,
    });
  };

  // Table columns
  const columns: Column<TaxSetting>[] = [
    {
      key: "name",
      label: "اسم الضريبة",
      render: (tax: TaxSetting) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Percent className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-medium text-gray-900">{tax.name}</span>
            {tax.isDefault && (
              <Badge variant="success" className="mr-2 text-xs">
                <Star className="w-3 h-3 ml-1" />
                افتراضي
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "rate",
      label: "النسبة",
      render: (tax: TaxSetting) => (
        <span className="font-bold text-emerald-600 text-lg">{tax.rate}%</span>
      ),
    },
    {
      key: "description",
      label: "الوصف",
      render: (tax: TaxSetting) => (
        <span className="text-gray-600 text-sm">
          {tax.description || "لا يوجد وصف"}
        </span>
      ),
    },
    {
      key: "appliesTo",
      label: "ينطبق على",
      render: (tax: TaxSetting) => {
        const labels: Record<TaxAppliesTo, string> = {
          ALL: "الكل",
          PRODUCTS: "المنتجات",
          SERVICES: "الخدمات",
        };
        return (
          <Badge variant="primary">{labels[tax.appliesTo] || tax.appliesTo}</Badge>
        );
      },
    },
    {
      key: "isActive",
      label: "الحالة",
      render: (tax: TaxSetting) => (
        <div className="flex items-center gap-2">
          {tax.isActive ? (
            <Badge variant="success">
              <CheckCircle className="w-3 h-3 ml-1" />
              نشط
            </Badge>
          ) : (
            <Badge variant="error">
              <XCircle className="w-3 h-3 ml-1" />
              غير نشط
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الإنشاء",
      render: (tax: TaxSetting) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate(tax.createdAt)}</span>
        </div>
      ),
    },
  ];

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        companyId,
        name: formData.name,
        rate: parseFloat(formData.rate),
        description: formData.description || undefined,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        appliesTo: formData.appliesTo,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
        },
      }
    );
  };

  const handleUpdate = () => {
    if (editingTax) {
      updateMutation.mutate(
        {
          id: editingTax.id,
          data: {
            companyId,
            name: formData.name,
            rate: parseFloat(formData.rate),
            description: formData.description || undefined,
            isDefault: formData.isDefault,
            isActive: formData.isActive,
            appliesTo: formData.appliesTo,
          },
        },
        {
          onSuccess: () => {
            setEditingTax(null);
            resetForm();
          },
        }
      );
    }
  };

  const handleEdit = (tax: TaxSetting) => {
    setFormData({
      name: tax.name,
      rate: tax.rate.toString(),
      description: tax.description || "",
      isDefault: tax.isDefault,
      isActive: tax.isActive,
      appliesTo: tax.appliesTo,
    });
    setEditingTax(tax);
  };

  const handleDelete = (tax: TaxSetting) => {
    setDeleteConfirm({ isOpen: true, tax });
  };

  const confirmDelete = () => {
    if (deleteConfirm.tax) {
      deleteMutation.mutate({
        id: deleteConfirm.tax.id,
        companyId,
      });
      setDeleteConfirm({ isOpen: false, tax: null });
    }
  };

  const handleToggle = (tax: TaxSetting) => {
    toggleMutation.mutate({ id: tax.id, companyId });
  };

  const handleSetDefault = (tax: TaxSetting) => {
    setDefaultMutation.mutate({ id: tax.id, companyId });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Form Modal Content
  const FormContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          اسم الضريبة *
        </label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="مثال: ضريبة القيمة المضافة"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          النسبة المئوية *
        </label>
        <Input
          name="rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.rate}
          onChange={handleInputChange}
          placeholder="مثال: 14"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          الوصف
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="وصف اختياري للضريبة"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          تنطبق على
        </label>
        <select
          name="appliesTo"
          value={formData.appliesTo}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="ALL">الكل</option>
          <option value="PRODUCTS">المنتجات فقط</option>
          <option value="SERVICES">الخدمات فقط</option>
        </select>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">نشط</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">تعيين كافتراضي</span>
        </label>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الضرائب</h1>
            <p className="text-gray-600 mt-1">
              إدارة نسب الضرائب المطبقة على المبيعات
            </p>
          </div>
          <PermissionGuard permission="canManageUserRoles">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة ضريبة جديدة
            </Button>
          </PermissionGuard>
        </div>

        {/* Tax Settings Table */}
        <DataTable<TaxSetting>
          title="جميع الضرائب"
          columns={columns}
          data={taxData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في الضرائب..."
          onSearch={handleSearch}
          actions={[
            {
              icon: Star,
              label: "تعيين كافتراضي",
              onClick: (tax) => handleSetDefault(tax),
              variant: "primary",
              show: (tax) => !tax.isDefault && tax.isActive,
            },
            {
              icon: ToggleRight,
              label: "تفعيل/إلغاء",
              onClick: (tax) => handleToggle(tax),
              variant: "warning",
            },
            {
              icon: Edit,
              label: "تعديل",
              onClick: (tax) => handleEdit(tax),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف",
              onClick: (tax) => handleDelete(tax),
              variant: "danger",
            },
          ]}
          totalItems={taxData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد ضرائب مسجلة"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="إضافة ضريبة جديدة"
        >
          <FormContent />
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!formData.name || !formData.rate}
            >
              إضافة
            </Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingTax}
          onClose={() => {
            setEditingTax(null);
            resetForm();
          }}
          title="تعديل الضريبة"
        >
          <FormContent />
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditingTax(null);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleUpdate}
              loading={updateMutation.isPending}
              disabled={!formData.name || !formData.rate}
            >
              حفظ التعديلات
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, tax: null })}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف الضريبة "${deleteConfirm.tax?.name}"؟`}
          confirmText="حذف"
          cancelText="إلغاء"
          onConfirm={confirmDelete}
          type="danger"
        />
      </div>
    </Layout>
  );
};

export default TaxSettings;
