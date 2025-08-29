import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { FinancePieChart } from '../components/charts/FinancePieChart';
import { StatCard } from '../components/ui/StatCard';
import { useFinanceData } from '../hooks/useFinanceData';
import { useFilters } from '../hooks/useFilters';

export const FinancePage: React.FC = () => {
  const { data } = useFinanceData();
  const { filters, updateFilters } = useFilters();

  const statsConfig = [
    {
      title: 'Общий доход',
      icon: <TrendingUp className="w-5 h-5" />,
      value: data?.summary.totalIncome,
      format: 'currency' as const,
    },
    {
      title: 'Общие расходы',
      icon: <TrendingDown className="w-5 h-5" />,
      value: data?.summary.totalExpenses,
      format: 'currency' as const,
    },
    {
      title: 'Чистая прибыль',
      icon: <DollarSign className="w-5 h-5" />,
      value: data?.summary.netProfit,
      format: 'currency' as const,
    },
    {
      title: 'Рентабельность',
      icon: <Activity className="w-5 h-5" />,
      value: data?.summary.totalIncome && data.summary.totalIncome > 0 
        ? (data.summary.netProfit / data.summary.totalIncome) * 100
        : 0,
      format: 'percentage' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Финансы</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Финансовая аналитика и распределение по категориям
          </p>
        </div>
        
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Период по:</span>
          <button
            onClick={() => updateFilters({ dateType: 'delivering_date' })}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.dateType === 'delivering_date'
                ? 'bg-ozon-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            По дате доставки
          </button>
          <button
            onClick={() => updateFilters({ dateType: 'shipment_date' })}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.dateType === 'shipment_date'
                ? 'bg-ozon-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            По дате отгрузки
          </button>
          <button
            onClick={() => updateFilters({ dateType: 'in_process_at' })}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.dateType === 'in_process_at'
                ? 'bg-ozon-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            По дате заказа
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value ?? null}
            format={stat.format}
            icon={stat.icon}
            loading={!data}
          />
        ))}
      </div>

      {/* Finance Pie Chart */}
      <FinancePieChart />

      {/* Additional Financial Breakdown */}
      {data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Детализация по категориям
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-green-800 dark:text-green-300">Продажи</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(data.summary.sales)}
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="font-medium text-red-800 dark:text-red-300">Комиссии</span>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.commissions))}
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="font-medium text-amber-800 dark:text-amber-300">Доставка</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.delivery))}
              </div>
            </div>

            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-violet-500 rounded-full" />
                <span className="font-medium text-violet-800 dark:text-violet-300">Возвраты</span>
              </div>
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.returns))}
              </div>
            </div>

            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                <span className="font-medium text-cyan-800 dark:text-cyan-300">Реклама</span>
              </div>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.ads))}
              </div>
            </div>

            <div className="p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-lime-500 rounded-full" />
                <span className="font-medium text-lime-800 dark:text-lime-300">Услуги</span>
              </div>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.services))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};