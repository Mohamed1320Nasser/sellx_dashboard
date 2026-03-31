import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui';

const mockData = [
  { name: 'نقدي', value: 45000, color: '#10b981' },
  { name: 'بطاقة', value: 30000, color: '#3b82f6' },
  { name: 'تحويل', value: 15000, color: '#f59e0b' },
  { name: 'آجل', value: 10000, color: '#ef4444' },
];

interface RevenueBreakdownChartProps {
  data?: typeof mockData;
}

const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({ data = mockData }) => {
  const COLORS = data.map(item => item.color);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card padding="lg" shadow="xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">توزيع الإيرادات</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'Almarai'
            }}
            formatter={(value: number) => `${value.toLocaleString()} ج.م`}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with percentages */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {data.map((item) => {
          const percentage = ((item.value / total) * 100).toFixed(1);

          return (
            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {item.value.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-gray-500">{percentage}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RevenueBreakdownChart;
