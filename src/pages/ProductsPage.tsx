import React from 'react';
import { Package, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';
import { useProductsTable, useProductsData, useProductsMetrics, ProductPerformance } from '../hooks/useProductsData';
import { useFilters } from '../hooks/useFilters';
import { formatCurrency, formatNumber } from '../lib/format';

export const ProductsPage: React.FC = () => {
  const { tableState, updateTableState } = useProductsTable();
  const { data: tableData, isLoading, error, refetch } = useProductsData(tableState);
  const { data: metrics } = useProductsMetrics();
  const { filters, updateFilters } = useFilters();

  const columns: Column<ProductPerformance>[] = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{formatNumber(value)}</span>
      ),
    },
    {
      key: 'offer_id',
      label: 'Offer ID',
      render: (value) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px] block">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'product_name',
      label: 'Название товара',
      render: (value) => (
        <div className="max-w-[300px]">
          <span className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2" title={value}>
            {value || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'units',
      label: 'Единицы',
      sortable: true,
      render: (value) => formatNumber(value),
      className: 'text-center',
    },
    {
      key: 'gmv',
      label: 'GMV',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-center',
    },
    {
      key: 'revenue',
      label: 'Выручка',
      sortable: true,
      render: (value) => formatCurrency(value),
      className: 'text-center',
    },
    {
      key: 'netProfit',
      label: 'Чистая прибыль',
      sortable: false,
      render: () => (
        <span className="text-gray-500">
          —
        </span>
      ),
      className: 'text-center',
    },
  ];

  const handlePageChange = (newPage: number) => {
    updateTableState({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateTableState({ pageSize: newPageSize, page: 0 });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateTableState({ sortBy, sortOrder });
  };

  const handleSearchChange = (search: string) => {
    updateTableState({ search, page: 0 });
  };

  const statsConfig = [
    {
      title: 'Всего товаров',
      icon: <Package className="w-5 h-5" />,
      value: metrics?.totalProducts,
      format: 'number' as const,
    },
    {
      title: 'Общая выручка',
      icon: <DollarSign className="w-5 h-5" />,
      value: metrics?.totalRevenue,
      format: 'currency' as const,
    },
    {
      title: 'Общие продажи',
      icon: <ShoppingCart className="w-5 h-5" />,
      value: metrics?.totalUnits,
      format: 'number' as const,
    },
    {
      title: 'Средняя выручка с товара',
      icon: <TrendingUp className="w-5 h-5" />,
      value: metrics?.avgRevenuePerProduct,
      format: 'currency' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">По товарам</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Анализ эффективности товаров с детализацией по SKU
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
            loading={!metrics}
          />
        ))}
      </div>

      {/* Products Table */}
      <DataTable<ProductPerformance>
        columns={columns}
        data={tableData?.data || []}
        loading={isLoading}
        error={error}
        totalCount={tableData?.totalCount || 0}
        page={tableState.page}
        pageSize={tableState.pageSize}
        sortBy={tableState.sortBy}
        sortOrder={tableState.sortOrder}
        search={tableState.search}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onRetry={() => refetch()}
        searchPlaceholder="Поиск по SKU, Offer ID или названию товара..."
        emptyMessage="Товары не найдены. Попробуйте изменить фильтры или период."
      />
    </div>
  );
};