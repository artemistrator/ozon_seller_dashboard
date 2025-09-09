import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFilters } from '../hooks/useFilters';
import { formatMoscowDate } from '../lib/date-utils';
import { toNumber } from '../lib/format';

export const FinanceDiagnostic: React.FC = () => {
  const { filters } = useFilters();
  
  const { data: operationStats, isLoading, error } = useQuery({
    queryKey: ['operationStats', filters],
    queryFn: async () => {
      const isSingleDay = filters.dateFrom.toDateString() === filters.dateTo.toDateString();
      
      let query = supabase
        .from('finance_transactions')
        .select('operation_type, operation_type_name, amount');
      
      if (isSingleDay) {
        const singleDayDate = formatMoscowDate(filters.dateFrom);
        const nextDayDate = formatMoscowDate(new Date(filters.dateFrom.getTime() + 24 * 60 * 60 * 1000));
        query = query.gte('operation_date', singleDayDate).lt('operation_date', nextDayDate);
      } else {
        const fromDate = formatMoscowDate(filters.dateFrom);
        const toDateInclusive = formatMoscowDate(new Date(filters.dateTo.getTime() + 24 * 60 * 60 * 1000));
        query = query.gte('operation_date', fromDate).lt('operation_date', toDateInclusive);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Агрегируем данные
      const statsMap = new Map();
      (data || []).forEach((item: any) => {
        const key = `${item.operation_type}|||${item.operation_type_name}`;
        const amount = toNumber(item.amount || 0);
        
        if (statsMap.has(key)) {
          const existing = statsMap.get(key);
          existing.count += 1;
          existing.total_amount += Math.abs(amount);
        } else {
          statsMap.set(key, {
            operation_type: item.operation_type || 'N/A',
            operation_type_name: item.operation_type_name || 'N/A', 
            count: 1,
            total_amount: Math.abs(amount),
          });
        }
      });
      
      return Array.from(statsMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });
  
  if (isLoading) return <div>Загрузка диагностики...</div>;
  if (error) return <div>Ошибка: {error instanceof Error ? error.message : 'Unknown'}</div>;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">🔍 Диагностика операций</h3>
      <div className="text-sm mb-4">Найдено {operationStats?.length || 0} типов операций</div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {operationStats?.map((stat, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <div>
              <div className="font-mono text-sm text-gray-600">{stat.operation_type}</div>
              <div className="font-medium">{stat.operation_type_name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{stat.count} шт</div>
              <div className="font-medium">
                {stat.total_amount.toLocaleString('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB',
                  maximumFractionDigits: 0 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};