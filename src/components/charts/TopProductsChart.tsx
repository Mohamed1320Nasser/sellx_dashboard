import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui';

const mockData = [
  { name: 'آيفون 15', sales: 120 },
  { name: 'سماعات AirPods', sales: 98 },
  { name: 'ساعة ذكية', sales: 86 },
  { name: 'شاحن سريع', sales: 75 },
  { name: 'حافظة جوال', sales: 60 },
];

interface TopProductsChartProps {
  data?: typeof mockData;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data = mockData }) => {
  // Gradient colors - darker for higher values
  const getColor = (index: number) => {
    const colors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
    return colors[index];
  };

  return (
    <Card padding="lg" shadow="xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">المنتجات الأكثر مبيعاً</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          عرض الكل ←
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'Almarai' }} />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#94a3b8"
            style={{ fontSize: '12px', fontFamily: 'Almarai' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'Almarai'
            }}
            cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
          />
          <Bar dataKey="sales" radius={[0, 8, 8, 0]} name="المبيعات">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopProductsChart;
