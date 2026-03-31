import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Package, AlertTriangle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { formatNumber, formatCurrency } from "../../utils/currencyUtils";
import { InventoryMetric } from "../../types/business";
import { CountUpNumber } from "../ui";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface InventoryAnalyticsChartProps {
  data: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
      category: {
        id: string;
        name: string;
      };
      stockQuantity: number;
      minStockLevel: number;
    };
    metrics: {
      stockLevel: number;
      turnoverRate: number;
      daysOfInventory: number;
      stockValue: number;
      stockStatus: "LOW" | "MEDIUM" | "GOOD";
      isLowStock: boolean;
      totalUnitsSold: number;
    };
  }>;
  metric: InventoryMetric;
  summary: {
    totalProducts: number;
    totalStockValue: number;
    averageStockLevel: number;
    lowStockCount: number;
    averageTurnoverRate: number;
  };
  isLoading?: boolean;
}

const InventoryAnalyticsChart: React.FC<InventoryAnalyticsChartProps> = ({
  data,
  metric,
  summary,
  isLoading = false,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'doughnut'>('bar');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getMetricLabel = (metric: InventoryMetric) => {
    switch (metric) {
      case InventoryMetric.STOCK_LEVEL:
        return "مستوى المخزون";
      case InventoryMetric.TURNOVER_RATE:
        return "معدل الدوران";
      case InventoryMetric.DAYS_OF_INVENTORY:
        return "أيام المخزون";
      case InventoryMetric.STOCK_VALUE:
        return "قيمة المخزون";
      case InventoryMetric.LOW_STOCK_ALERTS:
        return "تنبيهات المخزون المنخفض";
      default:
        return "المخزون";
    }
  };

  const formatTooltipValue = (value: number) => {
    if (metric === InventoryMetric.STOCK_VALUE) {
      return formatCurrency(value);
    }
    if (metric === InventoryMetric.TURNOVER_RATE || metric === InventoryMetric.DAYS_OF_INVENTORY) {
      return `${formatNumber(value, { maximumFractionDigits: 1 })}`;
    }
    return formatNumber(value);
  };

  const formatYAxisValue = (value: number) => {
    if (metric === InventoryMetric.STOCK_VALUE) {
      return formatCurrency(value);
    }
    if (metric === InventoryMetric.TURNOVER_RATE || metric === InventoryMetric.DAYS_OF_INVENTORY) {
      return `${formatNumber(value, { maximumFractionDigits: 1 })}`;
    }
    return formatNumber(value);
  };


  // Generate diverse colors for different products
  const getProductColor = (index: number, status: string) => {
    const baseColors = [
      "#3b82f6", // Blue
      "#10b981", // Green
      "#f59e0b", // Orange
      "#ef4444", // Red
      "#8b5cf6", // Purple
      "#06b6d4", // Cyan
      "#84cc16", // Lime
      "#f97316", // Orange
      "#ec4899", // Pink
      "#6366f1", // Indigo
    ];
    
    // Use status-based color if available, otherwise use index-based color
    if (status === "LOW") return "#ef4444";
    if (status === "MEDIUM") return "#f59e0b";
    if (status === "GOOD") return "#10b981";
    
    return baseColors[index % baseColors.length];
  };

  // Prepare chart data
  const safeData = Array.isArray(data) ? data : [];
  const chartData = {
    labels: safeData.map(item => item.product.name.length > 15 
      ? item.product.name.substring(0, 15) + '...' 
      : item.product.name),
    datasets: [
      {
        label: getMetricLabel(metric),
        data: safeData.map(item => {
          switch (metric) {
            case InventoryMetric.STOCK_LEVEL:
              return item.metrics.stockLevel;
            case InventoryMetric.TURNOVER_RATE:
              return item.metrics.turnoverRate;
            case InventoryMetric.DAYS_OF_INVENTORY:
              return item.metrics.daysOfInventory;
            case InventoryMetric.STOCK_VALUE:
              return item.metrics.stockValue;
            case InventoryMetric.LOW_STOCK_ALERTS:
              return item.metrics.isLowStock ? 1 : 0;
            default:
              return item.metrics.stockLevel;
          }
        }),
        backgroundColor: safeData.map((item, index) => getProductColor(index, item.metrics.stockStatus)),
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Doughnut chart data
  const doughnutData = {
    labels: safeData.map(item => item.product.name.length > 20 
      ? item.product.name.substring(0, 20) + '...' 
      : item.product.name),
    datasets: [
      {
        data: safeData.map(item => {
          switch (metric) {
            case InventoryMetric.STOCK_LEVEL:
              return item.metrics.stockLevel;
            case InventoryMetric.TURNOVER_RATE:
              return item.metrics.turnoverRate;
            case InventoryMetric.DAYS_OF_INVENTORY:
              return item.metrics.daysOfInventory;
            case InventoryMetric.STOCK_VALUE:
              return item.metrics.stockValue;
            case InventoryMetric.LOW_STOCK_ALERTS:
              return item.metrics.isLowStock ? 1 : 0;
            default:
              return item.metrics.stockLevel;
          }
        }),
        backgroundColor: safeData.map((item, index) => getProductColor(index, item.metrics.stockStatus)),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          title: (context: any) => {
            const product = data[context[0].dataIndex];
            return product.product.name;
          },
          label: (context: any) => {
            const product = data[context.dataIndex];
            const statusText = product.metrics.stockStatus === "LOW" ? "منخفض" : 
                             product.metrics.stockStatus === "MEDIUM" ? "متوسط" : "جيد";
            return [
              `SKU: ${product.product.sku}`,
              `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed.y)}`,
              `الفئة: ${product.product.category.name}`,
              `حالة المخزون: ${statusText}`,
              `الكمية الحالية: ${product.product.stockQuantity}`,
            ];
          },
        },
      },
    },
    scales: chartType !== 'doughnut' ? {
      x: {
        grid: {
          display: true,
          color: 'rgba(226, 232, 240, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          color: '#cbd5e1',
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(226, 232, 240, 0.6)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          callback: function(value: any) {
            return formatYAxisValue(value);
          },
        },
        border: {
          color: '#cbd5e1',
        },
      },
    } : undefined,
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        callbacks: {
          title: (context: any) => {
            const product = data[context[0].dataIndex];
            return product.product.name;
          },
          label: (context: any) => {
            const product = data[context.dataIndex];
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            const statusText = product.metrics.stockStatus === "LOW" ? "منخفض" : 
                             product.metrics.stockStatus === "MEDIUM" ? "متوسط" : "جيد";
            return [
              `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed)} (${percentage}%)`,
              `حالة المخزون: ${statusText}`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Package className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              تحليل المخزون - {getMetricLabel(metric)}
            </h3>
            <p className="text-sm text-gray-500">
              تحليل حالة المخزون والتنبيهات
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>أعمدة</span>
            </button>
            <button
              onClick={() => setChartType('doughnut')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'doughnut'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PieChartIcon className="h-4 w-4" />
              <span>دائري</span>
            </button>
          </div>
          {summary.lowStockCount > 0 && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {summary.lowStockCount} منتج منخفض المخزون
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">إجمالي المنتجات</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatNumber(summary.totalProducts)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">قيمة المخزون</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatCurrency(summary.totalStockValue)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">متوسط مستوى المخزون</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatNumber(summary.averageStockLevel)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">متوسط معدل الدوران</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatNumber(summary.averageTurnoverRate, { maximumFractionDigits: 1 })} suffix="%" />
          </p>
        </div>
      </div>

      {/* Stock Status Legend */}
      <div className="mb-4 flex items-center justify-center space-x-6 rtl:space-x-reverse">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
          <span className="text-sm text-gray-600">مخزون جيد</span>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
          <span className="text-sm text-gray-600">مخزون متوسط</span>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
          <span className="text-sm text-gray-600">مخزون منخفض</span>
        </div>
      </div>

      <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 sm:p-4">
        {chartType === 'bar' && (
          <Bar data={chartData} options={options} />
        )}
        {chartType === 'doughnut' && (
          <Doughnut data={doughnutData} options={doughnutOptions} />
        )}
      </div>
    </div>
  );
};

export default InventoryAnalyticsChart;