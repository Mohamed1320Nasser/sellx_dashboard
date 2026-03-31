import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui';

// Sample data - replace with real data from props
const mockData = [
  { date: '01/01', sales: 4000, target: 3500 },
  { date: '02/01', sales: 3000, target: 3500 },
  { date: '03/01', sales: 5000, target: 3500 },
  { date: '04/01', sales: 4500, target: 3500 },
  { date: '05/01', sales: 6000, target: 3500 },
  { date: '06/01', sales: 5500, target: 3500 },
  { date: '07/01', sales: 7000, target: 3500 },
];

interface SalesOverviewChartProps {
  data?: typeof mockData;
}

const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ data = mockData }) => {
  return (
    <Card padding="lg" shadow="xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">نظرة عامة على المبيعات</h3>
          <p className="text-sm text-gray-600">آخر 7 أيام</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button className="px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors">
            يومي
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            أسبوعي
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            شهري
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px', fontFamily: 'Almarai' }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px', fontFamily: 'Almarai' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'Almarai'
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              fontFamily: 'Almarai'
            }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="المبيعات"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="الهدف"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SalesOverviewChart;
