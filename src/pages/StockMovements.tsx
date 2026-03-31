import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  PieChart,
  RotateCcw,
  Package,
} from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, DataTable } from '../components/ui';
import type { Column, TableFilter } from '../components/ui/DataTable';
import { DateRange } from '../components/filters';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { useStockMovements, useCreateStockMovement } from '../hooks/api/useStockMovements';
import { StockMovementType } from '../types/business';
import { formatTableDate } from '../utils/dateUtils';
import StockMovementForm from '../components/forms/StockMovementForm';
import StockMovementDetailsModal from '../components/forms/StockMovementDetailsModal';
import StockMovementAnalytics from '../components/stockMovements/StockMovementAnalytics';

const StockMovements: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRange>({ startDate: '', endDate: '' });

  // Get company ID
  const companyId = company?.companyId || 0;

  // API hooks
  const { data: movementsData, isLoading, error, refetch } = useStockMovements({
    companyId,
    page: currentPage,
    limit: pageSize,
    ...(searchTerm && { search: searchTerm }),
    ...(typeFilter && { type: typeFilter as StockMovementType }),
    ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
    ...(dateFilter.endDate && { endDate: dateFilter.endDate }),
  });

  const createMovementMutation = useCreateStockMovement();

  // Computed values
  const movements = useMemo(() => (movementsData as any)?.data?.list || movementsData?.list || [], [movementsData]);
  const totalCount = (movementsData as any)?.data?.totalCount || movementsData?.totalCount || 0;


  // Check if company is available
  if (!companyId) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في المصادقة</h2>
            <p className="text-gray-600">يرجى التأكد من تسجيل الدخول والانضمام لشركة</p>
            <p className="text-sm text-gray-500 mt-2">Company ID: {companyId}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error message if there's an API error
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في تحميل البيانات</h2>
            <p className="text-gray-600">لا يمكن تحميل بيانات حركات المخزون</p>
            <p className="text-sm text-gray-500 mt-2">Error: {error?.message || 'Unknown error'}</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleCreate = async (data: any) => {
    try {
      await createMovementMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleView = (movement: any) => {
    setSelectedMovement(movement);
    setShowDetailsModal(true);
  };

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilter = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);


  // Filter options
  const typeOptions = useMemo(() => [
    { value: '', label: 'جميع الأنواع' },
    { value: StockMovementType.PURCHASE, label: 'شراء' },
    { value: StockMovementType.SALE, label: 'بيع' },
    { value: StockMovementType.ADJUSTMENT, label: 'تعديل' },
    { value: StockMovementType.RETURN, label: 'إرجاع' },
  ], []);

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'type',
      label: 'نوع الحركة',
      type: 'select',
      options: typeOptions,
      value: typeFilter,
      onChange: (value) => handleTypeFilter(value as string),
    },
  ], [typeOptions, typeFilter, handleTypeFilter]);

  // Table columns
  const columns: Column<any>[] = [
    {
      key: 'product',
      label: 'المنتج',
      render: (movement: any) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{movement.product?.name}</p>
            <p className="text-sm text-gray-500">SKU: {movement.product?.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'نوع الحركة',
      render: (movement: any) => {
        const typeConfig = {
          [StockMovementType.PURCHASE]: {
            label: 'شراء',
            color: 'bg-green-100 text-green-800 border-green-200',
            icon: TrendingUp
          },
          [StockMovementType.SALE]: {
            label: 'بيع',
            color: 'bg-red-100 text-red-800 border-red-200',
            icon: TrendingDown
          },
          [StockMovementType.ADJUSTMENT]: {
            label: 'تعديل',
            color: 'bg-blue-100 text-blue-800 border-blue-200',
            icon: Minus
          },
          [StockMovementType.RETURN]: {
            label: 'إرجاع',
            color: 'bg-orange-100 text-orange-800 border-orange-200',
            icon: RotateCcw
          },
        };
        const config = typeConfig[movement.type as StockMovementType];
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            <Icon className="w-3 h-3 ml-1" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'الكمية',
      render: (movement: any) => {
        const quantity = movement.quantity;
        if (quantity > 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <TrendingUp className="w-3 h-3 ml-1" />
              +{quantity}
            </span>
          );
        } else if (quantity < 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <TrendingDown className="w-3 h-3 ml-1" />
              {quantity}
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <Minus className="w-3 h-3 ml-1" />
              {quantity}
            </span>
          );
        }
      },
    },
    {
      key: 'previousStock',
      label: 'المخزون السابق',
      render: (movement: any) => (
        <span className="text-gray-600">{movement.previousStock}</span>
      ),
    },
    {
      key: 'newStock',
      label: 'المخزون الجديد',
      render: (movement: any) => (
        <span className="text-gray-900 text-lg">{movement.newStock}</span>
      ),
    },
    {
      key: 'user',
      label: 'المستخدم',
      render: (movement: any) => (
        <span className="text-sm text-gray-600">{movement.user?.fullname}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (movement: any) => (
        <div className="flex items-center text-gray-600">
          <span>{formatTableDate(movement.createdAt)}</span>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">حركات المخزون</h1>
            <p className="mt-2 text-gray-600">إدارة وتتبع حركات المخزون والمنتجات</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3 space-x-reverse">
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              variant="outline"
              size="sm"
            >
              {showAnalytics ? <BarChart3 className="h-4 w-4 ml-2" /> : <PieChart className="h-4 w-4 ml-2" />}
              {showAnalytics ? 'إخفاء التحليلات' : 'عرض التحليلات'}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="sm"
            >
              <Plus className="h-4 w-4 ml-2" />
              تعديل مخزون
            </Button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <StockMovementAnalytics filters={{
            type: typeFilter as StockMovementType | undefined,
            startDate: dateFilter.startDate,
            endDate: dateFilter.endDate
          }} />
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-red-800">خطأ في تحميل البيانات</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>حدث خطأ في الخادم، يرجى المحاولة مرة أخرى</p>
                  <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>تلميح:</strong> تأكد من تسجيل الدخول والانضمام لشركة لاستخدام حركات المخزون
                    </p>
                  </div>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm font-medium text-red-800 hover:text-red-600 underline"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Movements Table */}
        <DataTable<any>
          title="جميع حركات المخزون"
          columns={columns}
          data={movements}
          loading={isLoading}
          searchPlaceholder="البحث في حركات المخزون (المنتج، المستخدم...)"
          onSearch={handleSearch}
          filters={tableFilters}
          dateRangeFilter={{
            value: dateFilter,
            onChange: setDateFilter,
          }}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (movement) => handleView(movement),
              variant: "primary",
            },
          ]}
          totalItems={totalCount}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد حركات مخزون حتى الآن"
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">تعديل مخزون منتج</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">إغلاق</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <StockMovementForm
                companyId={companyId}
                onSubmit={handleCreate}
                loading={createMovementMutation.isPending}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedMovement && (
        <StockMovementDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMovement(null);
          }}
          stockMovement={selectedMovement}
        />
      )}
    </Layout>
  );
};

export default StockMovements;
