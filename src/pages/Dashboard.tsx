import React from 'react';
import { Layout } from '../components/layout';
import { StatisticsCard } from '../components/ui';
import { useDashboardSummary } from '../hooks/api/useAnalytics';
import SessionRouteGuard from '../components/auth/SessionRouteGuard';
import { SalesOverviewChart, RevenueBreakdownChart, TopProductsChart } from '../components/charts';
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Truck,
  Receipt,
  UserCog,
  BarChart3,
  Target,
  Eye,
  RotateCcw,
  Calendar,
  Activity,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../utils/currencyUtils';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // Get dashboard data
    const { data: dashboardData, isLoading, error } = useDashboardSummary();

    // Dynamic font size function for Daily Performance Summary
    const getDynamicFontSize = (val: string | number): string => {
        const valueStr = String(val);
        const length = valueStr.length;
        
        // For single digits (1-9) - BIGGER
        if (length === 1 && /^\d$/.test(valueStr)) {
            return "text-2xl"; // Bigger for single digits
        }
        
        // For double digits (10-99) - BIGGER
        if (length === 2 && /^\d{2}$/.test(valueStr)) {
            return "text-3xl"; // Bigger for double digits
        }
        
        // For currency values with decimals (like 35,180.00)
        if (valueStr.includes(',') || valueStr.includes('.')) {
            if (length <= 8) return "text-2xl"; // Bigger for currency
            if (length <= 12) return "text-xl"; // Medium for longer currency
            return "text-lg"; // Smaller for very long currency
        }
        
        // For regular numbers
        if (length <= 3) return "text-3xl"; // Bigger for short numbers
        if (length <= 5) return "text-2xl"; // Bigger for medium numbers
        if (length <= 8) return "text-xl"; // Medium for longer numbers
        return "text-lg"; // Smaller for very long numbers
    };
    
    
    // Mock data for when API is not available
    const mockData = {
        overview: {
            currentRevenue: 0,
            currentReturns: 0,
            currentNetRevenue: 0,
            previousRevenue: 0,
            previousReturns: 0,
            previousNetRevenue: 0,
            revenueGrowth: 0,
            currentOrders: 0,
            previousOrders: 0,
            orderGrowth: 0,
            totalRevenue: 0,
            totalReturns: 0,
            netRevenue: 0,
            customerCount: 0,
            newCustomersToday: 0,
            totalProducts: 0,
            totalSuppliers: 0,
            currentPurchases: 0,
            previousPurchases: 0,
            purchaseGrowth: 0,
            currentPurchaseOrders: 0,
            previousPurchaseOrders: 0,
            purchaseOrderGrowth: 0,
            totalPurchaseValue: 0,
            grossProfit: 0,
            profitMargin: 0,
            averageOrderValue: 0,
            returnRate: 0,
            pendingPayments: 0,
            completedPayments: 0,
        },
        topProducts: [],
        lowStockProducts: [],
        alerts: {
            lowStockCount: 0,
            outOfStockCount: 0,
        },
    };

    const data = dashboardData?.overview ? dashboardData : mockData;

    // Show the layout and use mock data while loading
    if (error) {
        // Handle error silently or show user-friendly message
    }


    return (
        <SessionRouteGuard>
            <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {/* Error message */}
                {error && (
                    <div className="max-w-full mx-auto py-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">
                                ⚠️ لا يمكن تحميل البيانات. تأكد من تسجيل الدخول بشكل صحيح.
                            </p>
                        </div>
                    </div>
                )}

                <div className="w-full">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <StatisticsCard
                            icon={DollarSign}
                            title="الإيرادات الحالية"
                            value={isLoading ? '...' : formatCurrency(data?.overview?.currentRevenue || 0)}
                            color="#10B981"
                            growth={!isLoading ? {
                                value: data?.overview?.revenueGrowth || 0,
                                isPositive: (data?.overview?.revenueGrowth || 0) >= 0
                            } : undefined}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={ShoppingCart}
                            title="الطلبات الحالية"
                            value={isLoading ? '...' : formatNumber(data?.overview?.currentOrders || 0)}
                            color="#3B82F6"
                            growth={!isLoading ? {
                                value: data?.overview?.orderGrowth || 0,
                                isPositive: (data?.overview?.orderGrowth || 0) >= 0
                            } : undefined}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={Package}
                            title="إجمالي المنتجات"
                            value={isLoading ? '...' : formatNumber(data?.overview?.totalProducts || 0)}
                            color="#8B5CF6"
                            subtitle={isLoading ? '...' : `${data?.overview?.totalSuppliers || 0} مورد`}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={Users}
                            title="العملاء النشطون"
                            value={isLoading ? '...' : formatNumber(data?.overview?.customerCount || 0)}
                            color="#F59E0B"
                            subtitle={isLoading ? '...' : `${data?.overview?.completedPayments || 0} دفعة مكتملة`}
                            isLoading={isLoading}
                        />

                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <StatisticsCard
                            icon={TrendingUp}
                            title="الربح الإجمالي"
                            value={isLoading ? '...' : formatCurrency(data?.overview?.grossProfit || 0)}
                            color="#10B981"
                            subtitle={isLoading ? '...' : `هامش ربح ${(data?.overview?.profitMargin || 0).toFixed(1)}%`}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={Truck}
                            title="المشتريات الحالية"
                            value={isLoading ? '...' : formatCurrency(data?.overview?.currentPurchases || 0)}
                            color="#6366F1"
                            growth={!isLoading ? {
                                value: data?.overview?.purchaseGrowth || 0,
                                isPositive: (data?.overview?.purchaseGrowth || 0) >= 0
                            } : undefined}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={RotateCcw}
                            title="المرتجعات"
                            value={isLoading ? '...' : formatCurrency(data?.overview?.currentReturns || 0)}
                            color="#EF4444"
                            subtitle={isLoading ? '...' : `صافي الإيرادات ${formatCurrency(data?.overview?.currentNetRevenue || 0)}`}
                            isLoading={isLoading}
                        />

                        <StatisticsCard
                            icon={AlertTriangle}
                            title="مخزون منخفض"
                            value={isLoading ? '...' : formatNumber(data?.alerts?.lowStockCount || 0)}
                            color="#F59E0B"
                            subtitle={isLoading ? '...' : `${data?.alerts?.outOfStockCount || 0} منتج نفد`}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Daily Performance Summary */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
                        <div className="flex items-center mb-6">
                            <Calendar className="w-6 h-6 text-blue-600 ml-2" />
                            <h2 className="text-xl font-bold text-gray-900">ملخص الأداء اليومي</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700">مبيعات اليوم</p>
                                        <p className={`${getDynamicFontSize(formatCurrency(data?.overview?.currentRevenue || 0))} font-bold text-green-800`}>
                                            {isLoading ? '...' : formatCurrency(data?.overview?.currentRevenue || 0)}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="mt-2 flex items-center">
                                    {data?.overview?.revenueGrowth >= 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-600 ml-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-600 ml-1" />
                                    )}
                                    <span className={`text-sm font-medium ${
                                        data?.overview?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {Math.abs(data?.overview?.revenueGrowth || 0).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-700">طلبات اليوم</p>
                                        <p className={`${getDynamicFontSize(formatNumber(data?.overview?.currentOrders || 0))} font-bold text-blue-800`}>
                                            {isLoading ? '...' : formatNumber(data?.overview?.currentOrders || 0)}
                                        </p>
                                    </div>
                                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="mt-2 flex items-center">
                                    {data?.overview?.orderGrowth >= 0 ? (
                                        <ArrowUp className="w-4 h-4 text-green-600 ml-1" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-600 ml-1" />
                                    )}
                                    <span className={`text-sm font-medium ${
                                        data?.overview?.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {Math.abs(data?.overview?.orderGrowth || 0).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-700">عملاء جدد اليوم</p>
                                        <p className={`${getDynamicFontSize(data?.overview?.newCustomersToday || 0)} font-bold text-purple-800`}>
                                            {isLoading ? '...' : formatNumber(data?.overview?.newCustomersToday || 0)}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="mt-2">
                                    <span className="text-sm text-purple-600">من إجمالي {formatNumber(data?.overview?.customerCount || 0)} عميل</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-orange-700">متوسط قيمة الطلب</p>
                                        <p className={`${getDynamicFontSize(formatCurrency(data?.overview?.averageOrderValue || 0))} font-bold text-orange-800`}>
                                            {isLoading ? '...' : formatCurrency(data?.overview?.averageOrderValue || 0)}
                                        </p>
                                    </div>
                                    <Target className="w-8 h-8 text-orange-600" />
                                </div>
                                <div className="mt-2">
                                    <span className="text-sm text-orange-600">لليوم الحالي</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
                        <div className="flex items-center mb-6">
                            <Activity className="w-6 h-6 text-indigo-600 ml-2" />
                            <h2 className="text-xl font-bold text-gray-900">الأنشطة الأخيرة</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center ml-3">
                                    <Receipt className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">مبيعات جديدة</p>
                                    <p className="text-sm text-gray-600">
                                        {isLoading ? '...' : `${data?.overview?.currentOrders || 0} طلب جديد اليوم`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-green-600">
                                        {isLoading ? '...' : formatCurrency(data?.overview?.currentRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">اليوم</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">عملاء جدد اليوم</p>
                                    <p className="text-sm text-gray-600">
                                        {isLoading ? '...' : `${formatNumber(data?.overview?.newCustomersToday || 0)} عميل جديد`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-blue-600">
                                        {isLoading ? '...' : formatNumber(data?.overview?.customerCount || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">إجمالي العملاء</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center ml-3">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">منتجات في المخزون</p>
                                    <p className="text-sm text-gray-600">
                                        {isLoading ? '...' : `${data?.overview?.totalProducts || 0} منتج متاح`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-purple-600">
                                        {isLoading ? '...' : formatNumber(data?.alerts?.lowStockCount || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">مخزون منخفض</p>
                                </div>
                            </div>

                            <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center ml-3">
                                    <Truck className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">مشتريات جديدة</p>
                                    <p className="text-sm text-gray-600">
                                        {isLoading ? '...' : `${data?.overview?.currentPurchaseOrders || 0} طلب شراء`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-orange-600">
                                        {isLoading ? '...' : formatCurrency(data?.overview?.currentPurchases || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">قيمة المشتريات</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <BarChart3 className="w-7 h-7 text-primary-600 ml-2" />
                            التحليلات والإحصائيات
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Sales Overview Chart */}
                            <SalesOverviewChart />

                            {/* Revenue Breakdown Chart */}
                            <RevenueBreakdownChart />
                        </div>

                        {/* Top Products Chart - Full Width */}
                        <div className="mt-6">
                            <TopProductsChart />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">الوصول السريع</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {[
                                { name: 'الفئات', icon: Package, color: 'blue', path: '/categories' },
                                { name: 'المنتجات', icon: Package, color: 'green', path: '/products' },
                                { name: 'المبيعات', icon: Receipt, color: 'purple', path: '/sales' },
                                { name: 'العملاء', icon: Users, color: 'orange', path: '/clients' },
                                { name: 'الموردين', icon: Truck, color: 'indigo', path: '/suppliers' },
                                { name: 'المستخدمين', icon: UserCog, color: 'red', path: '/users' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`flex flex-col items-center p-4 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 hover:from-${item.color}-100 hover:to-${item.color}-200 border border-${item.color}-200 hover:border-${item.color}-300 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-1 group`}
                                    >
                                        <Icon className={`w-6 h-6 text-${item.color}-600 mb-2 group-hover:scale-110 transition-transform`} />
                                        <span className="text-sm font-semibold text-gray-900 text-center">{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <BarChart3 className="w-6 h-6 text-green-600 ml-2" />
                                <h2 className="text-xl font-bold text-gray-900">أفضل المنتجات مبيعاً</h2>
                            </div>
                            <button
                                onClick={() => navigate('/products')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                            >
                                عرض الكل
                                <Eye className="w-4 h-4 mr-1" />
                            </button>
                        </div>
                        {isLoading ? (
                                <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : data.topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {data.topProducts.slice(0, 5).map((product: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                                                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                                                </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-sm text-gray-500">{product.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                                                <p className="text-sm text-gray-500">{product.unitsSold} وحدة</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">لا توجد بيانات متاحة</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
        </SessionRouteGuard>
    );
};

export default Dashboard;
