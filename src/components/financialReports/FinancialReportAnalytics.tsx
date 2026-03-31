import React from 'react';
import { useSalesReport, useProfitLossReport, useTopSellingProducts, useSalesTrends } from '../../hooks/api/useFinancialReports';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import { ReportPeriod } from '../../types/business';
import { formatCurrency, formatDate, formatPercentage } from '../../utils';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  Calendar,
  ShoppingCart,
  RotateCcw
} from 'lucide-react';
import Card from '../ui/Card';
import { StatisticsCard, CountUpNumber } from '../ui';

interface FinancialReportAnalyticsProps {
  filters?: {
    startDate?: string;
    endDate?: string;
    period?: ReportPeriod;
  };
}

const FinancialReportAnalytics: React.FC<FinancialReportAnalyticsProps> = ({ filters = {} }) => {
  const { company } = useSessionAuthStore();
  
  // Filter out empty parameters
  const cleanFilters = {
    ...(filters.startDate && filters.startDate.trim() && { startDate: filters.startDate }),
    ...(filters.endDate && filters.endDate.trim() && { endDate: filters.endDate }),
    ...(filters.period && filters.period !== ReportPeriod.CUSTOM && { period: filters.period }),
  };

  // Fetch data
  const { data: salesData, isLoading: salesLoading, error: salesError } = useSalesReport({
    ...cleanFilters,
    limit: 1000, // Get more data for analytics
  });

  const { data: profitLossData, isLoading: profitLossLoading, error: profitLossError } = useProfitLossReport(cleanFilters);
  const { data: topSellingData, isLoading: topSellingLoading, error: topSellingError } = useTopSellingProducts(5);
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useSalesTrends(30);

  const isLoading = salesLoading || profitLossLoading || topSellingLoading || trendsLoading;
  const hasError = salesError || profitLossError || topSellingError || trendsError;

  // Check if company is available
  if (!company?.companyId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">لا يمكن تحميل التحليلات المالية بدون شركة صالحة</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatisticsCard
          icon={DollarSign}
          title="إجمالي الإيرادات"
          value="..."
          color="#10B981"
          isLoading={true}
        />
        <StatisticsCard
          icon={TrendingUp}
          title="الربح الصافي"
          value="..."
          color="#3B82F6"
          isLoading={true}
        />
        <StatisticsCard
          icon={Target}
          title="هامش الربح"
          value="..."
          color="#8B5CF6"
          isLoading={true}
        />
        <StatisticsCard
          icon={ShoppingCart}
          title="عدد الطلبات"
          value="..."
          color="#F59E0B"
          isLoading={true}
        />
        <StatisticsCard
          icon={RotateCcw}
          title="إجمالي المرتجعات"
          value="..."
          color="#EF4444"
          isLoading={true}
        />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">حدث خطأ في تحميل البيانات المالية</p>
        <p className="text-gray-500 text-sm">
          يرجى التحقق من اتصال الإنترنت أو المحاولة مرة أخرى
        </p>
      </div>
    );
  }

  const salesSummary = salesData?.summary;
  const profitLoss = profitLossData || {
    revenue: { totalRevenue: 0 },
    profit: { 
      netProfit: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      netProfitMargin: 0
    },
    expenses: { totalExpenses: 0 },
    costs: {
      totalCosts: 0,
      costOfGoodsSold: 0,
      operatingExpenses: 0,
      totalPurchases: 0,
      totalPurchaseOrders: 0
    }
  };
  const topSelling = Array.isArray(topSellingData) ? topSellingData : [];
  const trends = trendsData || { trends: [] };

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatisticsCard
          icon={DollarSign}
          title="إجمالي الإيرادات"
          value={formatCurrency(profitLoss?.revenue?.totalRevenue || 0)}
          color="#10B981"
        />
        
        <StatisticsCard
          icon={TrendingUp}
          title="الربح الصافي"
          value={formatCurrency(profitLoss?.profit?.netProfit || 0)}
          color="#3B82F6"
        />
        
        <StatisticsCard
          icon={Target}
          title="هامش الربح"
          value={formatPercentage(profitLoss?.profit?.netProfitMargin || 0, 1)}
          color="#8B5CF6"
        />
        
        <StatisticsCard
          icon={ShoppingCart}
          title="عدد الطلبات"
          value={String(salesSummary?.totalOrders || 0)}
          color="#F59E0B"
        />
        
        <StatisticsCard
          icon={RotateCcw}
          title="إجمالي المرتجعات"
          value={formatCurrency((profitLoss?.revenue as any)?.totalReturns || 0)}
          color="#EF4444"
        />
      </div>

      {/* Profit & Loss Analysis - Improved Design */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 text-blue-600 ml-2" />
          <h3 className="text-xl font-bold text-gray-900">تحليل الربح والخسارة</h3>
        </div>

        {/* Revenue Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">الإيرادات</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatisticsCard
              icon={DollarSign}
              title="إجمالي الإيرادات"
              value={formatCurrency(profitLoss?.revenue?.totalRevenue || 0)}
              color="#10B981"
              subtitle={`${(profitLoss?.revenue as any)?.totalSalesOrders || 0} طلب`}
            />
            <StatisticsCard
              icon={RotateCcw}
              title="إجمالي المرتجعات"
              value={formatCurrency((profitLoss?.revenue as any)?.totalReturns || 0)}
              color="#EF4444"
              subtitle={`${(profitLoss?.revenue as any)?.totalReturnOrders || 0} إرجاع`}
            />
            <StatisticsCard
              icon={TrendingUp}
              title="صافي الإيرادات"
              value={formatCurrency((profitLoss?.revenue as any)?.netRevenue || 0)}
              color="#3B82F6"
              subtitle={`متوسط الطلب: ${formatCurrency((profitLoss?.revenue as any)?.averageOrderValue || 0)}`}
            />
          </div>
        </div>

        {/* Costs Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">التكاليف</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatisticsCard
              icon={ShoppingCart}
              title="تكلفة البضائع المباعة"
              value={formatCurrency(profitLoss?.costs?.costOfGoodsSold || 0)}
              color="#F59E0B"
              subtitle={`من ${profitLoss?.costs?.totalPurchaseOrders || 0} عملية شراء`}
            />
            <StatisticsCard
              icon={Target}
              title="إجمالي المشتريات"
              value={formatCurrency(profitLoss?.costs?.totalPurchases || 0)}
              color="#8B5CF6"
              subtitle={`متوسط الشراء: ${formatCurrency((profitLoss?.costs?.totalPurchases || 0) / Math.max(profitLoss?.costs?.totalPurchaseOrders || 1, 1))}`}
            />
          </div>
        </div>

        {/* Profit Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">الربح</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatisticsCard
              icon={TrendingUp}
              title="الربح الإجمالي"
              value={formatCurrency(profitLoss?.profit?.grossProfit || 0)}
              color="#3B82F6"
              subtitle={`هامش: ${formatPercentage(profitLoss?.profit?.grossProfitMargin || 0, 1)}`}
            />
            <StatisticsCard
              icon={Target}
              title="الربح الصافي"
              value={formatCurrency(profitLoss?.profit?.netProfit || 0)}
              color={(profitLoss?.profit?.netProfit || 0) >= 0 ? "#10B981" : "#EF4444"}
              subtitle={`هامش: ${formatPercentage(profitLoss?.profit?.netProfitMargin || 0, 1)}`}
            />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <Card>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <PieChart className="w-6 h-6 text-green-600 ml-2" />
              <h3 className="text-xl font-bold text-gray-900">أفضل المنتجات مبيعاً</h3>
            </div>
            <div className="space-y-3">
              {topSelling.map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ml-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.product.sku}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-900">
                      <CountUpNumber value={item.totalQuantity} /> قطعة
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      <CountUpNumber value={formatCurrency(item.totalRevenue)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      {/* Sales Trends Chart */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-purple-600 ml-2" />
            <h3 className="text-xl font-bold text-gray-900">اتجاهات المبيعات (آخر 30 يوم)</h3>
          </div>
          <div className="space-y-4">
            {trends?.trends.slice(-7).map((trend) => {
              const maxRevenue = Math.max(...(trends?.trends.map(t => t.revenue) || [0]));
              const percentage = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={trend.date} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-500 ml-2" />
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(trend.date)}
                    </span>
                  </div>
                  <div className="flex items-center flex-1 ml-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="mr-4 text-left min-w-0">
                      <div className="text-sm font-bold text-gray-900">
                        <CountUpNumber value={formatCurrency(trend.revenue)} />
                      </div>
                      <div className="text-xs font-medium text-gray-600">
                        <CountUpNumber value={trend.orders} /> طلب
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialReportAnalytics;
