import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Package, AlertTriangle, Eye, Folder, Printer } from "lucide-react";
import { Layout } from "../components/layout";
import { Button, Card, DataTable, Badge, ConfirmDialog } from "../components/ui";
import type { Column, TableFilter } from "../components/ui/DataTable";
import { PermissionGuard } from "../components/common/PermissionGuard";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { usePermissionStore } from "../stores/permissionStore";
import {
  useProducts,
  useDeleteProduct,
} from "../hooks/api/useProducts";
import { useCategories } from "../hooks/api/useCategories";
import type { Product } from "../types";
import { printBarcode } from "../services/printService";
import toast from 'react-hot-toast';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const { hasPermission } = usePermissionStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  // Removed showCreateModal state - now using navigation
  // Removed editingProduct state - now using navigation to edit page
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });

  // API hooks
  const { data: productsData, isLoading } = useProducts({
    companyId: company?.companyId || company?.company?.id,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    categoryId: selectedCategory || undefined,
    lowStock: showLowStock,
  });

  const { data: categoriesData } = useCategories({
    companyId: company?.companyId || 0,
    limit: 100,
  });

  // Removed createMutation and updateMutation - now handled in dedicated pages
  const deleteMutation = useDeleteProduct();

  // Table columns - simplified to show only essential information
  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "اسم المنتج",
      render: (product: Product) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "الفئة",
      render: (product: Product) => (
        <Badge variant="primary">{(product as any).category?.name || "غير محدد"}</Badge>
      ),
    },
    {
      key: "stockQuantity",
      label: "المخزون",
      render: (product: Product) => {
        const stock = product.stockQuantity;
        const minLevel = product.minStockLevel;
        const isLow = stock <= minLevel;
        const isMedium = stock <= minLevel * 2 && stock > minLevel;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                isLow ? "text-warning-600" : isMedium ? "text-warning-500" : "text-success-600"
              }`}
            >
              {stock}
            </span>
            {isLow && (
              <Badge variant="warning" dot>
                <AlertTriangle className="w-3 h-3 ml-1 inline" />
                منخفض
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "sellingPrice",
      label: "سعر البيع",
      render: (product: Product) => (
        <span className="text-gray-900 text-lg">{product.sellingPrice} ج.م</span>
      ),
    },
  ];

  // Handlers
  // Removed handleCreate - now handled in ProductCreate page

  // Removed handleUpdate - now handled in ProductEdit page

  const handleDelete = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteConfirm.product) {
      deleteMutation.mutate({
        id: deleteConfirm.product.id,
        companyId: company?.companyId || company?.company?.id,
      });
      setDeleteConfirm({ isOpen: false, product: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, product: null });
  };

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleCategoryFilter = useCallback((value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  }, []);

  const categoryOptions = useMemo(() => [
    { value: "", label: "جميع الفئات" },
    ...(categoriesData?.data?.list.map((category) => ({
      value: category.id,
      label: category.name,
    })) || []),
  ], [categoriesData]);

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'category',
      label: 'الفئة',
      type: 'select',
      options: categoryOptions,
      value: selectedCategory,
      onChange: (value) => handleCategoryFilter(value as string),
    },
    {
      key: 'lowStock',
      label: 'المخزون المنخفض',
      type: 'checkbox',
      value: showLowStock,
      onChange: (value) => {
        setShowLowStock(value as boolean);
        setCurrentPage(1);
      },
    },
  ], [categoryOptions, selectedCategory, showLowStock, handleCategoryFilter]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory("");
    setShowLowStock(false);
    setCurrentPage(1);
  }, []);

  const handlePrintBarcode = async (product: Product) => {
    if (!product.sku) {
      toast.error("لا يوجد رمز SKU لهذا المنتج");
      return;
    }

    const loadingToast = toast.loading('جاري طباعة الباركود...');

    try {
      await printBarcode({
        sku: product.sku,
        productName: product.name,
        price: product.sellingPrice,
        quantity: 1
      });

      toast.success('تم طباعة الباركود بنجاح', { id: loadingToast });
    } catch (error: any) {
      const errorMessage = error.message || 'فشلت طباعة الباركود';
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  // Calculate summary stats
  const totalProducts = (productsData as any)?.data?.totalCount || 0;
  const lowStockCount = (productsData as any)?.data?.list.filter(
    (p: any) => p.stockQuantity <= p.minStockLevel
  ).length || 0;

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
            <p className="text-gray-600 mt-1">
              إدارة منتجات المتجر والتحكم في المخزون
            </p>
          </div>
          <PermissionGuard permission="canCreateProducts">
            <Button onClick={() => navigate('/products/create')}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </PermissionGuard>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                <Folder className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">الفئات</p>
                <p className="text-2xl font-bold text-green-600">
                  {categoriesData?.data?.totalCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Table with integrated search and filters */}
        <DataTable<Product>
          title="جميع المنتجات"
          columns={columns}
          data={productsData?.data?.list || []}
          loading={isLoading}
          searchPlaceholder="البحث في المنتجات (الاسم، SKU...)"
          onSearch={handleSearch}
          filters={tableFilters}
          onClearFilters={handleClearFilters}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (product) => navigate(`/products/${product.id}`),
              variant: "primary",
            },
            {
              icon: Printer,
              label: "طباعة الباركود",
              onClick: (product) => handlePrintBarcode(product),
              variant: "primary",
            },
            {
              icon: Edit,
              label: "تعديل المنتج",
              onClick: (product) => navigate(`/products/${product.id}/edit`),
              variant: "warning",
              show: () => hasPermission("canEditProducts"),
            },
            {
              icon: Trash2,
              label: "حذف المنتج",
              onClick: (product) => handleDelete(product),
              variant: "danger",
              show: () => hasPermission("canDeleteProducts"),
            },
          ]}
          totalItems={productsData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد منتجات حتى الآن. قم بإضافة منتج جديد للبدء!"
        />

        {/* Create Modal removed - now using dedicated ProductCreate page */}

        {/* Edit Modal removed - now using dedicated ProductEdit page */}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="تأكيد الحذف"
          message={`هل أنت متأكد من حذف المنتج "${deleteConfirm.product?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Products;
