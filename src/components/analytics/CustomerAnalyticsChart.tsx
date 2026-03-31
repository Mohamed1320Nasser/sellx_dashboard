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
import { Users, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { formatNumber, formatCurrency } from "../../utils/currencyUtils";
import { CustomerMetric } from "../../types/business";
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

interface CustomerAnalyticsChartProps {
  data: Array<{
    customer: {
      id: number;
      name: string;
      email: string;
      phone: string;
    };
    metrics: {
      totalSpent: number;
      orderCount: number;
      averageOrderValue: number;
      lastPurchase: string | null;
      purchaseFrequency: number;
      totalUnits: number;
    };
  }>;
  metric: CustomerMetric;
  summary: {
    totalCustomers: number;
    averageTotalSpent: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  isLoading?: boolean;
}

const CustomerAnalyticsChart: React.FC<CustomerAnalyticsChartProps> = ({
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

  const getMetricLabel = (metric: CustomerMetric) => {
    switch (metric) {
      case CustomerMetric.TOTAL_SPENT:
        return "إجمالي الإنفاق";
      case CustomerMetric.ORDER_COUNT:
        return "عدد الطلبات";
      case CustomerMetric.AVERAGE_ORDER_VALUE:
        return "متوسط قيمة الطلب";
      case CustomerMetric.LAST_PURCHASE:
        return "آخر شراء";
      case CustomerMetric.PURCHASE_FREQUENCY:
        return "تكرار الشراء";
      default:
        return "الإنفاق";
    }
  };

  const formatTooltipValue = (value: number) => {
    if (metric === CustomerMetric.TOTAL_SPENT || metric === CustomerMetric.AVERAGE_ORDER_VALUE) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  const formatYAxisValue = (value: number) => {
    if (metric === CustomerMetric.TOTAL_SPENT || metric === CustomerMetric.AVERAGE_ORDER_VALUE) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  // Prepare chart data
  const safeData = Array.isArray(data) ? data : [];
  const chartData = {
    labels: safeData.map(item => item.customer.name.length > 15 
      ? item.customer.name.substring(0, 15) + '...' 
      : item.customer.name),
    datasets: [
      {
        label: getMetricLabel(metric),
        data: safeData.map(item => {
          switch (metric) {
            case CustomerMetric.TOTAL_SPENT:
              return item.metrics.totalSpent;
            case CustomerMetric.ORDER_COUNT:
              return item.metrics.orderCount;
            case CustomerMetric.AVERAGE_ORDER_VALUE:
              return item.metrics.averageOrderValue;
            case CustomerMetric.PURCHASE_FREQUENCY:
              return item.metrics.purchaseFrequency;
            default:
              return item.metrics.totalSpent;
          }
        }),
        backgroundColor: [
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#3b82f6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#ec4899',
          '#6366f1',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Doughnut chart data
  const doughnutData = {
    labels: safeData.map(item => item.customer.name.length > 20 
      ? item.customer.name.substring(0, 20) + '...' 
      : item.customer.name),
    datasets: [
      {
        data: safeData.map(item => {
          switch (metric) {
            case CustomerMetric.TOTAL_SPENT:
              return item.metrics.totalSpent;
            case CustomerMetric.ORDER_COUNT:
              return item.metrics.orderCount;
            case CustomerMetric.AVERAGE_ORDER_VALUE:
              return item.metrics.averageOrderValue;
            case CustomerMetric.PURCHASE_FREQUENCY:
              return item.metrics.purchaseFrequency;
            default:
              return item.metrics.totalSpent;
          }
        }),
        backgroundColor: [
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#3b82f6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#ec4899',
          '#6366f1',
        ],
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
            const customer = data[context[0].dataIndex];
            return customer.customer.name;
          },
          label: (context: any) => {
            const customer = data[context.dataIndex];
            return [
              `البريد: ${customer.customer.email}`,
              `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed.y)}`,
              `الهاتف: ${customer.customer.phone}`,
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
            const customer = data[context[0].dataIndex];
            return customer.customer.name;
          },
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return [
              `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed)} (${percentage}%)`,
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              تحليل العملاء - {getMetricLabel(metric)}
            </h3>
            <p className="text-sm text-gray-500">
              تحليل أداء العملاء والإنفاق
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-purple-100 text-purple-700'
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
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PieChartIcon className="h-4 w-4" />
              <span>دائري</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">إجمالي العملاء</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatNumber(summary.totalCustomers)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">متوسط الإنفاق</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatCurrency(summary.averageTotalSpent)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatCurrency(summary.totalRevenue)} />
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUpNumber value={formatCurrency(summary.averageOrderValue)} />
          </p>
        </div>
      </div>

      <div className="h-96 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4">
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

export default CustomerAnalyticsChart;