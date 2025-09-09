import React from 'react';
import { FileText, Calendar, DollarSign } from 'lucide-react';
import { DataTable, Column } from '../components/ui/DataTable';
import { 
  useTransactionsTable, 
  useTransactionsData, 
  TransactionDetail
} from '../hooks/useTransactionsData';
import { formatCurrency, formatNumber } from '../lib/format';

export const TransactionsPage: React.FC = () => {
  const { tableState, updateTableState } = useTransactionsTable();
  const { data: tableData, isLoading, error, refetch } = useTransactionsData(tableState);

  const columns: Column<TransactionDetail>[] = [
    {
      key: 'operation_date',
      label: 'Дата операции (operation_date)',
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
      label: 'Номер отправления (posting_number)',
      render: (value) => (
        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'operation_type',
      label: 'Тип операции (operation_type)',
      render: (value) => (
        <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[200px] truncate block font-mono" title={value}>
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'operation_type_name', 
      label: 'Название операции (operation_type_name)',
      render: (value) => (
        <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[250px] truncate block" title={value}>
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'accruals_for_sale',
      label: 'Выручка (accruals_for_sale)',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value > 0 ? 'text-green-600' : 'text-gray-400'
        }`}>
          {value > 0 ? formatCurrency(value) : '—'}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'sale_commission',
      label: 'Комиссия (sale_commission)',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value !== 0 ? 'text-red-600' : 'text-gray-400'
        }`}>
          {value !== 0 ? formatCurrency(Math.abs(value)) : '—'}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'amount',
      label: 'Сумма операции (amount)',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(value)}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'category',
      label: 'Категория (по ТЗ)',
      render: (value) => {
        const categoryMap: { [key: string]: { label: string; color: string } } = {
          'продажи/доставка/комиссия': { label: 'Продажи', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
          'эквайринг': { label: 'Эквайринг', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
          'реклама': { label: 'Реклама', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
          'агентские': { label: 'Агентские', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200' },
          'доставка': { label: 'Доставка', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
          'прочее': { label: 'Прочее', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
        };
        
        const categoryInfo = categoryMap[value] || categoryMap['прочее'];
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
        );
      },
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
    // Remove category filter functionality as requested
    console.log('Category filter removed');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Детализация</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Выписка Ozon: operation_date, operation_type_name, posting_number, accruals_for_sale, sale_commission, amount
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
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                По финансовым данным (ТЗ)
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Источник: finance_transactions</div>
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

      {/* Category Filter - Removed as requested */}
      
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