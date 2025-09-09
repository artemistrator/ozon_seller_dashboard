import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useFinanceCostAnalysis } from '../../hooks/useFinanceCostAnalysis';
import { formatCurrency } from '../../lib/format';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';

export const NetProfitChart: React.FC = () => {
  const [includeTax, setIncludeTax] = useState(false);
  const { data: financeData, isLoading, error, refetch } = useFinanceData();
  const { data: costAnalysis } = useFinanceCostAnalysis();

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
          message="Не удалось загрузать финансовые данные"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!financeData || !costAnalysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          Нет данных для отображения графика чистой прибыли
        </div>
      </div>
    );
  }

  // Создаем данные для графика (пока используем единственную точку с текущими данными)
  const chartData = [
    {
      date: new Date().toISOString().split('T')[0],
      netProfit: financeData.summary.totalIncome - financeData.summary.totalExpenses - costAnalysis.totalCostPrice,
      netProfitWithTax: (financeData.summary.totalIncome - financeData.summary.totalExpenses - costAnalysis.totalCostPrice) * 0.94,
    }
  ];

  const formatXAxisLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getLineColor = () => {
    const netProfit = includeTax ? chartData[0]?.netProfitWithTax : chartData[0]?.netProfit;
    return netProfit >= 0 ? '#059669' : '#dc2626';
  };

  const getDataKey = () => includeTax ? 'netProfitWithTax' : 'netProfit';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          График чистой прибыли
        </h2>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeTax}
            onChange={(e) => setIncludeTax(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">С учетом 6% налога</span>
        </label>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              className="dark:stroke-gray-400"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value: number) => formatCurrency(value, { notation: 'compact' })}
              stroke="#64748b"
              className="dark:stroke-gray-400"
              fontSize={12}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Чистая прибыль']}
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

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Чистая прибыль = Доходы ({formatCurrency(financeData.summary.totalIncome)}) - 
          Расходы ({formatCurrency(financeData.summary.totalExpenses)}) - 
          Себестоимость ({formatCurrency(costAnalysis.totalCostPrice)})
        </p>
      </div>
    </div>
  );
};