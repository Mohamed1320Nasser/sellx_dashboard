import React, { useState } from "react";
import { Layout } from "../components/layout";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  SalesTrendsChart,
  ProductPerformanceChart,
  CustomerAnalyticsChart,
  InventoryAnalyticsChart,
  DashboardSummary,
} from "../components/analytics";
import {
  useSalesTrends,
  useProductPerformance,
  useCustomerAnalytics,
  useInventoryAnalytics,
  useDashboardSummary,
} from "../hooks/api/useAnalytics";
import {
  TrendPeriod,
  TrendMetric,
  PerformanceMetric,
  CustomerMetric,
  InventoryMetric,
  SortOrder,
} from "../types/business";
import { DateRangeFilter, DateRange } from "../components/filters";
import { AlertCircle, Filter, Calendar, BarChart3 } from "lucide-react";

const Analytics: React.FC = () => {
  const { company } = useSessionAuthStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "products" | "customers" | "inventory">("dashboard");
  
  // Date filters
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: "",
    endDate: "",
  });

  // Sales trends filters
  const [salesFilters, setSalesFilters] = useState({
    period: TrendPeriod.MONTHLY,
    metric: TrendMetric.REVENUE,
    limit: 12,
  });

  // Product performance filters
  const [productFilters, setProductFilters] = useState({
    metric: PerformanceMetric.REVENUE,
    sortOrder: SortOrder.DESC,
    limit: 10,
  });

  // Customer analytics filters
  const [customerFilters, setCustomerFilters] = useState({
    metric: CustomerMetric.TOTAL_SPENT,
    limit: 10,
  });

  // Inventory analytics filters
  const [inventoryFilters, setInventoryFilters] = useState({
    metric: InventoryMetric.STOCK_LEVEL,
    limit: 10,
  });

  // API calls
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardSummary();
  
  const { data: salesData, isLoading: salesLoading } = useSalesTrends({
    ...salesFilters,
    ...(dateRange.startDate && { startDate: dateRange.startDate }),
    ...(dateRange.endDate && { endDate: dateRange.endDate }),
  });

  const { data: productData, isLoading: productLoading } = useProductPerformance({
    ...productFilters,
    ...(dateRange.startDate && { startDate: dateRange.startDate }),
    ...(dateRange.endDate && { endDate: dateRange.endDate }),
  });

  const { data: customerData, isLoading: customerLoading } = useCustomerAnalytics({
    ...customerFilters,
    ...(dateRange.startDate && { startDate: dateRange.startDate }),
    ...(dateRange.endDate && { endDate: dateRange.endDate }),
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryAnalytics(inventoryFilters);

  if (!company || !company.companyId || company.companyId === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في المصادقة</h2>
            <p className="text-gray-600">يرجى التأكد من تسجيل الدخول والانضمام لشركة</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "dashboard", label: "لوحة التحكم", icon: BarChart3 },
    { id: "sales", label: "اتجاهات المبيعات", icon: BarChart3 },
    { id: "products", label: "أداء المنتجات", icon: BarChart3 },
    { id: "customers", label: "تحليل العملاء", icon: BarChart3 },
    { id: "inventory", label: "تحليل المخزون", icon: BarChart3 },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">التحليلات والإحصائيات</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              تحليل شامل لأداء الأعمال والمؤشرات الرئيسية
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">فلترة التاريخ</h3>
                </div>
                <div className="w-full lg:w-auto lg:max-w-md">
                  <DateRangeFilter
                    value={dateRange}
                    onChange={setDateRange}
                    size="md"
                    showPresets={true}
                    showClearButton={true}
                    showResetButton={true}
                    placeholder={{
                      startDate: 'من تاريخ',
                      endDate: 'إلى تاريخ',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              {/* Desktop Tabs */}
              <nav className="hidden md:flex -mb-px space-x-8 rtl:space-x-reverse px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rtl:space-x-reverse ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Mobile Tabs */}
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="block w-full px-4 py-3 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            {activeTab === "dashboard" && (
              <DashboardSummary data={dashboardData!} isLoading={dashboardLoading} />
            )}

            {activeTab === "sales" && (
              <div className="space-y-6">
                {/* Sales Filters */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">فلترة اتجاهات المبيعات</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الفترة
                      </label>
                      <select
                        value={salesFilters.period}
                        onChange={(e) => setSalesFilters(prev => ({ ...prev, period: e.target.value as TrendPeriod }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={TrendPeriod.DAILY}>يومي</option>
                        <option value={TrendPeriod.WEEKLY}>أسبوعي</option>
                        <option value={TrendPeriod.MONTHLY}>شهري</option>
                        <option value={TrendPeriod.QUARTERLY}>ربعي</option>
                        <option value={TrendPeriod.YEARLY}>سنوي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المقياس
                      </label>
                      <select
                        value={salesFilters.metric}
                        onChange={(e) => setSalesFilters(prev => ({ ...prev, metric: e.target.value as TrendMetric }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={TrendMetric.REVENUE}>الإيرادات</option>
                        <option value={TrendMetric.ORDERS}>الطلبات</option>
                        <option value={TrendMetric.UNITS_SOLD}>الوحدات المباعة</option>
                        <option value={TrendMetric.AVERAGE_ORDER_VALUE}>متوسط قيمة الطلب</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        عدد النقاط
                      </label>
                      <input
                        type="number"
                        value={salesFilters.limit}
                        onChange={(e) => setSalesFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 12 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Sales Chart */}
                {salesData && (
                  <SalesTrendsChart
                    data={salesData.trends}
                    period={salesData.period}
                    metric={salesData.metric}
                    summary={salesData.summary}
                    isLoading={salesLoading}
                  />
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                {/* Product Filters */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">فلترة أداء المنتجات</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المقياس
                      </label>
                      <select
                        value={productFilters.metric}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, metric: e.target.value as PerformanceMetric }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={PerformanceMetric.REVENUE}>الإيرادات</option>
                        <option value={PerformanceMetric.UNITS_SOLD}>الوحدات المباعة</option>
                        <option value={PerformanceMetric.PROFIT_MARGIN}>هامش الربح</option>
                        <option value={PerformanceMetric.TURNOVER_RATE}>معدل الدوران</option>
                        <option value={PerformanceMetric.GROWTH_RATE}>معدل النمو</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الترتيب
                      </label>
                      <select
                        value={productFilters.sortOrder}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, sortOrder: e.target.value as SortOrder }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={SortOrder.DESC}>تنازلي</option>
                        <option value={SortOrder.ASC}>تصاعدي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        عدد المنتجات
                      </label>
                      <input
                        type="number"
                        value={productFilters.limit}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Chart */}
                {productData && (
                  <ProductPerformanceChart
                    data={productData.products}
                    metric={productData.metric}
                    sortOrder={productData.sortOrder}
                    summary={productData.summary}
                    isLoading={productLoading}
                  />
                )}
              </div>
            )}

            {activeTab === "customers" && (
              <div className="space-y-6">
                {/* Customer Filters */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">فلترة تحليل العملاء</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المقياس
                      </label>
                      <select
                        value={customerFilters.metric}
                        onChange={(e) => setCustomerFilters(prev => ({ ...prev, metric: e.target.value as CustomerMetric }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={CustomerMetric.TOTAL_SPENT}>إجمالي الإنفاق</option>
                        <option value={CustomerMetric.ORDER_COUNT}>عدد الطلبات</option>
                        <option value={CustomerMetric.AVERAGE_ORDER_VALUE}>متوسط قيمة الطلب</option>
                        <option value={CustomerMetric.LAST_PURCHASE}>آخر عملية شراء</option>
                        <option value={CustomerMetric.PURCHASE_FREQUENCY}>تكرار الشراء</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        عدد العملاء
                      </label>
                      <input
                        type="number"
                        value={customerFilters.limit}
                        onChange={(e) => setCustomerFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Chart */}
                {customerData && (
                  <CustomerAnalyticsChart
                    data={customerData.customers}
                    metric={customerData.metric}
                    summary={customerData.summary}
                    isLoading={customerLoading}
                  />
                )}
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="space-y-6">
                {/* Inventory Filters */}
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">فلترة تحليل المخزون</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المقياس
                      </label>
                      <select
                        value={inventoryFilters.metric}
                        onChange={(e) => setInventoryFilters(prev => ({ ...prev, metric: e.target.value as InventoryMetric }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={InventoryMetric.STOCK_LEVEL}>مستوى المخزون</option>
                        <option value={InventoryMetric.TURNOVER_RATE}>معدل الدوران</option>
                        <option value={InventoryMetric.DAYS_OF_INVENTORY}>أيام المخزون</option>
                        <option value={InventoryMetric.STOCK_VALUE}>قيمة المخزون</option>
                        <option value={InventoryMetric.LOW_STOCK_ALERTS}>تنبيهات المخزون المنخفض</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        عدد المنتجات
                      </label>
                      <input
                        type="number"
                        value={inventoryFilters.limit}
                        onChange={(e) => setInventoryFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory Chart */}
                {inventoryData && (
                  <InventoryAnalyticsChart
                    data={inventoryData.inventory}
                    metric={inventoryData.metric}
                    summary={inventoryData.summary}
                    isLoading={inventoryLoading}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
