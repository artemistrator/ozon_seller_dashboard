import React from 'react';
import { Calendar, Package, MapPin, RotateCcw } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';
import { formatMoscowDate, formatDateRange } from '../../lib/date-utils';

export const FilterBar: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useFilters();

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    updateFilters({ dateFrom: newDate });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    updateFilters({ dateTo: newDate });
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ sku: e.target.value });
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ region: e.target.value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={formatMoscowDate(filters.dateFrom)}
            onChange={handleDateFromChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent"
          />
          <span className="text-gray-400 dark:text-gray-500">—</span>
          <input
            type="date"
            value={formatMoscowDate(filters.dateTo)}
            onChange={handleDateToChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* SKU Filter */}
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="SKU"
          value={filters.sku}
          onChange={handleSkuChange}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent w-32"
        />
      </div>

      {/* Region Filter */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Регион"
          value={filters.region}
          onChange={handleRegionChange}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ozon-500 focus:border-transparent w-32"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Сбросить
      </button>

      {/* Active period display */}
      <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 ml-auto">
        {formatDateRange(filters.dateFrom, filters.dateTo)}
      </div>
    </div>
  );
};