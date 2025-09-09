import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  Target,
  XCircle,
  Truck,
  Calculator
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { DailySalesChart } from '../components/charts/DailySalesChart';
import { useSalesMetrics, usePreviousSalesMetrics } from '../hooks/useSalesData';
import { useCostAnalysis } from '../hooks/useCostAnalysis';
import { useFilters } from '../hooks/useFilters';

export const SalesPage: React.FC = () => {
  const { data: currentMetrics, isLoading } = useSalesMetrics();
  const { data: previousMetrics } = usePreviousSalesMetrics();
  const { data: costAnalysis } = useCostAnalysis();
  const { filters, updateFilters } = useFilters();
  const [includeTax, setIncludeTax] = useState(false);

  const statsConfig = [
    {
      title: 'GMV',
      icon: <TrendingUp className="w-5 h-5" />,
      value: currentMetrics?.deliveredGmv,
      previousValue: previousMetrics?.deliveredGmv,
      format: 'currency' as const,
    },
    {
      title: 'Выручка',
      icon: <DollarSign className="w-5 h-5" />,
      value: currentMetrics?.deliveredRevenue,
      previousValue: previousMetrics?.deliveredRevenue,
      format: 'currency' as const,
    },
    {
      title: 'Себестоимость',
      icon: <Calculator className="w-5 h-5" />,
      value: costAnalysis?.totalCostPrice,
      previousValue: null,
      format: 'currency' as const,
    },
    {
      title: 'Чистая прибыль',
      icon: <Target className="w-5 h-5" />,
      value: costAnalysis ? (includeTax ? costAnalysis.netProfitAfterCostsAndTax : costAnalysis.netProfitAfterCosts) : null,
      previousValue: null,
      format: 'currency' as const,
    },
    {
      title: 'Заказы',
      icon: <ShoppingCart className="w-5 h-5" />,
      value: currentMetrics?.deliveredOrders,
      previousValue: previousMetrics?.deliveredOrders,
      format: 'number' as const,
    },
    {
      title: 'Единицы',
      icon: <Package className="w-5 h-5" />,
      value: currentMetrics?.deliveredUnits,
      previousValue: previousMetrics?.deliveredUnits,
      format: 'number' as const,
    },
    {
      title: 'Средний чек',
      icon: <TrendingUp className="w-5 h-5" />,
      value: currentMetrics?.avgOrderValue,
      previousValue: previousMetrics?.avgOrderValue,
      format: 'currency' as const,
    },
    {
      title: 'Отмены (GMV)',
      icon: <XCircle className="w-5 h-5" />,
      value: currentMetrics?.cancelledGmv,
      previousValue: previousMetrics?.cancelledGmv,
      format: 'currency' as const,
    },
    {
      title: 'В доставке (GMV)',
      icon: <Truck className="w-5 h-5" />,
      value: currentMetrics?.inDeliveryGmv,
      previousValue: previousMetrics?.inDeliveryGmv,
      format: 'currency' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Продажи</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Аналитика продаж и ключевые метрики эффективности
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

      {/* Daily Sales Chart */}
      <DailySalesChart />

      {/* Checkbox for including tax in net profit calculation */}
      {costAnalysis && (
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Учитывать 6% налог в чистой прибыли</span>
          </label>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value ?? null}
            previousValue={stat.previousValue ?? null}
            format={stat.format}
            icon={stat.icon}
            loading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};