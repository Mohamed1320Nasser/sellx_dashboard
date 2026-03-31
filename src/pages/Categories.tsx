import React, { useState } from "react";
import { Plus, Edit, Trash2, FolderOpen, Package, Calendar } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, Modal, Input, ConfirmDialog, DataTable, Badge } from "../components/ui";
import type { Column } from "../components/ui/DataTable";
import { CategoryForm } from "../components/forms";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/api/useCategories";
import { formatTableDate } from "../utils/dateUtils";
import type { Category } from "../types";

const Categories: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });

  // Get company ID
  const companyId = company?.companyId || company?.company?.id;

  // API hooks
  const { data: categoriesData, isLoading } = useCategories({
    companyId,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
  });

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Table columns
  const columns: Column<Category>[] = [
    {
      key: "name",
      label: "اسم الفئة",
      render: (category: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "الوصف",
      render: (category: Category) => {
        const description = (category as any).description || "";
        const maxLength = 50;
        const shouldTruncate = description.length > maxLength;

        if (!description) {
          return <span className="text-gray-400 text-sm italic">لا يوجد وصف</span>;
        }

        return (
          <div className="relative group">
            <span className="text-gray-600 text-sm">
              {shouldTruncate ? `${description.slice(0, maxLength)}...` : description}
            </span>
            {shouldTruncate && (
              <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
                <div className="text-right leading-relaxed">{description}</div>
                <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "_count",
      label: "عدد المنتجات",
      render: (category: Category) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-600" />
          <span className="font-bold text-primary-600">{(category as any)._count?.products || 0}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "تاريخ الإنشاء",
      render: (category: Category) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatTableDate((category as any).createdAt)}</span>
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
    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            setEditingCategory(null);
          },
        }
      );
    }
  };

  const handleDelete = (category: Category) => {
    setDeleteConfirm({ isOpen: true, category });
  };

  const confirmDelete = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate({
        id: deleteConfirm.category.id,
        companyId: companyId,
      });
      setDeleteConfirm({ isOpen: false, category: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, category: null });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الفئات</h1>
            <p className="text-gray-600 mt-1">
              إدارة فئات المنتجات في متجرك
            </p>
          </div>
          <PermissionGuard permission="canCreateCategories">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة فئة جديدة
            </Button>
          </PermissionGuard>
        </div>

        {/* Categories Table with integrated search */}
        <DataTable<Category>
          title="جميع الفئات"
          columns={columns}
          data={categoriesData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في الفئات (الاسم، الوصف...)"
          onSearch={handleSearch}
          actions={[
            {
              icon: Edit,
              label: "تعديل الفئة",
              onClick: (category) => setEditingCategory(category),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف الفئة",
              onClick: (category) => handleDelete(category),
              variant: "danger",
            },
          ]}
          totalItems={categoriesData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد فئات حتى الآن. قم بإضافة فئة جديدة للبدء!"
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="إضافة فئة جديدة"
        >
          <CategoryForm
            companyId={companyId}
            onSubmit={handleCreate}
            loading={createMutation.isPending}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          title="تعديل الفئة"
        >
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              companyId={companyId}
              onSubmit={handleUpdate}
              loading={updateMutation.isPending}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف الفئة "${deleteConfirm.category?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Categories;
