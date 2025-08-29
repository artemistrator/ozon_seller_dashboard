import React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: Error | null;
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSearchChange: (search: string) => void;
  onRetry?: () => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortOrder,
  search,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onRetry,
  searchPlaceholder = 'Поиск...',
  emptyMessage = 'Нет данных для отображения',
}: DataTableProps<T>) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalCount);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const newSortOrder = 
      sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column.key as string, newSortOrder);
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    if (sortBy !== column.key) {
      return <ChevronUp className="w-4 h-4 text-gray-300 dark:text-gray-600" />;
    }
    
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <ErrorMessage 
          message={error.message || 'Не удалось загрузить данные'}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Search and Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Показать:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
                    ${column.className || ''}
                  `}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <LoadingSpinner size="lg" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Показано {startItem}–{endItem} из {totalCount} записей
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(0)}
              disabled={page === 0}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (page < 2) {
                  pageNum = i;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`
                      px-3 py-1 text-sm rounded
                      ${pageNum === page 
                        ? 'bg-ozon-600 text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};