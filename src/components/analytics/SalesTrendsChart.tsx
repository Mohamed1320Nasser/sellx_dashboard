import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { TrendingUp, TrendingDown, BarChart3, AreaChart as AreaChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { formatNumber, formatCurrency } from "../../utils/currencyUtils";
import { TrendPeriod, TrendMetric } from "../../types/business";
import { CountUpNumber } from "../ui";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface SalesTrendsChartProps {
  data: Array<{
    period: string;
    value: number;
  }>;
  period: TrendPeriod;
  metric: TrendMetric;
  summary: {
    totalPeriods: number;
    averageValue: number;
    maxValue: number;
    minValue: number;
  };
  isLoading?: boolean;
}

const SalesTrendsChart: React.FC<SalesTrendsChartProps> = ({
  data,
  period,
  metric,
  summary,
  isLoading = false,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'doughnut'>('line');

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

  const getMetricLabel = (metric: TrendMetric) => {
    switch (metric) {
      case TrendMetric.REVENUE:
        return "الإيرادات";
      case TrendMetric.ORDERS:
        return "الطلبات";
      case TrendMetric.UNITS_SOLD:
        return "الوحدات المباعة";
      case TrendMetric.AVERAGE_ORDER_VALUE:
        return "متوسط قيمة الطلب";
      default:
        return "القيمة";
    }
  };

  const getPeriodLabel = (period: TrendPeriod) => {
    switch (period) {
      case TrendPeriod.DAILY:
        return "يومي";
      case TrendPeriod.WEEKLY:
        return "أسبوعي";
      case TrendPeriod.MONTHLY:
        return "شهري";
      case TrendPeriod.QUARTERLY:
        return "ربعي";
      case TrendPeriod.YEARLY:
        return "سنوي";
      default:
        return "فترة";
    }
  };

  const formatTooltipValue = (value: number) => {
    if (metric === TrendMetric.REVENUE || metric === TrendMetric.AVERAGE_ORDER_VALUE) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  const formatYAxisValue = (value: number) => {
    if (metric === TrendMetric.REVENUE || metric === TrendMetric.AVERAGE_ORDER_VALUE) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  const growthRate = summary && summary.totalPeriods > 1 
    ? ((summary.maxValue - summary.minValue) / summary.minValue) * 100 
    : 0;

  // Chart.js configuration
  const safeData = Array.isArray(data) ? data : [];
  const chartData = {
    labels: safeData.map(item => item.period),
    datasets: [
      {
        label: getMetricLabel(metric),
        data: safeData.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : 
                         chartType === 'bar' ? 'rgba(59, 130, 246, 0.8)' : 
                         'rgba(59, 130, 246, 0.8)',
        borderWidth: 3,
        fill: chartType === 'line',
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Doughnut chart data (for pie chart option)
  const doughnutData = {
    labels: safeData.map(item => item.period),
    datasets: [
      {
        data: safeData.map(item => item.value),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
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
          title: (context: any) => `الفترة: ${context[0].label}`,
          label: (context: any) => {
            return `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed.y || context.parsed)}`;
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
            size: 12,
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
    elements: {
      point: {
        hoverBackgroundColor: '#3b82f6',
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 3,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
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
          title: (context: any) => `الفترة: ${context[0].label}`,
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${getMetricLabel(metric)}: ${formatTooltipValue(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              اتجاهات {getMetricLabel(metric)}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              تحليل {getPeriodLabel(period)} للفترة المحددة
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <AreaChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">خط</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">أعمدة</span>
            </button>
            <button
              onClick={() => setChartType('doughnut')}
              className={`flex items-center space-x-1 rtl:space-x-reverse px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                chartType === 'doughnut'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">دائري</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {growthRate > 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              growthRate > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatNumber(Math.abs(growthRate), { maximumFractionDigits: 1 })}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">إجمالي الفترات</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(summary?.totalPeriods || 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">متوسط القيمة</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatTooltipValue(summary?.averageValue || 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">أعلى قيمة</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatTooltipValue(summary?.maxValue || 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">أقل قيمة</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatTooltipValue(summary?.minValue || 0)}
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4">
        {chartType === 'line' && (
          <Line data={chartData} options={options} />
        )}
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

export default SalesTrendsChart;
