import React from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatNumber, formatCurrency } from "../../utils/currencyUtils";
import { DashboardSummary as DashboardSummaryType } from "../../types/business";
import { StatisticsCard } from "../ui";

interface DashboardSummaryProps {
  data: DashboardSummaryType;
  isLoading?: boolean;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatisticsCard
          icon={DollarSign}
          title="الإيرادات الحالية"
          value="..."
          color="#10B981"
          isLoading={true}
        />
        <StatisticsCard
          icon={ShoppingCart}
          title="الطلبات الحالية"
          value="..."
          color="#3B82F6"
          isLoading={true}
        />
        <StatisticsCard
          icon={Users}
          title="إجمالي العملاء"
          value="..."
          color="#8B5CF6"
          isLoading={true}
        />
        <StatisticsCard
          icon={TrendingUp}
          title="إجمالي الإيرادات"
          value="..."
          color="#F59E0B"
          isLoading={true}
        />
      </div>
    );
  }

  const { 
    overview = {
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
    topProducts = [],
    lowStockProducts = [],
    alerts = {
      lowStockCount: 0,
      outOfStockCount: 0,
    }
  } = data || {};


  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          icon={DollarSign}
          title="الإيرادات الحالية"
          value={formatCurrency(overview.currentRevenue)}
          color="#10B981"
          growth={{
            value: Math.abs(overview.revenueGrowth),
            isPositive: overview.revenueGrowth >= 0
          }}
          subtitle="من الشهر الماضي"
        />
        
        <StatisticsCard
          icon={ShoppingCart}
          title="الطلبات الحالية"
          value={formatNumber(overview.currentOrders)}
          color="#3B82F6"
          growth={{
            value: Math.abs(overview.orderGrowth),
            isPositive: overview.orderGrowth >= 0
          }}
          subtitle="من الشهر الماضي"
        />
        
        <StatisticsCard
          icon={Users}
          title="إجمالي العملاء"
          value={formatNumber(overview.customerCount)}
          color="#8B5CF6"
          subtitle="عملاء مسجلين"
        />
        
        <StatisticsCard
          icon={TrendingUp}
          title="إجمالي الإيرادات"
          value={formatCurrency(overview.totalRevenue)}
          color="#F59E0B"
          subtitle="منذ البداية"
        />
      </div>

      {/* Alerts Section */}
      {alerts.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 ml-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                تنبيهات المخزون
              </h3>
              <p className="text-sm text-red-700">
                {alerts.lowStockCount} منتج منخفض المخزون، {alerts.outOfStockCount} منتج نفد من المخزون
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Products and Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">أفضل المنتجات</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                  <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-500">{formatNumber(product.unitsSold)} وحدة</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">منتجات منخفضة المخزون</h3>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center ml-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-red-600">{formatNumber(product.stockQuantity)}</p>
                    <p className="text-sm text-gray-500">من {formatNumber(product.minStockLevel)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-center">
                <div>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">جميع المنتجات في مستوى مخزون جيد</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
