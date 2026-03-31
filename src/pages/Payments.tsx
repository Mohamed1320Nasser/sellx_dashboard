import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Calendar, DollarSign, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { Layout } from '../components/layout';
import { Button, DataTable, Badge } from '../components/ui';
import type { Column, TableFilter } from '../components/ui/DataTable';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { PaymentMethod, PaymentStatus, paymentService } from '../services/paymentService';
import { formatCurrency, formatDate } from '../utils';
import { useQuery } from '@tanstack/react-query';

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useSessionAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const companyId = company?.companyId || company?.company?.id;

  // Fetch payments data
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', companyId, currentPage, pageSize, searchTerm, paymentMethodFilter, paymentStatusFilter],
    queryFn: () => paymentService.getList({
      companyId: companyId!,
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      paymentMethod: paymentMethodFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
    }),
    enabled: !!companyId,
  });

  const payments = paymentsData?.data?.list || [];

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="w-4 h-4" />;
      case 'MOBILE_WALLET':
        return <Smartphone className="w-4 h-4" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'نقدي';
      case 'MOBILE_WALLET':
        return 'محفظة إلكترونية';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      default:
        return method;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'PENDING':
        return 'في الانتظار';
      case 'FAILED':
        return 'فشل';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return status;
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'amount',
      label: 'المبلغ',
      render: (payment: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 text-lg">{formatCurrency(payment.amount)}</span>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'طريقة الدفع',
      render: (payment: any) => {
        const methodColors: Record<string, 'success' | 'primary' | 'warning'> = {
          CASH: 'success',
          BANK_TRANSFER: 'primary',
          MOBILE_WALLET: 'warning',
        };
        return (
          <Badge variant={methodColors[payment.paymentMethod] || 'primary'}>
            {getPaymentMethodLabel(payment.paymentMethod)}
          </Badge>
        );
      },
    },
    {
      key: 'paymentStatus',
      label: 'الحالة',
      render: (payment: any) => {
        const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
          COMPLETED: 'success',
          PENDING: 'warning',
          FAILED: 'error',
          CANCELLED: 'default',
        };
        return (
          <Badge variant={statusVariants[payment.paymentStatus] || 'default'}>
            {getPaymentStatusLabel(payment.paymentStatus)}
          </Badge>
        );
      },
    },
    {
      key: 'paymentDate',
      label: 'تاريخ الدفع',
      render: (payment: any) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(payment.paymentDate)}</span>
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'المرجع',
      render: (payment: any) => (
        <span className="text-gray-600">{payment.reference || '-'}</span>
      ),
    },
  ];

  // Filter options
  const paymentMethodOptions = useMemo(() => [
    { value: '', label: 'جميع الطرق' },
    { value: PaymentMethod.CASH, label: 'نقدي' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'تحويل بنكي' },
    { value: PaymentMethod.MOBILE_WALLET, label: 'محفظة إلكترونية' },
  ], []);

  const paymentStatusOptions = useMemo(() => [
    { value: '', label: 'جميع الحالات' },
    { value: PaymentStatus.PENDING, label: 'معلق' },
    { value: PaymentStatus.COMPLETED, label: 'مكتمل' },
    { value: PaymentStatus.FAILED, label: 'فشل' },
    { value: PaymentStatus.CANCELLED, label: 'ملغي' },
  ], []);

  // Filter handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePaymentMethodFilter = useCallback((value: string) => {
    setPaymentMethodFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePaymentStatusFilter = useCallback((value: string) => {
    setPaymentStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setPaymentMethodFilter('');
    setPaymentStatusFilter('');
    setCurrentPage(1);
  }, []);

  // Table filters configuration
  const tableFilters: TableFilter[] = useMemo(() => [
    {
      key: 'paymentMethod',
      label: 'طريقة الدفع',
      type: 'select',
      options: paymentMethodOptions,
      value: paymentMethodFilter,
      onChange: (value) => handlePaymentMethodFilter(value as string),
    },
    {
      key: 'paymentStatus',
      label: 'الحالة',
      type: 'select',
      options: paymentStatusOptions,
      value: paymentStatusFilter,
      onChange: (value) => handlePaymentStatusFilter(value as string),
    },
  ], [paymentMethodOptions, paymentStatusOptions, paymentMethodFilter, paymentStatusFilter, handlePaymentMethodFilter, handlePaymentStatusFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المدفوعات</h1>
            <p className="text-gray-600">إدارة جميع المدفوعات</p>
          </div>
          <Button
            onClick={() => navigate('/payments/create')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 ml-1" />
            إضافة دفعة
          </Button>
        </div>

        {/* Payments Table with integrated search and filters */}
        <DataTable<any>
          title="جميع المدفوعات"
          columns={columns}
          data={payments}
          loading={isLoading}
          searchPlaceholder="البحث في المدفوعات..."
          onSearch={handleSearch}
          filters={tableFilters}
          onClearFilters={handleClearFilters}
          actions={[
            {
              icon: Eye,
              label: "عرض التفاصيل",
              onClick: (payment) => navigate(`/payments/${payment.id}`),
              variant: "primary",
            },
            {
              icon: Pencil,
              label: "تعديل",
              onClick: (payment) => navigate(`/payments/${payment.id}/edit`),
              variant: "warning",
            },
            {
              icon: Trash2,
              label: "حذف",
              onClick: (payment) => {/* TODO: Implement delete */},
              variant: "danger",
            },
          ]}
          totalItems={paymentsData?.data?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          emptyMessage="لا توجد مدفوعات حتى الآن"
        />
      </div>
    </Layout>
  );
};

export default Payments;
