import React from 'react';
import { FileText, Hash, Calendar, DollarSign } from 'lucide-react';
import { DataTable, Column } from '../components/ui/DataTable';
import { 
  useTransactionsTable, 
  useTransactionsData, 
  useTransactionCategories,
  TransactionDetail,
  CATEGORY_LABELS 
} from '../hooks/useTransactionsData';
import { formatCurrency, formatNumber } from '../lib/format';

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    sales: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    commissions: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    delivery: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    returns: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
    ads: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
    services: 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300',
    other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  };
  return colors[category] || colors.other;
};

export const TransactionsPage: React.FC = () => {
  const { tableState, updateTableState } = useTransactionsTable();
  const { data: tableData, isLoading, error, refetch } = useTransactionsData(tableState);
  const { data: categories } = useTransactionCategories();

  const columns: Column<TransactionDetail>[] = [
    {
      key: 'operation_date_msk',
      label: 'Дата',
      sortable: true,
      render: (value) => {
        if (!value) return '—';
        const date = new Date(value);
        return (
          <div className="text-sm">
            <div className="font-medium">
              {date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString('ru-RU', { year: 'numeric' })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'posting_number',
      label: 'Номер отправления',
      render: (value) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'operation_type_name',
      label: 'Тип операции',
      render: (value) => (
        <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[200px] truncate block" title={value}>
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Категория',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(value)}`}>
          {CATEGORY_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Сумма',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(value)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'service_name',
      label: 'Услуга',
      render: (value, row) => {
        if (value) {
          return (
            <div className="text-sm">
              <div className="text-gray-900 dark:text-gray-100 max-w-[150px] truncate" title={value}>
                {value}
              </div>
              {row.service_price !== 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {formatCurrency(row.service_price)}
                </div>
              )}
            </div>
          );
        }
        return '—';
      },
    },
    {
      key: 'item_name',
      label: 'Товар',
      render: (value, row) => {
        if (value || row.item_sku) {
          return (
            <div className="text-sm">
              {row.item_sku > 0 && (
                <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  SKU: {formatNumber(row.item_sku)}
                </div>
              )}
              {value && (
                <div className="text-gray-900 dark:text-gray-100 max-w-[150px] truncate" title={value}>
                  {value}
                </div>
              )}
            </div>
          );
        }
        return '—';
      },
    },
    {
      key: 'warehouse_id',
      label: 'Склад',
      render: (value) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {value > 0 ? formatNumber(value) : '—'}
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

  const handleCategoryFilterChange = (category: string) => {
    updateTableState({ categoryFilter: category, page: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Детализация</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Детальная информация по всем финансовым операциям с возможностью поиска и фильтрации
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(tableData?.totalCount || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Всего операций</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Hash className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(categories?.length || 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Категорий</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {tableState.pageSize}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">На странице</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {tableState.search ? 'Поиск' : 'Все'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Фильтр активен</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories && categories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Фильтр по категории:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilterChange('')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  tableState.categoryFilter === ''
                    ? 'bg-ozon-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Все
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilterChange(category)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    tableState.categoryFilter === category
                      ? 'bg-ozon-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {CATEGORY_LABELS[category] || category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <DataTable<TransactionDetail>
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
        searchPlaceholder="Поиск по номеру отправления, типу операции, услуге или товару..."
        emptyMessage="Транзакции не найдены. Попробуйте изменить фильтры или период."
      />
    </div>
  );
};