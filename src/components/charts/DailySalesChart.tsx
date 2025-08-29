import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useDailySales } from '../../hooks/useSalesData';
import { formatCurrency, formatNumber } from '../../lib/format';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';

type ChartMode = 'gmv' | 'orders' | 'units';

export const DailySalesChart: React.FC = () => {
  const [mode, setMode] = useState<ChartMode>('gmv');
  const { data, isLoading, error, refetch } = useDailySales();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <ErrorMessage 
          message="Не удалось загрузить данные по продажам"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          Нет данных для отображения
        </div>
      </div>
    );
  }

  const getYAxisConfig = () => {
    switch (mode) {
      case 'gmv':
        return {
          tickFormatter: (value: number) => formatCurrency(value, { notation: 'compact' }),
        };
      case 'orders':
      case 'units':
        return {
          tickFormatter: (value: number) => formatNumber(value, { notation: 'compact' }),
        };
    }
  };

  const getTooltipFormatter = () => {
    switch (mode) {
      case 'gmv':
        return (value: number) => [formatCurrency(value), 'GMV'];
      case 'orders':
        return (value: number) => [formatNumber(value), 'Заказы'];
      case 'units':
        return (value: number) => [formatNumber(value), 'Единицы'];
    }
  };

  const getDataKey = () => {
    switch (mode) {
      case 'gmv':
        return 'gmv';
      case 'orders':
        return 'orders';
      case 'units':
        return 'units';
    }
  };

  const getLineColor = () => {
    switch (mode) {
      case 'gmv':
        return '#4f46e5';
      case 'orders':
        return '#059669';
      case 'units':
        return '#dc2626';
    }
  };

  const formatXAxisLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Динамика продаж
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('gmv')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'gmv' 
                ? 'bg-ozon-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            GMV
          </button>
          <button
            onClick={() => setMode('orders')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'orders' 
                ? 'bg-ozon-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Заказы
          </button>
          <button
            onClick={() => setMode('units')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'units' 
                ? 'bg-ozon-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Единицы
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              className="dark:stroke-gray-400"
              fontSize={12}
            />
            <YAxis 
              {...getYAxisConfig()}
              stroke="#64748b"
              className="dark:stroke-gray-400"
              fontSize={12}
            />
            <Tooltip
              formatter={getTooltipFormatter()}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                });
              }}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e2e8f0)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'var(--tooltip-text, #1f2937)'
              }}
              wrapperClassName="[&_.recharts-tooltip]:!bg-white [&_.recharts-tooltip]:dark:!bg-gray-800 [&_.recharts-tooltip]:dark:!border-gray-600 [&_.recharts-tooltip]:dark:!text-gray-100"
            />
            <Line
              type="monotone"
              dataKey={getDataKey()}
              stroke={getLineColor()}
              strokeWidth={2}
              dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: getLineColor(), strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};