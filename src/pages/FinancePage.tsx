import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Calculator } from 'lucide-react';
import { FinancePieChart } from '../components/charts/FinancePieChart';
import { NetProfitChart } from '../components/charts/NetProfitChart';
import { StatCard } from '../components/ui/StatCard';
import { useFinanceData } from '../hooks/useFinanceData';
import { useFinanceCostAnalysis } from '../hooks/useFinanceCostAnalysis';

export const FinancePage: React.FC = () => {
  const { data } = useFinanceData();
  const { data: costAnalysis } = useFinanceCostAnalysis(); // Используем финансовый анализ себестоимости
  const [includeTax, setIncludeTax] = useState(false);

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
      title: 'Рентабельность',
      icon: <Activity className="w-5 h-5" />,
      value: data?.summary.totalIncome && data.summary.totalIncome > 0 && costAnalysis
        ? (data.summary.totalIncome - data.summary.totalExpenses - costAnalysis.totalCostPrice) / data.summary.totalIncome * 100
        : 0,
      format: 'percentage' as const,
    },
    {
      title: 'Себестоимость',
      icon: <Calculator className="w-5 h-5" />,
      value: costAnalysis?.totalCostPrice,
      format: 'currency' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Финансы</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Финансовая аналитика и распределение по категориям (по датам финансовых операций)
        </p>
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

      {/* Чистая прибыль за вычетом себестоимости и всех расходов */}
      {costAnalysis && data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Чистая прибыль (доходы - расходы - себестоимость)
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Учитывать 6% налог</span>
            </label>
          </div>
          
          {(() => {
            // Расчитываем полную чистую прибыль
            const totalIncome = data.summary.totalIncome;
            const totalExpenses = data.summary.totalExpenses;
            const totalCostPrice = costAnalysis.totalCostPrice;
            
            const fullNetProfit = totalIncome - totalExpenses - totalCostPrice;
            const fullNetProfitWithTax = fullNetProfit * 0.94; // отнимаем 6%
            
            const finalProfit = includeTax ? fullNetProfitWithTax : fullNetProfit;
            
            return (
              <>
                <div className={`text-3xl font-bold mb-2 ${
                  finalProfit >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {Intl.NumberFormat('ru-RU', { 
                    style: 'currency', 
                    currency: 'RUB',
                    minimumFractionDigits: 0 
                  }).format(finalProfit)}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Доходы: {Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(totalIncome)}</div>
                  <div>Расходы: -{Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(totalExpenses)}</div>
                  <div>Себестоимость: -{Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(totalCostPrice)}</div>
                  {includeTax && <div>Налог 6%: -{Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(fullNetProfit * 0.06)}</div>}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-1 font-medium">
                    Итого: {Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(finalProfit)}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Net Profit Chart */}
      <NetProfitChart />

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
              <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                Σ accruals_for_sale
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
              <div className="text-xs text-red-700 dark:text-red-400 mt-1">
                Σ |sale_commission|
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="font-medium text-amber-800 dark:text-amber-300">Доставка/Логистика</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.delivery))}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                amount - (accruals + commission)
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
              <div className="text-xs text-cyan-700 dark:text-cyan-400 mt-1">
                Продвижение, трафареты, топ
              </div>
            </div>

            <div className="p-4 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-lime-500 rounded-full" />
                <span className="font-medium text-lime-800 dark:text-lime-300">Агентские</span>
              </div>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.services))}
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="font-medium text-orange-800 dark:text-orange-300">Эквайринг</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  minimumFractionDigits: 0 
                }).format(Math.abs(data.summary.acquiring))}
              </div>
            </div>

            {costAnalysis && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="font-medium text-gray-800 dark:text-gray-300">Чистая прибыль</span>
                </div>
                <div className={`text-2xl font-bold ${
                  (data.summary.totalIncome - data.summary.totalExpenses - costAnalysis.totalCostPrice) >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {Intl.NumberFormat('ru-RU', { 
                    style: 'currency', 
                    currency: 'RUB',
                    minimumFractionDigits: 0 
                  }).format(data.summary.totalIncome - data.summary.totalExpenses - costAnalysis.totalCostPrice)}
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                  Доходы - расходы - себестоимость
                </div>
              </div>
            )}

            {costAnalysis && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="font-medium text-purple-800 dark:text-purple-300">Себестоимость</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Intl.NumberFormat('ru-RU', { 
                    style: 'currency', 
                    currency: 'RUB',
                    minimumFractionDigits: 0 
                  }).format(costAnalysis.totalCostPrice)}
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                  Затраты на проданные товары
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};