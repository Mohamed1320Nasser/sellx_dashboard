import React from 'react';
import { useStockMovementSummary, useLowStockProducts } from '../../hooks/api/useStockMovements';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import { StockMovementType } from '../../types/business';
import { formatDate } from '../../utils/dateUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  RotateCcw
} from 'lucide-react';
import Card from '../ui/Card';
import StatisticsCard from '../ui/StatisticsCard';

interface StockMovementAnalyticsProps {
  filters?: {
    startDate?: string;
    endDate?: string;
    type?: StockMovementType;
  };
}

const StockMovementAnalytics: React.FC<StockMovementAnalyticsProps> = () => {
  const { company } = useSessionAuthStore();
  
  // Only make API calls if user is authenticated and has a valid company
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useStockMovementSummary();
  const { data: lowStockData, isLoading: lowStockLoading, error: lowStockError } = useLowStockProducts();


  const getMovementTypeLabel = (type: StockMovementType) => {
    const labels = {
      [StockMovementType.PURCHASE]: 'شراء',
      [StockMovementType.SALE]: 'بيع',
      [StockMovementType.ADJUSTMENT]: 'تعديل',
      [StockMovementType.RETURN]: 'إرجاع',
    };
    return labels[type];
  };

  const getMovementTypeColor = (type: StockMovementType) => {
    const colors = {
      [StockMovementType.PURCHASE]: 'bg-green-500',
      [StockMovementType.SALE]: 'bg-red-500',
      [StockMovementType.ADJUSTMENT]: 'bg-blue-500',
      [StockMovementType.RETURN]: 'bg-orange-500',
    };
    return colors[type];
  };

  const getMovementTypeIcon = (type: StockMovementType) => {
    const icons = {
      [StockMovementType.PURCHASE]: TrendingUp,
      [StockMovementType.SALE]: TrendingDown,
      [StockMovementType.ADJUSTMENT]: Package,
      [StockMovementType.RETURN]: RotateCcw,
    };
    return icons[type];
  };

  // Check if user is authenticated
  if (!company?.companyId) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">تحليلات غير متاحة</h3>
        <p className="text-gray-500">يرجى تسجيل الدخول للوصول إلى تحليلات حركات المخزون</p>
      </div>
    );
  }

  // Show error state if API calls fail
  if (summaryError || lowStockError) {
    const errorMessage = summaryError?.message || lowStockError?.message || 'خطأ غير معروف';
    const isAuthError = errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('Cannot read properties of undefined');
    
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-gray-500">لا يمكن تحميل تحليلات حركات المخزون حالياً</p>
        
        {isAuthError ? (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>مشكلة في المصادقة:</strong> يبدو أن جلسة تسجيل الدخول منتهية الصلاحية
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> تأكد من أن الخادم يعمل بشكل صحيح
            </p>
            <p className="text-xs text-blue-700 mt-2">
              تفاصيل الخطأ: {errorMessage}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (summaryLoading || lowStockLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const summary = summaryData;
  const lowStockProducts = lowStockData?.lowStockProducts || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          icon={Activity}
          title="إجمالي الحركات"
          value={summary?.totalMovements || 0}
          color="#3B82F6"
        />

        <StatisticsCard
          icon={TrendingUp}
          title="إجمالي المشتريات"
          value={summary?.typeBreakdown?.find(t => t.type === StockMovementType.PURCHASE)?._sum.quantity || 0}
          color="#10B981"
        />

        <StatisticsCard
          icon={TrendingDown}
          title="إجمالي المبيعات"
          value={Math.abs(summary?.typeBreakdown?.find(t => t.type === StockMovementType.SALE)?._sum.quantity || 0)}
          color="#EF4444"
        />

        <StatisticsCard
          icon={AlertTriangle}
          title="منتجات منخفضة المخزون"
          value={lowStockProducts.length}
          color="#F59E0B"
        />
      </div>

      {/* Movement Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 ml-2" />
              توزيع أنواع الحركات
            </h3>
            <div className="space-y-4">
              {summary?.typeBreakdown?.map((typeData) => {
                const percentage = summary.totalMovements > 0 
                  ? (typeData._count.type / summary.totalMovements) * 100 
                  : 0;
                const Icon = getMovementTypeIcon(typeData.type);
                
                return (
                  <div key={typeData.type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 text-gray-400 ml-3" />
                      <span className="text-sm font-medium text-gray-900">
                        {getMovementTypeLabel(typeData.type)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {typeData._count.type} حركة
                      </div>
                      <div className="text-xs text-gray-500">
                        الكمية: {typeData._sum.quantity || 0}
                      </div>
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2 ml-3">
                      <div 
                        className={`h-2 rounded-full ${getMovementTypeColor(typeData.type)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-left">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              منتجات منخفضة المخزون
            </h3>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-4">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">جميع المنتجات لديها مخزون كافي</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((product) => {
                  const stockPercentage = (product.stockQuantity / product.minStockLevel) * 100;
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.sku} - {product.category.name}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-red-600">
                          {product.stockQuantity} / {product.minStockLevel}
                        </div>
                        <div className="w-16 bg-red-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {lowStockProducts.length > 5 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    و {lowStockProducts.length - 5} منتج آخر
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 ml-2" />
            الحركات الأخيرة
          </h3>
          <div className="space-y-3">
            {summary?.recentMovements?.length === 0 ? (
              <div className="text-center py-4">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">لا توجد حركات حديثة</p>
              </div>
            ) : (
              summary?.recentMovements?.map((movement) => {
                const Icon = getMovementTypeIcon(movement.type);
                const isPositive = movement.quantity > 0;
                
                return (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPositive ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="mr-3">
                        <div className="text-sm font-medium text-gray-900">{movement.product.name}</div>
                        <div className="text-xs text-gray-500">{movement.product.sku}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{movement.quantity}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(movement.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StockMovementAnalytics;
